import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import catalog from './catalog/campaign-01.mjs';

test('C01-008: initial sprite has exactly 16 by 16 transparent pixels; later heroes are drawn', () => {
  const rows = catalog.find(({ id }) => id === 'lesson-02-step-02').code.match(/img`([\s\S]*?)`/)[1].trim().split('\n').map(row => row.trim().split(/\s+/));
  assert.equal(rows.length, 16);
  for (const row of rows) {
    assert.equal(row.length, 16);
    assert.ok(row.every(pixel => pixel === '.'), 'Initial art must contain no visible pixels');
  }
  assert.match(catalog.find(({ id }) => id === 'lesson-03-step-01').code, /7 1 7 7 1 7/);
});

test('campaign 01 uses native blocks and expanded 100/100 controller fields', async () => {
  for (const { id } of catalog) {
    const svg = await readFile(new URL(`../../src/assets/lesson-visuals/blocks/${id}.svg`, import.meta.url), 'utf8');
    assert.ok(!/class="[^"]*\btypescript_(?:statement|expression)\b/.test(svg), id);
    if (id === 'lesson-03-step-02' || id === 'lesson-03-step-05') {
      assert.match(svg, />vx</);
      assert.match(svg, />vy</);
      assert.equal((svg.match(/>100</g) ?? []).length, 2);
    }
  }
});
