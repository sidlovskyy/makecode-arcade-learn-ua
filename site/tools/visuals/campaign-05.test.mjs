import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { JSDOM } from 'jsdom';
import catalog from './catalog/campaign-05.mjs';
import ts from 'typescript';
import { chromium } from 'playwright';

test('C05-001/C05-008/C05-011/C05-012: each required native addition is framed separately from old work', async () => {
  const context = { exports: {} };
  runInNewContext(ts.transpile(await readFile(new URL('../../src/curriculum/campaign-05.ts', import.meta.url), 'utf8'), { module: ts.ModuleKind.CommonJS }), context);
  const steps = context.exports.campaign05.lessons.flatMap(lesson => lesson.steps);
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ offline: true });
    const failures = [];
    for (const id of ['lesson-17-step-04', 'lesson-17-step-06', 'lesson-19-step-02', 'lesson-19-step-03', 'lesson-19-step-04', 'lesson-20-step-02', 'lesson-20-step-05']) {
      const svg = await readFile(new URL(`../../src/assets/lesson-visuals/blocks/${id}.svg`, import.meta.url), 'utf8');
      await page.goto(`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`);
      const visual = steps.find(step => step.id === id).visual;
      const result = await page.evaluate(({ id, regions }) => {
        const root = document.documentElement, inv = root.getScreenCTM().inverse();
        const bounds = e => { const b = e.getBoundingClientRect(), a = new DOMPoint(b.x, b.y).matrixTransform(inv), z = new DOMPoint(b.right, b.bottom).matrixTransform(inv); return { x: a.x, y: a.y, width: z.x - a.x, height: z.y - a.y }; };
        const boxes = regions.map(f => ({ x: f.x * root.viewBox.baseVal.width, y: f.y * root.viewBox.baseVal.height, width: f.width * root.viewBox.baseVal.width, height: f.height * root.viewBox.baseVal.height }));
        const path = e => e.querySelector(':scope > path.blocklyPath');
        const find = selector => path(root.querySelector(selector));
        const overlaps = [...root.querySelectorAll('g.spritesoverlap')];
        const sets = [...root.querySelectorAll('g.pxt-on-start g.variables_set')];
        let needed, old;
        if (id === 'lesson-17-step-06') {
          needed = [root.querySelector('g.gameupdate g.controls_if g.controls_if')]; old = [];
        } else if (id === 'lesson-19-step-03') {
          needed = [path(sets[1]), overlaps[0], overlaps[1]]; old = [];
        } else if (id === 'lesson-19-step-04') {
          needed = [find('g.gameSplash'), find('g.startEffectOnSprite'), find('g.camerashake')]; old = [];
        } else if (id.startsWith('lesson-17')) {
          needed = [find('g.function_call'), root.querySelectorAll('g.keyonevent')[1], overlaps[0], find('g.hudChangeScoreBy')];
          old = [find('g.game_control_sprite')];
        } else if (id.startsWith('lesson-19')) {
          needed = [overlaps[2], overlaps[1].querySelector('g.controls_if'), path(sets[0]), path(sets.at(-1)), path(sets.at(-1).querySelector('g.spritesetpos'))];
          old = [find('g.game_control_sprite')];
        } else if (id.endsWith('02')) {
          needed = [path(sets.at(-2)), path(sets.at(-1)), root.querySelector('g.keyonevent')];
          old = [find('g.game_control_sprite'), find('g.hudSetLife')];
        } else {
          const conditions = overlaps[0].querySelectorAll('g.controls_if');
          needed = [conditions[2], overlaps[1]];
          old = [path(conditions[0]), path(conditions[1])];
        }
        const n = needed.map(bounds), o = old.map(bounds);
        return { id, needed: n, old: o, viewBox: [root.viewBox.baseVal.width, root.viewBox.baseVal.height],
          included: n.every(b => boxes.some(a => a.x <= b.x + 1 && a.y <= b.y + 1 && a.x + a.width >= b.x + b.width - 1 && a.y + a.height >= b.y + b.height - 1)),
          excluded: o.every(b => boxes.every(a => Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) <= 1 || Math.min(a.y + a.height, b.y + b.height - 8) - Math.max(a.y, b.y) <= 1)),
        };
      }, { id, regions: [visual.focus, ...(visual.additionalFocus ?? [])] });
      if (!result.included || !result.excluded) failures.push(result);
    }
    assert.deepEqual(failures, []);
  } finally { await browser.close(); }
});

