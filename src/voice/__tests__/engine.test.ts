/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  VoiceCommandEngine,
  type Availability,
  type Clock,
  type PermissionResult,
  type Recognizer,
  type RecognizerEvents,
  type StartOptions,
} from '../engine.ts';
import type { VoiceCommand } from '../commands.ts';

class FakeClock implements Clock {
  t = 0;
  private timers = new Map<number, { at: number; fn: () => void }>();
  private id = 0;
  now = () => this.t;
  setTimeout = (fn: () => void, ms: number) => {
    const id = ++this.id;
    this.timers.set(id, { at: this.t + ms, fn });
    return id;
  };
  clearTimeout = (h: unknown) => {
    this.timers.delete(h as number);
  };
  advance(ms: number) {
    const end = this.t + ms;
    for (;;) {
      const next = [...this.timers.entries()].filter(([, v]) => v.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      this.timers.delete(next[0]);
      this.t = next[1].at;
      next[1].fn();
    }
    this.t = end;
  }
}

class FakeRecognizer implements Recognizer {
  avail: Availability = { ok: true, supportsOnDevice: true };
  permission: PermissionResult = 'granted';
  events?: RecognizerEvents;
  starts: StartOptions[] = [];
  aborts = 0;
  running = false;
  autoStart = true;
  availability = () => this.avail;
  requestPermission = async () => this.permission;
  start = (o: StartOptions) => {
    this.starts.push(o);
    this.running = true;
    if (this.autoStart) this.events?.onStart();
  };
  abort = () => {
    this.aborts++;
    if (this.running) {
      this.running = false;
      this.events?.onEnd();
    }
  };
  subscribe = (e: RecognizerEvents) => {
    this.events = e;
    return () => {
      this.events = undefined;
    };
  };
  // helpers
  say(text: string, isFinal = false) {
    this.events?.onResult([text], isFinal);
  }
  endSession() {
    this.running = false;
    this.events?.onEnd();
  }
  fail(code: string) {
    this.events?.onError(code, code);
  }
}

async function setup(opts: { restartAfterCommand?: boolean } = {}) {
  const clock = new FakeClock();
  const rec = new FakeRecognizer();
  const engine = new VoiceCommandEngine(rec, { clock, ...opts });
  const heard: VoiceCommand[] = [];
  engine.onCommand((c) => heard.push(c));
  return { clock, rec, engine, heard };
}

test('enable → permission → listening, commands are delivered', async () => {
  const { rec, engine, heard } = await setup();
  assert.equal(await engine.enable(), 'listening');
  assert.equal(rec.starts.length, 1);
  assert.equal(rec.starts[0].onDevice, true);
  rec.say('next');
  rec.say('next', true);
  rec.say('back', true);
  rec.say('can you repeat that', true);
  assert.deepEqual(heard, ['next', 'back', 'repeat']);
  assert.equal(engine.getSnapshot().lastCommand?.seq, 3);
});

test('keeps listening when the OS ends the session (silence, Android ≤12, iOS 1-minute cap)', async () => {
  const { clock, rec, engine, heard } = await setup();
  await engine.enable();
  for (let i = 0; i < 20; i++) {
    rec.endSession();
    clock.advance(200);
  }
  assert.equal(rec.starts.length, 21);
  assert.equal(engine.getSnapshot().status, 'listening');
  rec.say('next', true);
  assert.deepEqual(heard, ['next']);
});

test('silence errors (no-speech) are not failures and never back off', async () => {
  const { clock, rec, engine } = await setup();
  await engine.enable();
  for (let i = 0; i < 10; i++) {
    rec.fail('no-speech');
    rec.endSession();
    clock.advance(160);
  }
  assert.equal(rec.starts.length, 11);
  assert.equal(engine.getSnapshot().status, 'listening');
});

test('network errors back off exponentially, show degraded, then recover on speech', async () => {
  const { clock, rec, engine, heard } = await setup();
  await engine.enable();
  const startTimes: number[] = [];
  for (let i = 0; i < 5; i++) {
    rec.fail('network');
    rec.endSession();
    const before = rec.starts.length;
    while (rec.starts.length === before) clock.advance(50);
    startTimes.push(clock.t);
  }
  const gaps = startTimes.slice(1).map((t, i) => t - startTimes[i]);
  for (let i = 1; i < gaps.length; i++) assert.ok(gaps[i] >= gaps[i - 1], `back-off grows: ${gaps}`);
  assert.ok(gaps.every((g) => g <= 4100), 'capped at ~4s');
  assert.equal(engine.getSnapshot().status, 'degraded');
  rec.say('next', true);
  assert.equal(engine.getSnapshot().status, 'listening');
  assert.deepEqual(heard, ['next']);
});

test('error without a following end event still restarts (after grace)', async () => {
  const { clock, rec, engine } = await setup();
  await engine.enable();
  rec.fail('client'); // no end event
  clock.advance(3000);
  assert.ok(rec.starts.length >= 2);
});

test('does not start a second session while the first is still shutting down', async () => {
  const { clock, rec, engine } = await setup();
  await engine.enable();
  rec.fail('busy');
  clock.advance(300); // before grace expires, end not yet received
  assert.equal(rec.starts.length, 1);
  rec.endSession();
  clock.advance(1000);
  assert.equal(rec.starts.length, 2);
});

test('permission denied is a clear final state; no mic use', async () => {
  const { rec, engine } = await setup();
  rec.permission = 'denied';
  assert.equal(await engine.enable(), 'permission-denied');
  assert.equal(rec.starts.length, 0);
});

test('browser-style not-allowed error at start → permission-denied, stops retrying', async () => {
  const { clock, rec, engine } = await setup();
  await engine.enable();
  rec.fail('not-allowed');
  rec.endSession();
  clock.advance(10_000);
  assert.equal(engine.getSnapshot().status, 'permission-denied');
  assert.equal(rec.starts.length, 1);
});

test('missing native module (Expo Go) → needs-dev-build', async () => {
  const { rec, engine } = await setup();
  rec.avail = { ok: false, reason: 'needs-dev-build' };
  assert.equal(await engine.enable(), 'needs-dev-build');
  assert.equal(rec.starts.length, 0);
});

test('on-device model missing → falls back to server recognition once, then gives up clearly', async () => {
  const { clock, rec, engine } = await setup();
  await engine.enable();
  rec.fail('language-not-supported');
  rec.endSession();
  clock.advance(500);
  assert.equal(rec.starts.length, 2);
  assert.equal(rec.starts[1].onDevice, false);
  rec.fail('language-not-supported');
  rec.endSession();
  clock.advance(10_000);
  assert.equal(engine.getSnapshot().status, 'service-disabled');
  assert.equal(rec.starts.length, 2);
});

test('watchdog: a start() that never answers is retried', async () => {
  const { clock, rec, engine } = await setup();
  rec.autoStart = false;
  await engine.enable();
  assert.equal(engine.getSnapshot().status, 'starting');
  clock.advance(6000);
  assert.ok(rec.aborts >= 1);
  clock.advance(1000);
  assert.ok(rec.starts.length >= 2);
});

test('background pauses (mic released), foreground resumes', async () => {
  const { clock, rec, engine, heard } = await setup();
  await engine.enable();
  engine.setForeground(false);
  assert.equal(engine.getSnapshot().status, 'paused');
  assert.equal(rec.running, false);
  clock.advance(10_000);
  assert.equal(rec.starts.length, 1, 'no restarts while backgrounded');
  engine.setForeground(true);
  assert.equal(rec.starts.length, 2);
  rec.say('back', true);
  assert.deepEqual(heard, ['back']);
});

test('disable releases the mic and ignores late events', async () => {
  const { clock, rec, engine, heard } = await setup();
  await engine.enable();
  engine.disable();
  assert.equal(engine.getSnapshot().status, 'off');
  assert.equal(rec.running, false);
  rec.say('next', true);
  clock.advance(10_000);
  assert.deepEqual(heard, []);
  assert.equal(rec.starts.length, 1);
});

test('disable during the permission prompt wins', async () => {
  const { rec, engine } = await setup();
  const p = engine.enable();
  engine.disable();
  await p;
  assert.equal(rec.starts.length, 0);
  assert.equal(engine.getSnapshot().status, 'off');
});

test('narration is filtered, barge-in still works', async () => {
  const { rec, engine, heard } = await setup();
  await engine.enable();
  engine.setNarration('Sweep it back. Then go back over the lid.');
  rec.say('go back', true);
  rec.say('next', true);
  assert.deepEqual(heard, ['next']);
});

test('iOS: session restarts after a command once the user is quiet, so "next … next" fires twice', async () => {
  const { clock, rec, engine, heard } = await setup({ restartAfterCommand: true });
  await engine.enable();
  rec.say('next');
  assert.deepEqual(heard, ['next']);
  clock.advance(800); // quiet → abort → end → restart
  clock.advance(300);
  assert.equal(rec.starts.length, 2);
  rec.say('next'); // fresh transcript
  assert.deepEqual(heard, ['next', 'next']);
});

test('a throwing command handler never kills listening', async () => {
  const { rec, engine } = await setup();
  let calls = 0;
  engine.onCommand(() => {
    calls++;
    throw new Error('boom');
  });
  await engine.enable();
  rec.say('next', true);
  rec.say('back', true);
  assert.equal(calls, 2);
  assert.equal(engine.getSnapshot().status, 'listening');
});
