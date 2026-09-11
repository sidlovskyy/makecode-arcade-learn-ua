import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';
import { checkVisualAssets } from '../check-visual-assets.mjs';
import { generateVisualRegistry } from '../generate-visual-registry.mjs';
import { blockCatalog } from './catalog/index.mjs';

const exec = promisify(execFile);
const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40"/>';
const editorNames = [
  'animation-extension', 'animation-frames', 'arcade-home',
  'blocks-workspace', 'sprite-image-editor', 'tilemap-editor',
];

async function project(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'kodkvest-strict-assets-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await exec('git', ['init', '--quiet', root]);
  const blocks = path.join(root, 'src/assets/lesson-visuals/blocks');
  const editor = path.join(root, 'src/assets/lesson-visuals/editor');
  const registry = path.join(root, 'src/lesson-visuals/generated-assets.ts');
  await mkdir(blocks, { recursive: true });
  await mkdir(editor, { recursive: true });
  await Promise.all(blockCatalog.map(({ id }) => writeFile(path.join(blocks, `${id}.svg`), svg)));
  // The audit verifies committed imports; image decoding is tested by the capture suite.
  await Promise.all(editorNames.map((name) => writeFile(path.join(editor, `${name}.webp`), 'WebP fixture')));
  await generateVisualRegistry({ siteRoot: root });
  await exec('git', ['add', 'src'], { cwd: root });
  return { root, blocks, editor, registry };
}

test('strict offline audit accepts exactly the catalog SVGs and six tracked editor imports without writing', async (t) => {
  const fixture = await project(t);
  const before = await readFile(fixture.registry, 'utf8');
  const assets = await checkVisualAssets({ siteRoot: fixture.root });
  assert.equal(assets.length, 99);
  assert.equal(assets.filter(({ kind }) => kind === 'blocks').length, 93);
  assert.equal(assets.filter(({ kind }) => kind === 'editor').length, 6);
  assert.deepEqual(assets.map(({ id }) => id), assets.map(({ id }) => id).sort());
  assert.equal(await readFile(fixture.registry, 'utf8'), before);
});

test('strict audit rejects an extra registered SVG with no catalog source', async (t) => {
  const fixture = await project(t);
  await writeFile(path.join(fixture.blocks, 'lesson-99-step-01.svg'), svg);
  await generateVisualRegistry({ siteRoot: fixture.root });
  await assert.rejects(checkVisualAssets({ siteRoot: fixture.root }), /blocks:lesson-99-step-01.*catalog/);
});

test('strict audit rejects an incomplete block manifest even when its registry is current', async (t) => {
  const fixture = await project(t);
  const catalog = blockCatalog.slice(1);
  await rm(path.join(fixture.blocks, `${blockCatalog[0].id}.svg`));
  await generateVisualRegistry({ siteRoot: fixture.root, catalog });
  await assert.rejects(checkVisualAssets({ siteRoot: fixture.root, catalog }), /manifest.*93.*92/);
});

test('strict audit rejects a catalog source without its SVG', async (t) => {
  const fixture = await project(t);
  await rm(path.join(fixture.blocks, `${blockCatalog[0].id}.svg`));
  await assert.rejects(checkVisualAssets({ siteRoot: fixture.root }), /lesson-01-step-04.*missing block SVG/);
});

test('strict audit rejects a catalog entry with no source program', async (t) => {
  const fixture = await project(t);
  const catalog = blockCatalog.map((entry, index) => index ? entry : { ...entry, code: ' ' });
  await assert.rejects(checkVisualAssets({ siteRoot: fixture.root, catalog }), /lesson-01-step-04.*code/);
});

test('strict audit rejects a missing editor WebP even with a regenerated registry', async (t) => {
  const fixture = await project(t);
  await rm(path.join(fixture.editor, 'tilemap-editor.webp'));
  await generateVisualRegistry({ siteRoot: fixture.root });
  await assert.rejects(checkVisualAssets({ siteRoot: fixture.root }), /editor:tilemap-editor.*missing.*WebP/);
});

