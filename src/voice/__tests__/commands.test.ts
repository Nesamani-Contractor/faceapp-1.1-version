/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCommands } from '../commands.ts';

const fires = (said: string, expected: string[]) =>
  test(`"${said}" → [${expected.join(', ')}]`, () => assert.deepEqual(parseCommands(said), expected));

// ── the three commands, as people actually say them ─────────────────────────
fires('next', ['next']);
fires('Next.', ['next']);
fires('NEXT!', ['next']);
fires('next step', ['next']);
fires('okay next', ['next']);
fires('ok next please', ['next']);
fires('next please', ['next']);
fires("what's next", ['next']);
fires('next one', ['next']);
fires('go forward', ['next']);
fires('move on', ['next']);
fires('hey magi next', ['next']);
fires('Maggie, next', ['next']);
fires('um next', ['next']);

fires('back', ['back']);
fires('Back.', ['back']);
fires('go back', ['back']);
fires('go back please', ['back']);
fires('previous', ['back']);
fires('previous step', ['back']);
fires('step back', ['back']);
fires('back one', ['back']);
fires('go back to the eyes', ['back']);

fires('repeat', ['repeat']);
fires('Repeat.', ['repeat']);
fires('repeat that', ['repeat']);
fires('can you repeat that', ['repeat']);
fires('can you repeat that please', ['repeat']);
fires('say that again', ['repeat']);
fires('say it again', ['repeat']);
fires('again', ['repeat']);
fires('one more time', ['repeat']);
fires('come again', ['repeat']);
fires('repeat that again', ['repeat']);
fires('pardon', ['repeat']);

// ── several commands in one breath ───────────────────────────────────────────
fires('next next', ['next', 'next']);
fires('next, next, next', ['next', 'next', 'next']);
fires('next back', ['next', 'back']);
fires('back, repeat', ['back', 'repeat']);

// ── common mis-hearings, trusted only on their own ───────────────────────────
fires('necks', ['next']);
fires('nest', ['next']);
fires('bak', ['back']);
fires('skip', ['next']);
fires('I hurt my neck yesterday', []);
fires('a bird made a nest in the tree', []);

// ── conversation and TV must NOT move the guide ──────────────────────────────
fires("I'll be back", []);
fires('I will be back in a minute', []);
fires('the next thing I want is coffee', []);
fires('next week we are going to Paris', []);
fires('my back hurts today', []);
fires('lean your head back slightly and blend', []);
fires('do not repeat that', []);
fires("don't go back", []);
fires('never go back', []);
fires("I can't go back", []);
fires('', []);
fires('   ', []);
fires('lipstick', []);
fires('hello there', []);
fires('feedback', []);
fires('backstage', []);
fires('nextdoor', []);

// ── narration text that happens to contain command words ─────────────────────
fires('Apply the next layer of mascara once the first is dry', []);
fires('Sweep the brush back toward your ears', []);
fires('Repeat the cut crease on the other eye with a plum shade', []);