function playLevels(code) {
  const actors = [], events = {}, splashes = [], wins = [];
  let score = 0, update;
  runInNewContext(ts.transpile(code), {
    img: () => ({}), SpriteKind: { Player: 0, Enemy: 1, Projectile: 2 }, ControllerButtonEvent: { Pressed: 0 },
    randint: min => min,
    sprites: { create: (_image, kind) => { const actor = { kind, alive: true, setPosition() {}, setStayInScreen() {}, setBounceOnWall() {}, destroy() { this.alive = false; } }; actors.push(actor); return actor; },
      onOverlap: (_a, _b, handler) => { events.hit = handler; } },
    controller: { A: { onEvent: (_e, handler) => { events.start = handler; } }, B: { onEvent() {} }, moveSprite() {} },
    info: { setScore: value => { score = value; }, score: () => score, changeScoreBy: n => { score += n; } },
    game: { onUpdate: handler => { update = handler; }, splash: (_text, level) => { splashes.push(level); }, over: win => { wins.push(win); } },
  });
  events.start();
  const waves = [];
  for (let wave = 0; wave < 3; wave++) {
    const enemies = actors.filter(actor => actor.kind === 1 && actor.alive);
    waves.push(enemies.length);
    for (let i = 0; i < enemies.length; i++) {
      events.hit({ destroy() {} }, enemies[i]); update();
      if (i < enemies.length - 1) assert.equal(splashes.length + wins.length, wave, 'Never transition with living enemies');
    }
    assert.ok(enemies.every(enemy => !enemy.alive));
  }
  assert.deepEqual(splashes, [2, 3], 'Only playable next levels are announced');
  assert.deepEqual(wins, [true]);
  assert.equal(actors.filter(actor => actor.kind === 1 && actor.alive).length, 0);
  return waves;
}

test('C05-002/C05-004: all three default and synchronized experimental waves finish before WIN', () => {
  const code = catalog.find(entry => entry.id === 'lesson-17-step-06').code;
  assert.deepEqual(playLevels(code), [2, 3, 4]);
  assert.deepEqual(playLevels(code.replaceAll('level + 1', 'level * 2')), [2, 4, 6]);
  assert.deepEqual(playLevels(code.replaceAll('level + 1', 'level')), [1, 2, 3]);
});

for (const step of ['03', '04']) test(`C05-009: step ${step} victory survives damage, repeated pickup and shield expiry during music`, () => {
  let score = 0, life = 3, kind = 2, context, interleaved = false;
  const handlers = {}, ends = [], actors = [];
  const actor = { setStayInScreen() {}, setPosition() {}, follow() {}, setImage() {}, destroy() {}, startEffect() {} };
  context = { img: () => ({}), SpriteKind: { Player: 0, Food: 1, Enemy: 2, create: () => ++kind }, randint: min => min,
    sprites: { create: (_image, kind) => { const item = { ...actor, kind }; actors.push(item); return item; }, onOverlap: (_a, b, handler) => { handlers[b] = handler; } },
    controller: { moveSprite() {} }, scene: { cameraShake() {} }, effects: { confetti: 0 }, pause() {},
    info: { setScore: n => { score = n; }, score: () => score, changeScoreBy: n => { score += n; }, setLife: n => { life = n; }, changeLifeBy: n => { life += n; if (life <= 0) ends.push(false); } },
    game: { over: win => { ends.push(win); }, splash() {} },
    music: { tonePlayable() {}, melodyPlayable() {}, baDing: 1, PlaybackMode: { UntilDone: 1, InBackground: 0 }, play: (_sound, mode) => {
      if (mode !== 1 || interleaved) return;
      interleaved = true;
      // A shield timeout is independent of the terminal flag. Native overlaps
      // run in parallel while the winning handler yields in UntilDone.
      runInNewContext('shield = false', context);
      handlers[2](actors[0], actors[2]);
      handlers[1](actors[0], actors[1]);
    } },
  };
  runInNewContext(ts.transpile(catalog.find(entry => entry.id === `lesson-19-step-${step}`).code), context);
  score = 7; life = 1;
  handlers[1](actors[0], actors[1]);
  assert.deepEqual(ends, [true]);
  assert.equal(life, 1); assert.equal(score, 8);
});

