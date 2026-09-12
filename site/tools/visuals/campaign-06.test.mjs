import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import catalog from './catalog/campaign-06.mjs';

test('the Python transition has six native block programs without gray fallback', async () => {
  assert.deepEqual(catalog.map(({ id }) => id), [
    'lesson-21-step-01', 'lesson-21-step-02', 'lesson-21-step-03',
    'lesson-21-step-05', 'lesson-21-step-06', 'lesson-23-step-05',
  ]);
  for (const { id } of catalog) {
    const svg = await readFile(new URL(`../../src/assets/lesson-visuals/blocks/${id}.svg`, import.meta.url), 'utf8');
    assert.ok(!/class="[^\"]*\btypescript_(?:statement|expression)\b/.test(svg), `${id}: gray fallback`);
  }
});
