import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import catalog from './catalog/campaign-04.mjs';
import * as fixtures from './catalog/campaign-04.mjs';
import vm from 'node:vm';
import ts from 'typescript';
import { chromium } from 'playwright';

test('C04-002: the final function model retains walking and celebration definitions', () => {
  const code = catalog.find(({ id }) => id === 'lesson-13-step-06').code;
  assert.match(code, /function startWalking/);
  assert.match(code, /function celebrate/);
});

test('C04-005/C04-007: native new blocks are outlined separately from old setup and jump', async () => {
  const context = { exports: {} };
  const source = await readFile(new URL('../../src/curriculum/campaign-04.ts', import.meta.url), 'utf8');
  vm.runInNewContext(ts.transpile(source, { module: ts.ModuleKind.CommonJS }), context);
  const steps = context.exports.campaign04.lessons.flatMap(lesson => lesson.steps);
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ offline: true });
    const failures = [];
    for (const id of ['lesson-15-step-02', 'lesson-16-step-04', 'lesson-16-step-05']) {
      const svg = await readFile(new URL(`../../src/assets/lesson-visuals/blocks/${id}.svg`, import.meta.url), 'utf8');
      await page.goto(`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`);
      const visual = steps.find(step => step.id === id).visual;
      const result = await page.evaluate(({ id, regions }) => {
        const root = document.documentElement;
        const inv = root.getScreenCTM().inverse();
        const bounds = element => {
          const b = element.getBoundingClientRect();
          const a = new DOMPoint(b.x, b.y).matrixTransform(inv);
          const z = new DOMPoint(b.right, b.bottom).matrixTransform(inv);
          return { x: a.x, y: a.y, width: z.x - a.x, height: z.y - a.y };
        };
        const boxes = regions.map(f => ({ x: f.x * root.viewBox.baseVal.width, y: f.y * root.viewBox.baseVal.height,
          width: f.width * root.viewBox.baseVal.width, height: f.height * root.viewBox.baseVal.height }));
        const path = selector => root.querySelector(selector + ' > path.blocklyPath');
        const sets = [...root.querySelectorAll('g.variables_set')];
        const crystal = sets.find(g => [...g.querySelectorAll(':scope > g:not(.blocklyBlock) text')].some(text => text.textContent === 'crystal'))?.querySelector(':scope > path.blocklyPath');
        const needed = id.startsWith('lesson-15') ? [sets[0].querySelector(':scope > path.blocklyPath'), path('g.controls_repeat_ext')]
          : id.endsWith('04') ? [crystal, root.querySelectorAll('g.mapplaceonrandomtile > path.blocklyPath')[1], path('g.spritesoverlap')]
            : [path('g.hudSetLife'), path('g.spriteshittile')];
        const old = id.startsWith('lesson-15') ? [path('g.camerafollow'), path('g.game_control_sprite')]
          : [path('g.keyonevent'), path('g.game_control_sprite'), path('g.camerafollow')];
        return {
          included: needed.every(element => { const b = bounds(element); return boxes.some(a => a.x <= b.x + 1 && a.y <= b.y + 1 && a.x + a.width >= b.x + b.width - 1 && a.y + a.height >= b.y + b.height - 1); }),
          // Connected native statements share an 8px bottom connector; exclude
          // the full old command body, allowing only that joining contour.
          excluded: old.every(element => { const b = bounds(element); return boxes.every(a =>
            Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) <= 1
            || Math.min(a.y + a.height, b.y + b.height - 8) - Math.max(a.y, b.y) <= 1); }),
        };
      }, { id, regions: [visual.focus, ...(visual.additionalFocus ?? [])] });
      if (!result.included || !result.excluded) failures.push({ id, ...result });
    }
    assert.deepEqual(failures, []);
  } finally { await browser.close(); }
});

