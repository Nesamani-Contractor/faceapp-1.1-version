// Voice command grammar for hands-free step navigation (FR-FA-02 / FR-FA-03).
//
// Pure, dependency-free so it runs under `node --test` as well as in the app.
//
// Design goals:
//  * "Next", "Back", "Repeat" must fire reliably, including the common
//    mis-hearings speech engines produce for single short words.
//  * Background conversation must NOT move the guide. "I'll be back" or
//    "the next thing I want" should not fire, so a command word only counts
//    when it is spoken as a command: alone, or with filler words around it
//    ("okay next please", "can you repeat that", "go back").

export type VoiceCommand = 'next' | 'back' | 'repeat';

export const COMMANDS: readonly VoiceCommand[] = ['next', 'back', 'repeat'];

/** Phrases that bias the recogniser toward our vocabulary (iOS/Android contextual strings). */
export const CONTEXTUAL_STRINGS = ['next', 'next step', 'back', 'go back', 'previous', 'repeat', 'say that again'];

/** One command occurrence in a transcript, at word index `index`. */
export type CommandHit = { command: VoiceCommand; index: number };

// Multi-word phrases, matched before single words. Longest first.
const PHRASES: ReadonlyArray<[string[], VoiceCommand]> = [
  [['say', 'that', 'again'], 'repeat'],
  [['say', 'it', 'again'], 'repeat'],
  [['one', 'more', 'time'], 'repeat'],
  [['come', 'again'], 'repeat'],
  [['say', 'again'], 'repeat'],
  [['once', 'more'], 'repeat'],
  [['go', 'back'], 'back'],
  [['step', 'back'], 'back'],
  [['go', 'forward'], 'next'],
  [['move', 'on'], 'next'],
  [['next', 'one'], 'next'],
  [['last', 'step'], 'back'],
  [['previous', 'step'], 'back'],
  [['next', 'step'], 'next'],
];

// Single words, including frequent recogniser mis-hearings of the bare word.
const WORDS: Record<string, VoiceCommand> = {
  next: 'next',
  nxt: 'next',
  necks: 'next',
  neck: 'next',
  nest: 'next',
  forward: 'next',
  continue: 'next',
  skip: 'next',
  back: 'back',
  bac: 'back',
  bak: 'back',
  previous: 'back',
  prev: 'back',
  backward: 'back',
  backwards: 'back',
  repeat: 'repeat',
  repeats: 'repeat',
  ripit: 'repeat',
  again: 'repeat',
  pardon: 'repeat',
};

// Mis-hearings are only trusted when spoken on their own (the whole utterance),
// because they are real words in normal conversation.
const ONLY_WHEN_ALONE = new Set(['necks', 'neck', 'nest', 'bac', 'bak', 'ripit', 'continue', 'skip', 'pardon', 'forward']);

// Words that may surround a command without making it "conversation".
const FILLERS = new Set([
  'a', 'ah', 'all', 'alright', 'and', 'can', 'could', 'do', 'go', 'great', 'hey', 'hmm', 'i', 'it', 'just', 'let', "let's",
  'lets', 'like', 'magi', 'maggie', 'mm', 'move', 'next', 'no', 'now', 'oh', 'ok', 'okay', 'please', 'right', 'shine', 'so',
  'step', 'that', 'the', 'then', 'this', 'to', 'uh', 'um', 'umm', 'what', "what's", 'whats', 'yeah', 'yes', 'you', 'one',
  'more', 'time', 'say', 'once', 'come', 'me', 'that\'s', 'thats', 'done', 'good', 'nice', 'cool', 'thanks', 'thank',
  'again', 'back', 'repeat', 'previous', 'last', 'go', 'on', 'forward', 'please', 'up', 'us', 'we', 'well', 'wait',
]);

// Words that, right before a command word, mean it is not a command.
const NEGATORS = new Set(['not', "don't", 'dont', 'never', "didn't", 'didnt', "won't", 'wont', "can't", 'cant']);

/** Lower-case, strip punctuation, split into words. Keeps apostrophes inside words. */
export function tokenize(transcript: string): string[] {
  return transcript
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9'\s-]/g, ' ')
    .replace(/-/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/^'+|'+$/g, ''))
    .filter(Boolean);
}

// How far either side of a command we look for conversation.
const WINDOW = 3;

/** How many words in [from, to) are neither fillers nor part of a command. */
function contentWords(words: string[], from: number, to: number, skip: Set<number>): number {
  let n = 0;
  for (let i = Math.max(0, from); i < Math.min(words.length, to); i++) {
    if (skip.has(i)) continue;
    if (!FILLERS.has(words[i])) n++;
  }
  return n;
}

/**
 * Every command spoken *as a command* in `transcript`, in order.
 *
 * A command counts when, within three words either side of it, there is at most
 * one "content" word (a word that is not a filler or another command), and it
 * is not directly negated ("don't go back").
 */
export function findCommands(transcript: string): CommandHit[] {
  const words = tokenize(transcript);
  const hits: CommandHit[] = [];
  const used = new Set<number>();
  // [start, endExclusive, command]
  const spans: Array<[number, number, VoiceCommand]> = [];

  for (let i = 0; i < words.length; i++) {
    if (used.has(i)) continue;
    let matched = false;
    for (const [phrase, command] of PHRASES) {
      if (i + phrase.length > words.length) continue;
      if (phrase.every((p, k) => words[i + k] === p)) {
        for (let k = 0; k < phrase.length; k++) used.add(i + k);
        spans.push([i, i + phrase.length, command]);
        matched = true;
        break;
      }
    }
    if (matched) continue;
    const command = WORDS[words[i]];
    if (!command) continue;
    if (ONLY_WHEN_ALONE.has(words[i]) && words.length > 2) continue;
    used.add(i);
    spans.push([i, i + 1, command]);
  }

  // Every word that belongs to *some* command span is not "content".
  const commandWords = new Set<number>();
  for (const [s, e] of spans) for (let k = s; k < e; k++) commandWords.add(k);

  let prev: [number, number, VoiceCommand] | undefined;
  for (const span of spans) {
    const [s, e, command] = span;
    const negated = s > 0 && NEGATORS.has(words[s - 1]);
    const noise =
      contentWords(words, s - WINDOW, s, commandWords) + contentWords(words, e, e + WINDOW, commandWords);
    // "repeat that again" / "say it again please": one repeat, not two.
    const sameAsAdjacent =
      prev && prev[2] === command && command === 'repeat' && contentWords(words, prev[1], s, commandWords) === 0;
    if (!negated && noise <= 1 && !sameAsAdjacent) hits.push({ command, index: s });
    prev = span;
  }
  return hits;
}

/** Convenience: the commands only. */
export const parseCommands = (transcript: string): VoiceCommand[] => findCommands(transcript).map((h) => h.command);
