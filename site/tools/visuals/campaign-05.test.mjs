import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import catalog from './catalog/campaign-05.mjs';

test('game-designer programs cover twenty steps using native blocks without gray fallback', async () => {
  assert.equal(catalog.length, 20);
  for (const { id } of catalog) {
    const svg = await readFile(new URL(`../../src/assets/lesson-visuals/blocks/${id}.svg`, import.meta.url), 'utf8');
    assert.ok(!/class="[^"]*\btypescript_(?:statement|expression)\b/.test(svg), `${id}: gray TypeScript fallback is not a teachable native block`);
  }
});