test('C04-006: the captured starter plan uses the catalog wall and unique passable marker geometry', () => {
  assert.ok(fixtures.starterMap, 'Export the exact catalog map for trusted editor capture');
  const entry = catalog.find(({ id }) => id === 'lesson-16-step-02');
  const jres = JSON.parse(entry.options.assets['tilemap.g.jres']).level30x8;
  const bytes = Buffer.from(Buffer.from(jres.data, 'base64').toString(), 'hex');
  assert.deepEqual([...bytes.subarray(0, 5)], [16, 30, 0, 8, 0]);
  const cell = (x, y) => bytes[5 + y * 30 + x];
  const wall = (x, y) => Boolean((bytes[245 + Math.floor((y * 30 + x) / 2)] >> (((y * 30 + x) % 2) * 4)) & 2);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 30; x++) {
    const expected = y === 7 || x === 0 || x === 29 || (y === 5 && ((x >= 5 && x <= 8) || (x >= 18 && x <= 21))) || (y === 3 && x >= 11 && x <= 14);
    assert.equal(wall(x, y), expected, `${x},${y}`);
  }
  for (const [x, y, tile] of [[2, 6, 2], [13, 2, 3], [27, 6, 5], [9, 6, 4], [10, 6, 4], [22, 6, 4], [23, 6, 4], [24, 6, 4]]) {
    assert.equal(cell(x, y), tile); assert.equal(wall(x, y), false);
  }
  for (const tile of [2, 3, 5]) assert.equal([...bytes.subarray(5, 245)].filter(value => value === tile).length, 1);
  assert.deepEqual(fixtures.starterMap.assets, entry.options.assets);
});

test('C04-008: challenge reverses at both first-platform bounds and stays vertically fixed', () => {
  assert.ok(fixtures.platformChallenge, 'Provide the taught challenge fixture');
  let update;
  const enemy = { setPosition(x, y) { this.x = x; this.y = y; } };
  const context = { img: () => ({}), SpriteKind: { Enemy: 2, Player: 0 }, sprites: { create: () => enemy, onOverlap() {} },
    game: { onUpdate: handler => { update = handler; } }, info: {}, tiles: {} };
  vm.runInNewContext(ts.transpile(fixtures.platformChallenge), context);
  assert.deepEqual([enemy.x, enemy.y, enemy.vx, enemy.ay], [104, 76, 20, 0]);
  for (const [x, before, after] of [[96, -20, 20], [112, 20, 20], [128, 20, -20], [112, -20, -20]]) {
    enemy.x = x; enemy.vx = before; update(); assert.equal(enemy.vx, after); assert.equal(enemy.y, 76);
  }
  for (const [overshoot, boundary] of [[95.5, 96], [128.5, 128]]) {
    enemy.x = overshoot; update(); assert.equal(enemy.x, boundary, 'Clamp frame overshoot to the taught bounds');
  }
});

test('world-builder programs cover seventeen steps using native blocks without gray fallback', async () => {
  assert.equal(catalog.length, 17);
  for (const { id } of catalog) {
    const svg = await readFile(new URL(`../../src/assets/lesson-visuals/blocks/${id}.svg`, import.meta.url), 'utf8');
    assert.ok(!/class="[^"]*\btypescript_(?:statement|expression)\b/.test(svg), `${id}: gray TypeScript fallback is not a teachable native block`);
  }
});

for (const step of ['02', '03', '04', '05', '06']) {
  test(`lesson-15-step-${step} retains the empty-list initialization from step 2`, async () => {
    const svg = await readFile(new URL(`../../src/assets/lesson-visuals/blocks/lesson-15-step-${step}.svg`, import.meta.url), 'utf8');
    const dom = new JSDOM(svg, { contentType: 'image/svg+xml' });
    try {
      const labels = [...dom.window.document.querySelectorAll('text')].map(node => node.textContent.replace(/\s+/g, ' '));
      assert.ok(labels.includes('empty array'), 'Full accumulated program must show set enemies to empty array before adding sprites');
    } finally { dom.window.close(); }
  });
}
