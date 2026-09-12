import assert from 'node:assert/strict';
import test from 'node:test';
import * as editorSceneModule from './editor-scenes.mjs';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { chromium } from 'playwright';
import { captureEditorScenes } from '../capture-editor-scenes.mjs';

const { editorScenes, waitForExtensionCards } = editorSceneModule;

test('capture inventory covers exactly the six reusable editor surfaces', () => {
  assert.deepEqual(editorScenes.map(({ id }) => id).sort(), [
    'editor:animation-extension', 'editor:animation-frames', 'editor:arcade-home',
    'editor:blocks-workspace', 'editor:sprite-image-editor', 'editor:tilemap-editor',
  ]);
  assert.equal(new Set(editorScenes.map(({ id }) => id)).size, 6);
  for (const scene of editorScenes) {
    assert.ok(scene.url.startsWith('https://arcade.makecode.com/'), scene.id);
    assert.deepEqual(scene.viewport, { width: 1440, height: 900 }, scene.id);
    assert.equal(typeof scene.prepare, 'function', scene.id);
    assert.ok(scene.prepare.toString().replace(/\s/g, '').length > 'async()=>{}'.length, scene.id);
    assert.equal(scene.outputName, `${scene.id.slice('editor:'.length)}.webp`);
  }
});

test('C06-007/C06-010: the tilemap atlas captures wide creation and a Python Save scene', () => {
  const atlas = editorScenes.find(scene => scene.id === 'editor:tilemap-editor');
  assert.equal(atlas.preserveFirstPanel, true);
  assert.equal(atlas.panels.length, 2);
  assert.deepEqual(atlas.panelNames, ['starter-map', 'wide-map', 'python-save']);
});

test('lesson 02 captures blank, silhouette, detailed hero, and simulator panels', () => {
  const { heroDetailed, heroSilhouette } = editorSceneModule;
  assert.ok(Array.isArray(heroSilhouette), 'heroSilhouette must be exported');
  assert.ok(Array.isArray(heroDetailed), 'heroDetailed must be exported');
  const atlas = editorScenes.find(scene => scene.id === 'editor:sprite-image-editor');
  assert.equal(atlas.preserveFirstPanel, true);
  assert.equal(atlas.panels.length, 3);
  assert.deepEqual(atlas.panelNames, ['blank', 'silhouette', 'detailed', 'simulator']);
  assert.equal(heroSilhouette.length, 16);
  assert.equal(heroDetailed.length, 16);
  assert.ok(heroSilhouette.every((row, y) => [...row].every((pixel, x) =>
    pixel === '.' ? heroDetailed[y][x] === '.' : heroDetailed[y][x] !== '.')));
  assert.deepEqual(new Set(heroSilhouette.join('')), new Set(['.', '8']));
  assert.deepEqual(new Set(heroDetailed.join('')), new Set(['.', '1', '5', '8']));
});

test('committed lesson 02 sprite atlas contains four full viewport panels', async () => {
  const asset = fileURLToPath(new URL('../../src/assets/lesson-visuals/editor/sprite-image-editor.webp', import.meta.url));
  const metadata = await sharp(asset).metadata();
  assert.equal(metadata.width, 1440);
  assert.equal(metadata.height, 3600);
  const simulator = await sharp(asset)
    .extract({ left: 15, top: 2785, width: 315, height: 230 })
    .raw().toBuffer();
  const count = (red, green, blue) => {
    let pixels = 0;
    for (let index = 0; index < simulator.length; index += 3) {
      if (simulator[index] === red && simulator[index + 1] === green && simulator[index + 2] === blue) pixels++;
    }
    return pixels;
  };
  assert.ok(count(0, 63, 173) > 100, 'running simulator must show the blue hero');
  assert.ok(count(255, 246, 9) > 25, 'running simulator must show the yellow emblem');
});

const fixture = (name, prepare = async (page) => {
  await page.setContent('<html><body style="background:#123456">Editor fixture</body></html>');
}) => ({
  id: `editor:${name}`, outputName: `${name}.webp`, url: 'about:blank',
  viewport: { width: 1440, height: 900 }, prepare,
});

test('C06 atlas: preserves original pixels and adds independently captured panels in one WebP', async (t) => {
  const { siteRoot, live, browser } = await captureFixture(t);
  const original = await sharp({ create: { width: 1440, height: 900, channels: 3, background: '#ff0000' } }).webp({ lossless: true }).toBuffer();
  await writeFile(path.join(live, 'atlas.webp'), original);
  const scene = { ...fixture('atlas'), preserveFirstPanel: true, panels: [fixture('blue').prepare, fixture('green', async page => page.setContent('<body style="margin:0;background:#00ff00"></body>')).prepare] };
  await captureEditorScenes({ siteRoot, browser, scenes: [scene], preserveUncaptured: true, afterReplace: async () => {} });
  const target = await readFile(path.join(live, 'atlas.webp'));
  assert.equal((await sharp(target).metadata()).height, 2700);
  assert.deepEqual(await sharp(target).extract({ left: 0, top: 0, width: 1440, height: 900 }).raw().toBuffer(), await sharp(original).raw().toBuffer());
  assert.deepEqual([...await sharp(target).extract({ left: 0, top: 1800, width: 1, height: 1 }).raw().toBuffer()], [0, 255, 0]);
  assert.equal(await readFile(path.join(live, 'old.webp'), 'utf8'), 'original asset');
});

