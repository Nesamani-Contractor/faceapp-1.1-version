// VoiceCommandEngine — keeps the microphone listening for "next / back /
// repeat" for as long as the guide is open, and survives everything mobile
// speech engines throw at it:
//
//  * sessions that end on their own (Android ≤ 12 has no continuous mode,
//    iOS caps a session at about a minute, silence time-outs everywhere)
//  * transient errors (network, busy, client, audio interrupted) → retried
//    with exponential back-off, never a dead mic
//  * permission refusal and missing native module → clear, final states
//  * on-device model missing → falls back to server recognition once
//  * a start() that never answers → watchdog aborts and retries
//  * the app going to the background → paused, then resumed
//
// The platform recogniser is injected (see ./recognizer.ts), so the whole state
// machine is unit-tested with a fake one (see ./__tests__/engine.test.ts).

import type { VoiceCommand } from './commands.ts';
import { CommandTracker } from './tracker.ts';

export type Availability =
  | { ok: true; supportsOnDevice: boolean }
  | { ok: false; reason: 'needs-dev-build' | 'unsupported' | 'service-disabled' };

export type PermissionResult = 'granted' | 'denied' | 'blocked';

export type RecognizerEvents = {
  onStart(): void;
  onEnd(): void;
  /** Alternatives, best first. */
  onResult(transcripts: string[], isFinal: boolean): void;
  onError(code: string, message: string): void;
};

export type StartOptions = { onDevice: boolean };

export interface Recognizer {
  availability(): Availability;
  requestPermission(): Promise<PermissionResult>;
  start(opts: StartOptions): void;
  abort(): void;
  subscribe(events: RecognizerEvents): () => void;
}

export type Clock = {
  now(): number;
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
};

export const realClock: Clock = {
  now: () => Date.now(),
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
};

export type VoiceStatus =
  | 'off' // user has voice turned off
  | 'requesting-permission'
  | 'starting'
  | 'listening'
  | 'paused' // app in background
  | 'degraded' // still retrying, but repeated failures (usually network)
  | 'permission-denied'
  | 'needs-dev-build'
  | 'unsupported'
  | 'service-disabled';

export type EngineSnapshot = {
  status: VoiceStatus;
  /** Last thing the recogniser heard (for the "Heard: …" line), if any. */
  heard: string;
  /** Last command acted on, with a counter so repeated commands re-trigger UI. */
  lastCommand?: { command: VoiceCommand; seq: number };
};

export type EngineOptions = {
  clock?: Clock;
  /** Restart the session after each command once the user goes quiet (iOS). */
  restartAfterCommand?: boolean;
};

const RESTART_DELAY_MS = 150;
const MAX_BACKOFF_MS = 4000;
const DEGRADED_AFTER_FAILURES = 4;
const START_WATCHDOG_MS = 5000;
const QUIET_BEFORE_SEGMENT_RESTART_MS = 700;

const END_AFTER_ERROR_GRACE_MS = 800;
const END_AFTER_BENIGN_ERROR_GRACE_MS = 2500;

// Errors that are part of normal listening (silence, our own aborts).
const BENIGN = new Set(['no-speech', 'speech-timeout', 'aborted', 'nomatch']);

export class VoiceCommandEngine {
  private snapshot: EngineSnapshot = { status: 'off', heard: '' };
  private listeners = new Set<(s: EngineSnapshot) => void>();
  private commandHandler: (c: VoiceCommand) => void = () => {};
  private tracker = new CommandTracker();
  private readonly clock: Clock;
  private readonly restartAfterCommand: boolean;
  private unsubscribe?: () => void;

  private wanted = false; // user wants voice on
  private foreground = true;
  private active = false; // recogniser session running (start requested, not ended)
  private onDevice = false;
  private failures = 0;
  private seq = 0;
  private generation = 0; // invalidates stale timers/callbacks
  private restartTimer: unknown;
  private watchdogTimer: unknown;
  private quietTimer: unknown;
  private endGraceTimer: unknown;
  private firedThisSession = false;

  private readonly recognizer: Recognizer;

  constructor(recognizer: Recognizer, opts: EngineOptions = {}) {
    this.recognizer = recognizer;
    this.clock = opts.clock ?? realClock;
    this.restartAfterCommand = opts.restartAfterCommand ?? false;
  }

