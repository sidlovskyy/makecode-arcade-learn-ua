import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  validateCatalog,
  validateRenderResponse,
  validateSvg,
  normalizeRendererSvg,
  stagedReplace,
} from './render-blocks-lib.mjs';

const id = 'lesson-01-step-04';
const entry = { id, code: 'scene.setBackgroundColor(7)', options: { snippetMode: true } };
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40" viewBox="0 0 120 40"><text>set background color</text></svg>';
const frameWindow = {};
const message = { source: 'makecode', type: 'renderblocks', id, svg, width: 120, height: 40 };
const event = { origin: 'https://arcade.makecode.com', source: frameWindow, data: message };

test('catalog rejects duplicate IDs before any output can be overwritten', () => {
  assert.throws(() => validateCatalog([entry, { ...entry }]), /lesson-01-step-04.*duplicate/i);
});

test('catalog rejects IDs that could escape the output directory', () => {
  assert.throws(() => validateCatalog([{ ...entry, id: '../escape' }]), /\.\.\/escape/);
});

test('accepts a complete trusted response', () => {
  assert.equal(validateRenderResponse(event, frameWindow, id), svg);
});

for (const [label, change] of [
  ['non-MakeCode origin', { origin: 'https://example.com' }],
  ['wrong frame window', { source: {} }],
  ['wrong message source', { data: { ...message, source: 'someone-else' } }],
  ['wrong response type', { data: { ...message, type: 'renderready' } }],
  ['wrong response ID', { data: { ...message, id: 'another-id' } }],
  ['renderer error', { data: { ...message, error: 'compilation failed' } }],
  ['blank SVG', { data: { ...message, svg: '  ' } }],
  ['malformed SVG', { data: { ...message, svg: '<svg><g></svg>' } }],
  ['zero width', { data: { ...message, width: 0 } }],
  ['zero height', { data: { ...message, height: 0 } }],
  ['infinite dimension', { data: { ...message, height: Infinity } }],
  ['string dimension', { data: { ...message, width: '120' } }],
]) {
  test(`rejects ${label} and identifies the catalog entry`, () => {
    assert.throws(() => validateRenderResponse({ ...event, ...change }, frameWindow, id), /lesson-01-step-04/);
  });
}

test('missing response fails with the catalog ID', () => {
  assert.throws(() => validateRenderResponse(undefined, frameWindow, id), /lesson-01-step-04.*missing/i);
});

for (const [label, unsafeSvg] of [
  ['script', svg.replace('</svg>', '<script>alert(1)</script></svg>')],
  ['JavaScript URL', svg.replace('</svg>', '<a href="javascript:alert(1)"/></svg>')],
  ['remote href', svg.replace('</svg>', '<image href="https://example.com/image.png"/></svg>')],
  ['protocol-relative href', svg.replace('</svg>', '<image href="//example.com/image.png"/></svg>')],
  ['encoded remote href', svg.replace('</svg>', '<image href="&#104;ttps://example.com/image.png"/></svg>')],
  ['event handler', svg.replace('<text>', '<text onclick="alert(1)">')],
  ['zero viewBox', svg.replace('0 0 120 40', '0 0 0 40')],
  ['zero SVG dimensions', svg.replace('width="120"', 'width="0"')],
  ['missing SVG dimensions', '<svg xmlns="http://www.w3.org/2000/svg"><g/></svg>'],
]) {
  test(`SVG validation rejects ${label}`, () => {
    assert.throws(() => validateSvg(unsafeSvg, id), /lesson-01-step-04/);
  });
}