test('game-designer programs cover twenty steps using native blocks without gray fallback', async () => {
  assert.equal(catalog.length, 20);
  for (const { id } of catalog) {
    const svg = await readFile(new URL(`../../src/assets/lesson-visuals/blocks/${id}.svg`, import.meta.url), 'utf8');
    assert.ok(!/class="[^"]*\btypescript_(?:statement|expression)\b/.test(svg), `${id}: gray TypeScript fallback is not a teachable native block`);
  }
});

test('lesson 18 contact resets both enemies away from the player respawn tile', () => {
  const actors = [];
  let overlap;
  let life;
  const { code } = catalog.find(({ id }) => id === 'lesson-18-step-06');
  // Execute the actual authoring program at its native API boundary. This
  // verifies the handler's placements, not a substitute physics simulation.
  runInNewContext(code, {
    img: () => ({}), tilemap: () => ({}), SpriteKind: { Player: 0, Enemy: 1 },
    sprites: {
      create: (_image, kind) => {
        const actor = { kind, follow() {}, setBounceOnWall() {} };
        actors.push(actor);
        return actor;
      },
      onOverlap: (player, enemy, handler) => {
        assert.equal(player, 0); assert.equal(enemy, 1); overlap = handler;
      },
    },
    controller: { moveSprite() {} }, scene: { cameraShake() {} },
    info: { setLife: value => { life = value; }, changeLifeBy: delta => { life += delta; } },
    tiles: {
      setCurrentTilemap() {}, getTileLocation: (col, row) => ({ col, row }),
      placeOnTile: (actor, { col, row }) => { actor.col = col; actor.row = row; },
    },
  });
  const [player, patrol, chaser] = actors;
  for (const contactEnemy of [chaser, patrol]) {
    life = 3;
    for (const actor of actors) Object.assign(actor, { col: 1, row: 5 });
    overlap(player, contactEnemy);
    assert.equal(life, 2, 'One encounter costs exactly one life');
    assert.deepEqual(actors.map(({ col, row }) => [col, row]), [[1, 5], [5, 1], [7, 5]],
      'Both enemies must leave the respawn tile, including the enemy outside this callback');
  }
});

test('lesson 18 native overlap diagram teaches all three safe respawn placements', async () => {
  const svg = await readFile(new URL('../../src/assets/lesson-visuals/blocks/lesson-18-step-06.svg', import.meta.url), 'utf8');
  const dom = new JSDOM(svg, { contentType: 'image/svg+xml' });
  try {
    const overlap = dom.window.document.querySelector('.spritesoverlap');
    const placements = [...overlap.querySelectorAll('.mapplaceontile')].map(block => {
      const actor = [...block.children].find(child => child.matches('.variables_get, .argument_reporter_custom'));
      const location = [...block.children].find(child => child.matches('.mapgettile'));
      return [actor?.textContent, ...[...location?.querySelectorAll('.math_number') ?? []].map(node => Number(node.textContent))];
    });
    assert.deepEqual(placements, [['sprite', 1, 5], ['patrol', 5, 1], ['chaser', 7, 5]],
      'The native overlap stack must show the player and both enemies placed on distinct tiles');
  } finally { dom.window.close(); }
});
