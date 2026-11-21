/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CommandTracker } from '../tracker.ts';

test('fires on the first interim result and never again for the same utterance', () => {
  const t = new CommandTracker();
  assert.deepEqual(t.ingest(['ne'], false, 0).commands, []);
  assert.deepEqual(t.ingest(['next'], false, 50).commands, ['next']);
  assert.deepEqual(t.ingest(['next'], false, 120).commands, []);
  assert.deepEqual(t.ingest(['next'], true, 300).commands, []);
});

test('a growing transcript fires only the new command', () => {
  const t = new CommandTracker();
  assert.deepEqual(t.ingest(['next'], false, 0).commands, ['next']);
  assert.deepEqual(t.ingest(['next back'], false, 400).commands, ['back']);
  assert.deepEqual(t.ingest(['next back next'], false, 800).commands, ['next']);
});

test('after a final result the next utterance starts fresh', () => {
  const t = new CommandTracker();
  assert.deepEqual(t.ingest(['next'], true, 0).commands, ['next']);
  assert.deepEqual(t.ingest(['next'], false, 1500).commands, ['next']);
});

test('engine revising a fired word does not re-fire or undo', () => {
  const t = new CommandTracker();
  assert.deepEqual(t.ingest(['back'], false, 0).commands, ['back']);
  assert.deepEqual(t.ingest(['black'], false, 100).commands, []);
  assert.deepEqual(t.ingest(['black back'], false, 200).commands, []);
});

test('iOS-style silent new segment after a pause (different first word) is detected', () => {
  const t = new CommandTracker();
  assert.deepEqual(t.ingest(['next'], false, 0).commands, ['next']);
  assert.deepEqual(t.ingest(['back'], false, 2500).commands, ['back']);
});

test('iOS-style silent new segment that is shorter is detected', () => {
  const t = new CommandTracker();
  assert.deepEqual(t.ingest(['okay next'], false, 0).commands, ['next']);
  assert.deepEqual(t.ingest(['okay'], false, 2500).commands, []);
  assert.deepEqual(t.ingest(['okay next'], false, 2600).commands, ['next']);
});

test('alternatives rescue a final result only when they are short', () => {
  const t = new CommandTracker();
  assert.deepEqual(t.ingest(['text', 'next'], true, 0).commands, ['next']);
  const t2 = new CommandTracker();
  assert.deepEqual(t2.ingest(['text me later', 'next me later please now'], true, 0).commands, []);
});

test('our own narration is not obeyed while it plays and shortly after', () => {
  const t = new CommandTracker({ echoTailMs: 700 });
  t.setEcho('Go back over the lid with a little more shimmer, then repeat', 0);
  const r = t.ingest(['back'], false, 100);
  assert.deepEqual(r.commands, []);
  assert.deepEqual(r.suppressed, ['back']);
  t.ingest(['back'], true, 150);
  t.setEcho(null, 1000);
  assert.deepEqual(t.ingest(['repeat'], true, 1500).commands, []); // inside the tail
  assert.deepEqual(t.ingest(['repeat'], true, 1800).commands, ['repeat']); // after the tail
});

test('barge-in: a command word not in the narration is obeyed while narrating', () => {
  const t = new CommandTracker();
  t.setEcho('Dewy skin tint, concealer only where you need it.', 0);
  assert.deepEqual(t.ingest(['next'], false, 300).commands, ['next']);
});