test('SVG accepts a positive viewBox without explicit dimensions', () => {
  assert.equal(validateSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40"/>', id).width, 120);
});

test('removes official editor cursor and toolbox sprite CSS without changing block geometry or visible styles', () => {
  const style = '<style>.blocklyTreeIcon { background: url(https://cdn.makecode.com/commit/abc/blockly/media/sprites.svg) no-repeat -48px -16px; color: red; } .blocklyDraggable { cursor: url("https://cdn.makecode.com/commit/abc/blockly/media/handclosed.cur"), auto; }</style>';
  const normalized = normalizeRendererSvg(svg.replace('<text>', `${style}<text>`), id);
  assert.doesNotMatch(normalized, /https:\/\/cdn.makecode.com/);
  assert.match(normalized, /color: red;/);
  assert.match(normalized, /<text>set background color<\/text>/);
  assert.deepEqual(validateSvg(normalized, id), { width: 120, height: 40 });
});

test('normalization still rejects other remote styles and remote hrefs', () => {
  assert.throws(() => normalizeRendererSvg(svg.replace('</svg>', '<style>.x { background: url(https://example.com/picture.png); }</style></svg>'), id), /lesson-01-step-04.*remote/);
  assert.throws(() => normalizeRendererSvg(svg.replace('</svg>', '<image href="https://example.com/picture.png"/></svg>'), id), /lesson-01-step-04.*href/);
});

async function directories(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'kodkvest-blocks-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const liveDir = path.join(root, 'live');
  const stagingDir = path.join(root, 'staging');
  await mkdir(liveDir);
  await writeFile(path.join(liveDir, `${id}.svg`), 'existing bytes\n');
  return { root, liveDir, stagingDir };
}

test('failed staged batch leaves existing live SVG byte-for-byte unchanged and removes partial results', async (t) => {
  const dirs = await directories(t);
  await assert.rejects(stagedReplace({
    ...dirs,
    catalog: [entry, { ...entry, id: 'lesson-01-step-05' }],
    render: async (item) => item.id === id ? svg : undefined,
  }), /lesson-01-step-05/);
  assert.equal(await readFile(path.join(dirs.liveDir, `${id}.svg`), 'utf8'), 'existing bytes\n');
  assert.deepEqual(await readdir(dirs.root), ['live']);
});

test('successful batch replaces the complete directory only after every render succeeds', async (t) => {
  const dirs = await directories(t);
  await writeFile(path.join(dirs.liveDir, 'obsolete.svg'), 'old asset');
  await stagedReplace({
    ...dirs,
    catalog: [entry],
    render: async () => {
      assert.equal(await readFile(path.join(dirs.liveDir, `${id}.svg`), 'utf8'), 'existing bytes\n');
      return svg;
    },
  });
  assert.equal(await readFile(path.join(dirs.liveDir, `${id}.svg`), 'utf8'), svg);
  assert.deepEqual(await readdir(dirs.liveDir), [`${id}.svg`]);
  assert.deepEqual(await readdir(dirs.root), ['live']);
});

test('registry failure after replacement rolls back the live directory', async (t) => {
  const dirs = await directories(t);
  await assert.rejects(stagedReplace({
    ...dirs,
    catalog: [entry],
    render: async () => svg,
    afterReplace: async () => { throw new Error('registry failed'); },
  }), /lesson-01-step-04.*registry failed/);
  assert.equal(await readFile(path.join(dirs.liveDir, `${id}.svg`), 'utf8'), 'existing bytes\n');
  assert.deepEqual(await readdir(dirs.root), ['live']);
});

test('refuses to delete another render process staging directory', async (t) => {
  const dirs = await directories(t);
  await mkdir(dirs.stagingDir);
  await writeFile(path.join(dirs.stagingDir, 'owned-by-another-run'), 'keep');
  await assert.rejects(stagedReplace({ ...dirs, catalog: [entry], render: async () => svg }), /lesson-01-step-04/);
  assert.equal(await readFile(path.join(dirs.stagingDir, 'owned-by-another-run'), 'utf8'), 'keep');
});

test('keeps the batch locked through registry generation after the stage has moved', async (t) => {
  const dirs = await directories(t);
  await stagedReplace({
    ...dirs,
    catalog: [entry],
    render: async () => svg,
    afterReplace: async () => {
      await assert.rejects(stagedReplace({ ...dirs, catalog: [entry], render: async () => svg }), /lesson-01-step-04.*locked/i);
      assert.equal(await readFile(path.join(dirs.liveDir, `${id}.svg`), 'utf8'), svg);
    },
  });
  assert.deepEqual(await readdir(dirs.root), ['live']);
});
