import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import catalog from './catalog/campaign-02.mjs';

const programs = new Map(catalog.map(({ id, code }) => [id, code]));

test('explorer programs render as native blocks with no gray TypeScript fallback statements', async () => {
  for (const { id } of catalog) {
    const svg = await readFile(new URL(`../../src/assets/lesson-visuals/blocks/${id}.svg`, import.meta.url), 'utf8');
    assert.ok(!/class="[^"]*\btypescript_(?:statement|expression)\b/.test(svg), `${id}: gray TypeScript fallback is not a teachable native block`);
  }
});

test('lesson 5 verification keeps the unchanged three-section program', () => {
  assert.equal(programs.get('lesson-05-step-06'), programs.get('lesson-05-step-04'));
});

test('lesson 7 starts without overlap handlers and then reuses rather than destroys Food', () => {
  const freshArena = programs.get('lesson-07-step-01');
  const reusableFood = programs.get('lesson-07-step-03');
  assert.doesNotMatch(freshArena, /sprites\.onOverlap/);
  assert.match(reusableFood, /sprites\.onOverlap\(SpriteKind\.Player, SpriteKind\.Food/);
  assert.match(reusableFood, /otherSprite\.setPosition/);
  assert.doesNotMatch(reusableFood, /otherSprite\.destroy/);
});

test('lesson 7 checks the updated score before WIN', () => {
  const program = programs.get('lesson-07-step-04');
  assert.match(program, /info\.changeScoreBy\(1\)/);
  assert.match(program, /if \(info\.score\(\) == 5\)/);
  assert.ok(program.indexOf('info.changeScoreBy(1)') < program.indexOf('if (info.score() == 5)'));
  assert.ok(program.indexOf('if (info.score() == 5)') < program.indexOf('game.over(true)'));
});

test('lesson 8 keeps inclusive random screen bounds without excluding repeats', () => {
  const program = programs.get('lesson-08-step-04');
  assert.match(program, /otherSprite\.setPosition\(randint\(8, 152\), randint\(8, 112\)\)/);
  assert.doesNotMatch(program, /while|do\s*\{/);
});
