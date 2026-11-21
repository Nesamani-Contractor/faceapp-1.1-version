// Turns a stream of (interim + final) recogniser transcripts into discrete
// commands, exactly once each.
//
// Speech engines re-send the growing transcript of the current utterance many
// times ("ne" → "next" → "next" → final "next"). We act on the *first* interim
// result that contains a command (lowest latency) and never fire it again for
// the same utterance, even when the engine later revises or finalises it.
//
// It also filters the app's own narration: while Shine Me is reading a step
// aloud the microphone hears it, so command words that occur in the text being
// spoken are ignored until shortly after narration stops.

import { findCommands, tokenize, type VoiceCommand } from './commands.ts';

export type TrackerOptions = {
  /** A pause this long between results with a changed opening word = a new utterance. */
  segmentGapMs?: number;
  /** After narration stops, keep filtering its words for this long (recogniser lag). */
  echoTailMs?: number;
};

export type Ingested = {
  /** Commands to act on now, in order. */
  commands: VoiceCommand[];
  /** Commands heard but dropped because they were our own narration. */
  suppressed: VoiceCommand[];
};

const MAX_ALTERNATIVE_WORDS = 3;

export class CommandTracker {
  private consumed = 0;
  private firstWord: string | undefined;
  private wordCount = 0;
  private lastResultAt = -Infinity;
  private echoWords = new Set<string>();
  private echoUntil = -Infinity; // Infinity while narration is playing.
  private readonly segmentGapMs: number;
  private readonly echoTailMs: number;

  constructor(opts: TrackerOptions = {}) {
    this.segmentGapMs = opts.segmentGapMs ?? 900;
    this.echoTailMs = opts.echoTailMs ?? 700;
  }

  /** Start of a new recognition session: forget the previous utterance. */
  reset() {
    this.consumed = 0;
    this.firstWord = undefined;
    this.wordCount = 0;
    this.lastResultAt = -Infinity;
  }

  /** Narration started (text) or stopped (null). */
  setEcho(text: string | null, now: number) {
    if (text) {
      this.echoWords = new Set(tokenize(text));
      this.echoUntil = Infinity;
    } else if (this.echoUntil === Infinity) {
      this.echoUntil = now + this.echoTailMs;
    }
  }

  private isEcho(command: VoiceCommand, transcript: string, index: number, now: number) {
    if (now > this.echoUntil) return false;
    const word = tokenize(transcript)[index];
    return word !== undefined && this.echoWords.has(word);
  }

  /**
   * Feed one recogniser result. `transcripts` are the alternatives, best first.
   */
  ingest(transcripts: string[], isFinal: boolean, now: number): Ingested {
    const out: Ingested = { commands: [], suppressed: [] };
    const top = transcripts[0] ?? '';
    const words = tokenize(top);

    // After a pause, a different opening word or a shorter transcript means the
    // engine started a new utterance without telling us (iOS can do this in
    // continuous mode). The engine also restarts the session after a command
    // on iOS, so this is a second line of defence.
    if (
      this.firstWord !== undefined &&
      now - this.lastResultAt > this.segmentGapMs &&
      (words[0] !== this.firstWord || words.length < this.wordCount)
    ) {
      this.consumed = 0;
    }
    this.lastResultAt = now;
    if (words.length) this.firstWord = words[0];
    this.wordCount = words.length;

    let source = top;
    let hits = findCommands(top);
    // On a final result with nothing in the best guess, a short alternative
    // ("text" → alt "next") is a safe second chance.
    if (isFinal && hits.length === 0 && this.consumed === 0) {
      for (const alt of transcripts.slice(1)) {
        if (tokenize(alt).length > MAX_ALTERNATIVE_WORDS) continue;
        const altHits = findCommands(alt);
        if (altHits.length) {
          source = alt;
          hits = altHits;
          break;
        }
      }
    }

    // `consumed` is a high-water mark: if the engine revises the utterance and
    // drops a command we already acted on, we neither undo it nor re-fire when
    // it reappears. A double "next" (skipping a step) is worse than a miss.
    for (const hit of hits.slice(this.consumed)) {
      if (this.isEcho(hit.command, source, hit.index, now)) out.suppressed.push(hit.command);
      else out.commands.push(hit.command);
    }
    this.consumed = Math.max(this.consumed, hits.length);

    if (isFinal) {
      this.consumed = 0;
      this.firstWord = undefined;
      this.wordCount = 0;
    }
    return out;
  }
}