test('strict audit rejects an editor SVG substituted for the expected WebP', async (t) => {
  const fixture = await project(t);
  await rm(path.join(fixture.editor, 'tilemap-editor.webp'));
  await writeFile(path.join(fixture.editor, 'tilemap-editor.svg'), svg);
  await generateVisualRegistry({ siteRoot: fixture.root });
  await assert.rejects(checkVisualAssets({ siteRoot: fixture.root }), /editor:tilemap-editor.*WebP/);
});

test('strict audit rejects a seventh editor scene', async (t) => {
  const fixture = await project(t);
  await writeFile(path.join(fixture.editor, 'extra.webp'), 'WebP fixture');
  await generateVisualRegistry({ siteRoot: fixture.root });
  await assert.rejects(checkVisualAssets({ siteRoot: fixture.root }), /editor:extra.*unexpected/);
});

for (const file of ['blocks/lesson-01-step-04.svg', 'editor/tilemap-editor.webp']) {
  test(`strict audit rejects an untracked asset ${file}`, async (t) => {
    const fixture = await project(t);
    await exec('git', ['rm', '--cached', `src/assets/lesson-visuals/${file}`], { cwd: fixture.root });
    await assert.rejects(checkVisualAssets({ siteRoot: fixture.root }), /not tracked in Git/);
  });
}

for (const [name, alter] of [
  ['stale entry', (source) => source.replace("  'blocks:lesson-01-step-04':", "  'blocks:unknown':")],
  ['remote import', (source) => source.replace('../assets/lesson-visuals/blocks/lesson-01-step-04.svg', 'https://example.com/remote.svg')],
  ['unsorted imports', (source) => {
    const lines = source.split('\n');
    [lines[1], lines[2]] = [lines[2], lines[1]];
    return lines.join('\n');
  }],
]) {
  test(`strict audit rejects ${name} without rewriting the registry`, async (t) => {
    const fixture = await project(t);
    const changed = alter(await readFile(fixture.registry, 'utf8'));
    await writeFile(fixture.registry, changed);
    await assert.rejects(checkVisualAssets({ siteRoot: fixture.root }), /registry.*stale/);
    assert.equal(await readFile(fixture.registry, 'utf8'), changed);
  });
}

for (const [name, markup, diagnostic] of [
  ['script', '<script>alert(1)</script>', /unsafe SVG/],
  ['active markup', '<foreignObject><div xmlns="http://www.w3.org/1999/xhtml">active</div></foreignObject>', /unsafe SVG/],
  ['remote href', '<image href="https://example.com/image.png"/>', /remote/],
]) {
  test(`strict audit rejects ${name} inside a committed SVG`, async (t) => {
    const fixture = await project(t);
    await writeFile(path.join(fixture.blocks, `${blockCatalog[0].id}.svg`), svg.replace('/>', `>${markup}</svg>`));
    await assert.rejects(checkVisualAssets({ siteRoot: fixture.root }), diagnostic);
  });
}

for (const [label, content] of [
  ['XHTML image src', '<img xmlns="http://www.w3.org/1999/xhtml" src="https://blocked.example/remote.png"/>'],
  ['prefixed XHTML iframe with encoded src', '<h:iframe xmlns:h="http://www.w3.org/1999/xhtml" src="&#104;ttps://blocked.example/frame"/>'],
  ['SVG resource attribute', '<image SrC="&#104;ttps://blocked.example/remote.png"/>'],
]) {
  for (const location of ['top-level', 'nested base64 SVG']) {
    test(`strict audit rejects ${label} in ${location} without changing assets or registry`, async (t) => {
      const fixture = await project(t);
      const active = svg.replace('/>', `>${content}</svg>`);
      const markup = location === 'top-level' ? active
        : svg.replace('/>', `><image href="data:image/svg+xml;base64,${Buffer.from(active).toString('base64')}"/></svg>`);
      const assetFile = path.join(fixture.blocks, `${blockCatalog[0].id}.svg`);
      const beforeRegistry = await readFile(fixture.registry, 'utf8');
      await writeFile(assetFile, markup);
      await assert.rejects(checkVisualAssets({ siteRoot: fixture.root }), /lesson-01-step-04.*(?:unsafe|unsupported|remote)/);
      assert.equal(await readFile(fixture.registry, 'utf8'), beforeRegistry);
      assert.equal(await readFile(assetFile, 'utf8'), markup);
    });
  }
}