async function captureFixture(t) {
  const siteRoot = await mkdtemp(path.join(os.tmpdir(), 'editor-capture-test-'));
  const live = path.join(siteRoot, 'src/assets/lesson-visuals/editor');
  await mkdir(live, { recursive: true });
  await writeFile(path.join(live, 'old.webp'), 'original asset');
  const browser = await chromium.launch();
  t.after(async () => { await browser.close(); await rm(siteRoot, { recursive: true, force: true }); });
  return { siteRoot, live, browser };
}

test('failed scene keeps live assets unchanged and removes only its staging output', async (t) => {
  const { siteRoot, live, browser } = await captureFixture(t);
  await assert.rejects(captureEditorScenes({
    siteRoot, browser,
    scenes: [fixture('first'), fixture('broken', async () => { throw new Error('missing editor control'); })],
    afterReplace: async () => { assert.fail('must not publish a partial batch'); },
  }), /editor:broken.*missing editor control/);
  assert.deepEqual(await readdir(live), ['old.webp']);
  assert.equal(await readFile(path.join(live, 'old.webp'), 'utf8'), 'original asset');
  assert.deepEqual(await readdir(path.join(siteRoot, '.visuals-tmp')), []);
});

test('complete capture publishes verified 1440 by 900 lossless WebPs before registry generation', async (t) => {
  const { siteRoot, live, browser } = await captureFixture(t);
  let published = false;
  await captureEditorScenes({
    siteRoot, browser, scenes: [fixture('first'), fixture('second')],
    afterReplace: async () => {
      assert.deepEqual((await readdir(live)).sort(), ['first.webp', 'second.webp']);
      for (const name of ['first', 'second']) {
        const target = path.join(live, `${name}.webp`);
        const metadata = await sharp(target).metadata();
        assert.equal(metadata.format, 'webp');
        assert.equal(metadata.width, 1440);
        assert.equal(metadata.height, 900);
        const png = path.join(siteRoot, '.visuals-tmp/editor-png', `${name}.png`);
        assert.deepEqual(await sharp(target).raw().toBuffer(), await sharp(png).raw().toBuffer());
      }
      published = true;
    },
  });
  assert.equal(published, true);
});

test('registry failure restores the prior live assets', async (t) => {
  const { siteRoot, live, browser } = await captureFixture(t);
  await assert.rejects(captureEditorScenes({
    siteRoot, browser, scenes: [fixture('first')],
    afterReplace: async () => { throw new Error('registry failed'); },
  }), /registry failed/);
  assert.deepEqual(await readdir(live), ['old.webp']);
  assert.equal(await readFile(path.join(live, 'old.webp'), 'utf8'), 'original asset');
});

test('capture waits for visible CSS background images before taking the screenshot', async (t) => {
  const { siteRoot, live, browser } = await captureFixture(t);
  const red = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#ff0000' } }).png().toBuffer();
  await captureEditorScenes({
    siteRoot, browser,
    scenes: [fixture('background', async (page) => {
      await page.route('https://capture.test/background.png', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await route.fulfill({ contentType: 'image/png', body: red });
      });
      await page.setContent('<html><body style="margin:0"><div style="width:1440px;height:900px;background-image:url(https://capture.test/background.png)"></div></body></html>', { waitUntil: 'domcontentloaded' });
    })],
    afterReplace: async () => {},
  });
  const pixel = await sharp(path.join(live, 'background.webp')).extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer();
  assert.deepEqual([...pixel], [255, 0, 0]);
});

test('capture refuses an occupied stage without deleting its files', async (t) => {
  const { siteRoot, live, browser } = await captureFixture(t);
  const stage = path.join(siteRoot, '.visuals-tmp/editor');
  await mkdir(stage, { recursive: true });
  await writeFile(path.join(stage, 'other-run'), 'keep');
  await assert.rejects(captureEditorScenes({ siteRoot, browser, scenes: [fixture('first')] }), /EEXIST/);
  assert.equal(await readFile(path.join(stage, 'other-run'), 'utf8'), 'keep');
  assert.equal(await readFile(path.join(live, 'old.webp'), 'utf8'), 'original asset');
});

test('extension readiness accepts fully transparent completed spinners', async (t) => {
  const { browser } = await captureFixture(t);
  const page = await browser.newPage();
  page.setDefaultTimeout(1000);
  await page.setContent('<div class="common-spinner" style="width:50px;height:50px;opacity:0"></div>');
  await waitForExtensionCards(page);
});

test('capture waits for lazy image sources to be assigned and decoded', async (t) => {
  const { siteRoot, live, browser } = await captureFixture(t);
  const red = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#ff0000' } }).png().toBuffer();
  await captureEditorScenes({
    siteRoot, browser,
    scenes: [fixture('lazy', async (page) => {
      await page.setContent('<html><body style="margin:0"><img width="1440" height="900"></body></html>');
      await page.evaluate((src) => { setTimeout(() => { document.querySelector('img').src = src; }, 300); }, `data:image/png;base64,${red.toString('base64')}`);
    })],
    afterReplace: async () => {},
  });
  const pixel = await sharp(path.join(live, 'lazy.webp')).extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer();
  assert.deepEqual([...pixel], [255, 0, 0]);
});

test('C06-010: capture waits for the editor loading overlay to clear', async (t) => {
  const { siteRoot, live, browser } = await captureFixture(t);
  await captureEditorScenes({ siteRoot, browser,
    scenes: [fixture('loading', async page => {
      await page.setContent('<body style="margin:0;background:#ff0000"><div class="ui active loader" style="position:fixed;inset:0;background:#777"></div></body>');
      await page.evaluate(() => setTimeout(() => document.querySelector('.loader').remove(), 500));
    })], afterReplace: async () => {},
  });
  const pixel = await sharp(path.join(live, 'loading.webp')).extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer();
  assert.deepEqual([...pixel], [255, 0, 0]);
});
