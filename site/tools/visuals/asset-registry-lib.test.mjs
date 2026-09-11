import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';
import { generateVisualRegistry } from '../generate-visual-registry.mjs';

const exec = promisify(execFile);
const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40"/>';
const entry = { id: 'lesson-01-step-04', code: 'scene.setBackgroundColor(7)', options: { snippetMode: true } };

async function project(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'kodkvest-registry-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await exec('git', ['init', '--quiet', root]);
  const blocks = path.join(root, 'src/assets/lesson-visuals/blocks');
  const editor = path.join(root, 'src/assets/lesson-visuals/editor');
  const registry = path.join(root, 'src/lesson-visuals/generated-assets.ts');
  await mkdir(blocks, { recursive: true });
  await mkdir(editor, { recursive: true });
  await writeFile(path.join(blocks, `${entry.id}.svg`), svg);
  return { root, blocks, editor, registry };
}

test('registry includes new repository SVG/WebP assets in stable sorted imports and excludes ignored/temp files', async (t) => {
  const fixture = await project(t);
  await writeFile(path.join(fixture.blocks, 'lesson-01-step-03.svg'), svg);
  await writeFile(path.join(fixture.editor, 'lesson-01-workspace.webp'), 'webp fixture');
  await writeFile(path.join(fixture.root, '.gitignore'), 'ignored.svg\n.visuals-tmp/\n');
  await writeFile(path.join(fixture.blocks, 'ignored.svg'), 'ignored invalid SVG');
  await writeFile(path.join(fixture.blocks, 'notes.txt'), 'not an asset');
  await mkdir(path.join(fixture.root, '.visuals-tmp/blocks'), { recursive: true });
  await writeFile(path.join(fixture.root, '.visuals-tmp/blocks/temporary.svg'), svg);
  await generateVisualRegistry({ siteRoot: fixture.root, catalog: [entry] });
  const output = await readFile(fixture.registry, 'utf8');
  assert.match(output, /'blocks:lesson-01-step-03': \{ kind: 'blocks', src: asset0 \}/);
  assert.match(output, /'blocks:lesson-01-step-04': \{ kind: 'blocks', src: asset1 \}/);
  assert.match(output, /'editor:lesson-01-workspace': \{ kind: 'editor', src: asset2 \}/);
  assert.doesNotMatch(output, /ignored|temporary|notes/);
  assert.ok(output.indexOf('lesson-01-step-03.svg') < output.indexOf('lesson-01-step-04.svg'));
  await generateVisualRegistry({ siteRoot: fixture.root, catalog: [entry] });
  assert.equal(await readFile(fixture.registry, 'utf8'), output);
  await generateVisualRegistry({ siteRoot: fixture.root, catalog: [entry], check: true });
});

test('check rejects stale registry without changing it', async (t) => {
  const fixture = await project(t);
  await generateVisualRegistry({ siteRoot: fixture.root, catalog: [entry] });
  await writeFile(fixture.registry, 'stale registry\n');
  await assert.rejects(generateVisualRegistry({ siteRoot: fixture.root, catalog: [entry], check: true }), /registry.*stale/i);
  assert.equal(await readFile(fixture.registry, 'utf8'), 'stale registry\n');
});

test('check rejects a block catalog entry without an SVG', async (t) => {
  const fixture = await project(t);
  await assert.rejects(generateVisualRegistry({
    siteRoot: fixture.root, catalog: [entry, { ...entry, id: 'lesson-01-step-05' }], check: true,
  }), /lesson-01-step-05.*missing/i);
});

test('check rejects a removed tracked import target', async (t) => {
  const fixture = await project(t);
  await generateVisualRegistry({ siteRoot: fixture.root, catalog: [entry] });
  await exec('git', ['-C', fixture.root, 'add', 'src']);
  await rm(path.join(fixture.blocks, `${entry.id}.svg`));
  await assert.rejects(generateVisualRegistry({ siteRoot: fixture.root, catalog: [entry], check: true }), /lesson-01-step-04.*missing/i);
});

test('check rejects SVG assets with zero dimensions', async (t) => {
  const fixture = await project(t);
  await writeFile(path.join(fixture.blocks, `${entry.id}.svg`), svg.replace('120 40', '0 40'));
  await assert.rejects(generateVisualRegistry({ siteRoot: fixture.root, catalog: [entry], check: true }), /lesson-01-step-04.*positive/);
});
