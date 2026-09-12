import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import catalog from './catalog/campaign-03.mjs';

const programs = new Map(catalog.map(({ id, code }) => [id, code]));

// Execute the actual accumulated program at its Arcade API boundary. These
// deterministic checks complement, rather than claim to be, native simulation.
function runProgram(id, random = 2) {
  const state = { score: undefined, life: undefined, messages: [], created: [], overlaps: [], intervals: [], wins: [], setup: [] };
  const context = {
    img: () => ({}), randint: () => random,
    SpriteKind: { Player: 0, Projectile: 1, Enemy: 2, create: () => 3 },
    SpriteFlag: { AutoDestroy: 1 }, effects: { fire: 0, disintegrate: 1 }, ControllerButtonEvent: { Pressed: 0 },
    controller: { moveSprite() {}, A: { onEvent: (_event, handler) => { state.pressA = handler; state.setup.push('A'); } } },
    sprites: {
      create: (_image, kind) => {
        const sprite = { kind, flags: [], setPosition(x, y) { this.x = x; this.y = y; }, setStayInScreen() {}, setBounceOnWall() {},
          setFlag(flag, enabled) { this.flags.push([flag, enabled]); }, destroy() { this.destroyed = true; } };
        state.created.push(sprite);
        return sprite;
      },
      createProjectileFromSprite() {},
      onOverlap: (left, right, handler) => state.overlaps.push({ left, right, handler }),
    },
    info: {
      setScore: (score) => { state.score = score; state.setup.push('score'); },
      score: () => state.score ?? 0,
      changeScoreBy: (amount) => { state.score = (state.score ?? 0) + amount; },
      setLife: (life) => { state.life = life; },
      changeLifeBy: (amount) => { state.life += amount; },
    },
    game: { splash: (message) => state.messages.push(message), over: (win) => state.wins.push(win),
      onUpdateInterval: (ms, handler) => state.intervals.push({ ms, handler }) },
  };
  vm.createContext(context);
  vm.runInContext(ts.transpile(programs.get(id)), context);
  return { state, value: (expression) => vm.runInContext(expression, context) };
}

for (const lesson of ['09', '11', '12']) {
  test(`C03-001/C03-008: every lesson ${lesson} model keeps exactly one player screen boundary`, () => {
    for (const { id, code } of catalog.filter(({ id }) => id.startsWith(`lesson-${lesson}-`))) {
      assert.equal(code.match(/mySprite\.setStayInScreen\(true\)/g)?.length ?? 0, 1, id);
    }
  });
}

test('C03-003: every energy model initializes a visible zero score before button registration', () => {
  for (const { id } of catalog.filter(({ id }) => id.startsWith('lesson-10-'))) {
    const { state } = runProgram(id);
    assert.equal(state.score, 0, id);
    if (state.pressA) assert.ok(state.setup.indexOf('score') < state.setup.indexOf('A'), id);
  }
});

test('C03-003/C03-005: five losses show zero score and the decremented energy; a sixth press changes no state', () => {
  const { state, value } = runProgram('lesson-10-step-05');
  for (let i = 0; i < 5; i++) state.pressA();
  assert.equal(state.score, 0);
  assert.equal(state.life, 1);
  assert.equal(value('energy'), 0);
  assert.deepEqual(state.messages, [4, 3, 2, 1, 0]);
  const roll = value('roll');
  state.pressA();
  assert.deepEqual([state.score, state.life, value('energy'), value('roll')], [0, 1, 0, roll]);
  assert.equal(state.messages.at(-1), 'Енергія скінчилася');
});

test('C03-011: each recurring enemy enables AutoDestroy without changing score or life', () => {
  for (const id of ['lesson-12-step-03', 'lesson-12-step-04', 'lesson-12-step-05']) {
    const { state } = runProgram(id);
    assert.equal(state.intervals.length, 1);
    for (let i = 0; i < 2; i++) {
      state.intervals[0].handler();
      const enemy = state.created.at(-1);
      assert.equal(enemy.kind, 2);
      assert.equal(enemy.vy, 30);
      assert.deepEqual(enemy.flags, [[1, true]], id);
    }
    assert.deepEqual([state.score, state.life], [0, 3]);
  }
});

test('C03-012: final projectile handler models separate score-5 and score-12 sibling conditions after scoring', () => {
  const source = ts.createSourceFile('main.ts', programs.get('lesson-12-step-05'), ts.ScriptTarget.Latest, true);
  const handler = source.statements.find((statement) => statement.getText(source).startsWith('sprites.onOverlap(SpriteKind.Projectile'))
    .expression.arguments[2];
  const statements = handler.body.statements;
  const conditions = statements.filter(ts.isIfStatement);
  assert.deepEqual(conditions.map((node) => node.expression.getText(source)), ['info.score() == 5', 'info.score() == 12']);
  assert.ok(statements.findIndex((node) => node.getText(source) === 'info.changeScoreBy(1)') < statements.indexOf(conditions[0]));
  assert.doesNotMatch(conditions[0].thenStatement.getText(source), /game\.over/);
  assert.match(conditions[1].thenStatement.getText(source), /game\.over\(true\)/);
});

test('C03-012: fifth hit changes future enemy speed, only the twelfth wins, and player collisions remove enemies', () => {
  const { state, value } = runProgram('lesson-12-step-05');
  const hit = state.overlaps.find(({ left }) => left === 1).handler;
  const collide = state.overlaps.find(({ left }) => left === 0).handler;
  for (let i = 1; i <= 12; i++) {
    const projectile = { destroy() { this.destroyed = true; } };
    const enemy = { destroy() { this.destroyed = true; } };
    hit(projectile, enemy);
    assert.ok(projectile.destroyed && enemy.destroyed);
    assert.equal(state.score, i);
    assert.equal(value('wave'), i < 5 ? 1 : 2);
    assert.deepEqual(state.wins, i < 12 ? [] : [true]);
  }
  assert.deepEqual(state.messages, ['Хвиля 2!']);
  state.intervals[0].handler();
  assert.equal(state.created.at(-1).vy, 40);
  const player = { destroy() { throw new Error('Player must not be destroyed by overlap'); } };
  for (let i = 0; i < 3; i++) {
    const enemy = { destroy() { this.destroyed = true; } };
    collide(player, enemy);
    assert.ok(enemy.destroyed);
  }
  assert.equal(state.life, 0);
});

test('game-developer programs cover twenty steps with native blocks and no gray TypeScript fallback', async () => {
  assert.equal(catalog.length, 20);
  for (const { id } of catalog) {
    const svg = await readFile(new URL(`../../src/assets/lesson-visuals/blocks/${id}.svg`, import.meta.url), 'utf8');
    assert.ok(!/class="[^"]*\btypescript_(?:statement|expression)\b/.test(svg), `${id}: gray TypeScript fallback is not a teachable native block`);
  }
});