  // ── public API ────────────────────────────────────────────────────────────

  getSnapshot = () => this.snapshot;

  subscribe = (fn: (s: EngineSnapshot) => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  onCommand(fn: (c: VoiceCommand) => void) {
    this.commandHandler = fn;
  }

  /** Turn listening on. Asks for permission the first time. */
  async enable(): Promise<VoiceStatus> {
    if (this.wanted) return this.snapshot.status;
    const avail = this.recognizer.availability();
    if (!avail.ok) {
      this.set({ status: avail.reason });
      return avail.reason;
    }
    this.onDevice = avail.supportsOnDevice;
    this.wanted = true;
    const gen = ++this.generation;
    this.set({ status: 'requesting-permission' });
    let perm: PermissionResult;
    try {
      perm = await this.recognizer.requestPermission();
    } catch {
      perm = 'denied';
    }
    if (gen !== this.generation || !this.wanted) return this.snapshot.status; // disabled meanwhile
    if (perm !== 'granted') {
      this.wanted = false;
      this.set({ status: 'permission-denied' });
      return 'permission-denied';
    }
    this.attach();
    this.failures = 0;
    if (this.foreground) this.startSession();
    else this.set({ status: 'paused' });
    return this.snapshot.status;
  }

  /** Turn listening off and release the microphone. */
  disable() {
    this.wanted = false;
    this.generation++;
    this.stopSession();
    this.detach();
    if (!isTerminal(this.snapshot.status)) this.set({ status: 'off' });
  }

  /** App moved to background (false) or foreground (true). */
  setForeground(foreground: boolean) {
    if (this.foreground === foreground) return;
    this.foreground = foreground;
    if (!this.wanted) return;
    if (!foreground) {
      this.stopSession();
      this.set({ status: 'paused' });
    } else {
      this.failures = 0;
      this.startSession();
    }
  }

  /** Narration started (text) or finished (null): filters our own voice. */
  setNarration(text: string | null) {
    this.tracker.setEcho(text, this.clock.now());
  }

  /** Tear everything down (screen unmount). Safe to enable() again later. */
  dispose() {
    this.disable();
  }

  // ── session management ───────────────────────────────────────────────────

  private attach() {
    if (this.unsubscribe) return;
    this.unsubscribe = this.recognizer.subscribe({
      onStart: () => this.handleStart(),
      onEnd: () => this.handleEnd(),
      onResult: (t, f) => this.handleResult(t, f),
      onError: (c, m) => this.handleError(c, m),
    });
  }

  private detach() {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
  }

  private startSession() {
    this.clearTimers();
    if (!this.wanted || !this.foreground) return;
    if (this.active) {
      // Never stack sessions: abort, and let onEnd bring us back here.
      this.recognizer.abort();
      return;
    }
    this.tracker.reset();
    this.firedThisSession = false;
    this.active = true;
    if (this.snapshot.status !== 'listening' && this.snapshot.status !== 'degraded') this.set({ status: 'starting' });
    const gen = this.generation;
    this.watchdogTimer = this.clock.setTimeout(() => {
      if (gen !== this.generation || !this.active) return;
      // start() never produced start/end: kick it.
      this.failures++;
      this.active = false;
      this.recognizer.abort();
      this.scheduleRestart();
    }, START_WATCHDOG_MS);
    try {
      this.recognizer.start({ onDevice: this.onDevice });
    } catch (e) {
      this.active = false;
      this.handleError('client', String(e));
    }
  }

  private stopSession() {
    this.clearTimers();
    if (this.active) {
      this.active = false;
      try {
        this.recognizer.abort();
      } catch {
        // already stopped
      }
    }
  }

  private scheduleRestart() {
    if (!this.wanted || !this.foreground) return;
    this.clock.clearTimeout(this.restartTimer);
    const delay =
      this.failures === 0 ? RESTART_DELAY_MS : Math.min(MAX_BACKOFF_MS, RESTART_DELAY_MS * 2 ** this.failures);
    const gen = this.generation;
    this.restartTimer = this.clock.setTimeout(() => {
      if (gen === this.generation) this.startSession();
    }, delay);
  }

  private clearTimers() {
    this.clock.clearTimeout(this.restartTimer);
    this.clock.clearTimeout(this.watchdogTimer);
    this.clock.clearTimeout(this.quietTimer);
    this.clock.clearTimeout(this.endGraceTimer);
  }

  // ── recogniser events ─────────────────────────────────────────────────────

  private handleStart() {
    if (!this.wanted) return;
    this.clock.clearTimeout(this.watchdogTimer);
    this.active = true;
    this.set({ status: this.failures >= DEGRADED_AFTER_FAILURES ? 'degraded' : 'listening' });
  }

  private handleEnd() {
    this.clock.clearTimeout(this.watchdogTimer);
    this.clock.clearTimeout(this.quietTimer);
    this.clock.clearTimeout(this.endGraceTimer);
    this.active = false;
    if (!this.wanted || !this.foreground) return;
    // Sessions end all the time (silence, OS limits): just keep listening.
    this.scheduleRestart();
  }

  private handleResult(transcripts: string[], isFinal: boolean) {
    if (!this.wanted) return;
    this.clock.clearTimeout(this.watchdogTimer); // results prove the session is alive
    this.failures = 0;
    if (this.snapshot.status === 'degraded' || this.snapshot.status === 'starting') this.set({ status: 'listening' });
    const { commands } = this.tracker.ingest(transcripts, isFinal, this.clock.now());
    const heard = (transcripts[0] ?? '').trim();
    if (heard) this.set({ heard });
    for (const command of commands) {
      this.firedThisSession = true;
      this.set({ lastCommand: { command, seq: ++this.seq } });
      try {
        this.commandHandler(command);
      } catch {
        // a UI handler error must never kill the listener
      }
    }
    if (this.restartAfterCommand && this.firedThisSession && !isFinal) {
      // Give the engine a clean transcript for the next command once the user
      // has gone quiet, so "next … next" is two commands, not one.
      this.clock.clearTimeout(this.quietTimer);
      const gen = this.generation;
      this.quietTimer = this.clock.setTimeout(() => {
        if (gen !== this.generation || !this.active) return;
        this.recognizer.abort(); // onEnd → restart
      }, QUIET_BEFORE_SEGMENT_RESTART_MS);
    }
  }

  private handleError(code: string, _message: string) {
    if (!this.wanted) return;
    this.clock.clearTimeout(this.watchdogTimer);
    if (code === 'not-allowed') {
      this.wanted = false;
      this.stopSession();
      this.detach();
      this.set({ status: 'permission-denied' });
      return;
    }
    if (code === 'service-not-allowed' || code === 'language-not-supported') {
      if (this.onDevice) {
        // On-device model missing: fall back to server recognition.
        this.onDevice = false;
      } else {
        this.wanted = false;
        this.stopSession();
        this.detach();
        this.set({ status: 'service-disabled' });
        return;
      }
    } else if (!BENIGN.has(code)) {
      // network, busy, client, interrupted, audio-capture, unknown…
      this.failures++;
      if (this.failures >= DEGRADED_AFTER_FAILURES) this.set({ status: 'degraded' });
    }
    // Engines normally follow `error` with `end`, and handleEnd() restarts.
    // Waiting for it avoids starting a new session while the old one is still
    // shutting down (Android answers that with "busy"). Some engines never send
    // `end` after an error, so restart ourselves after a short grace period.
    this.clock.clearTimeout(this.endGraceTimer);
    const gen = this.generation;
    this.endGraceTimer = this.clock.setTimeout(() => {
      if (gen !== this.generation || !this.active) return;
      this.active = false;
      try {
        this.recognizer.abort();
      } catch {
        // already stopped
      }
      this.scheduleRestart();
    }, BENIGN.has(code) ? END_AFTER_BENIGN_ERROR_GRACE_MS : END_AFTER_ERROR_GRACE_MS);
  }

  private set(patch: Partial<EngineSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch };
    for (const fn of this.listeners) fn(this.snapshot);
  }
}

const isTerminal = (s: VoiceStatus) =>
  s === 'permission-denied' || s === 'needs-dev-build' || s === 'unsupported' || s === 'service-disabled';
