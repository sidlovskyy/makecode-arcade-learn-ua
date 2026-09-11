import { randomUUID } from 'node:crypto';
import { mkdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { defaultSiteRoot, generateVisualRegistry } from './generate-visual-registry.mjs';
import { editorScenes } from './visuals/editor-scenes.mjs';

export async function captureEditorScenes({
  browser,
  siteRoot = defaultSiteRoot,
  scenes = editorScenes,
  afterReplace = () => generateVisualRegistry({ siteRoot }),
}) {
  const temporary = path.join(siteRoot, '.visuals-tmp');
  const stage = path.join(temporary, 'editor');
  const pngStage = path.join(temporary, 'editor-png');
  const live = path.join(siteRoot, 'src/assets/lesson-visuals/editor');
  const backup = path.join(temporary, `editor-backup-${randomUUID()}`);
  const lock = path.join(temporary, 'editor.lock');
  let ownsLock = false;
  let ownsStage = false;
  let ownsPngStage = false;
  let hasBackup = false;
  let replaced = false;
  try {
    await mkdir(temporary, { recursive: true });
    await mkdir(lock);
    ownsLock = true;
    // Follow the block renderer's ownership convention: never erase a stage
    // left by another running or interrupted authoring process.
    await mkdir(stage);
    ownsStage = true;
    await mkdir(pngStage);
    ownsPngStage = true;
    for (const scene of scenes) {
      // Each surface starts with no cookies, account, project history or storage.
      const context = await browser.newContext({
        viewport: scene.viewport, deviceScaleFactor: 1, locale: 'en-US',
        colorScheme: 'light', reducedMotion: 'reduce',
      });
      try {
        const page = await context.newPage();
        page.setDefaultTimeout(60_000);
        await page.goto(scene.url, { waitUntil: 'domcontentloaded' });
        await scene.prepare(page);
        // Lazy gallery images acquire their src after IntersectionObserver runs.
        // A present card or an invisible spinner does not mean its image is ready.
        await page.waitForFunction(() => [...document.images].every((image) => {
          const box = image.getBoundingClientRect();
          return !box.width || !box.height || box.top >= innerHeight || box.bottom <= 0
            || box.left >= innerWidth || box.right <= 0
            || (image.complete && image.naturalWidth > 0);
        }));
        await page.evaluate(async () => {
          await document.fonts.ready;
          const inViewport = (element) => {
            const box = element.getBoundingClientRect();
            return box.width > 0 && box.height > 0 && box.top < innerHeight && box.bottom > 0
              && box.left < innerWidth && box.right > 0;
          };
          const backgrounds = new Set([...document.querySelectorAll('*')].filter(inViewport)
            .flatMap((element) => [...getComputedStyle(element).backgroundImage.matchAll(/url\("([^"]+)"\)/g)]
              .map((match) => match[1])));
          await Promise.all([
            ...[...document.images].filter(inViewport).map((image) => image.decode()),
            ...[...backgrounds].map(async (src) => {
              const image = new Image();
              image.src = src;
              await image.decode();
            }),
          ]);
        });
        await page.mouse.move(1439, 899);
        const png = path.join(pngStage, scene.outputName.replace(/\.webp$/, '.png'));
        await page.screenshot({ path: png, type: 'png', fullPage: false, animations: 'disabled' });
        const output = path.join(stage, scene.outputName);
        const info = await sharp(png).webp({ lossless: true }).toFile(output);
        const metadata = await sharp(output).metadata();
        if (!(metadata.width > 0 && metadata.height > 0)
          || metadata.width !== scene.viewport.width || metadata.height !== scene.viewport.height) {
          throw new Error('captured WebP must match the positive viewport dimensions');
        }
        console.log(`Captured ${scene.id}: ${metadata.width}×${metadata.height}, ${info.size} bytes`);
      } catch (error) {
        throw new Error(`${scene.id}: ${error.message}`, { cause: error });
      } finally {
        await context.close();
      }
    }
    await mkdir(path.dirname(live), { recursive: true });
    try {
      await rename(live, backup);
      hasBackup = true;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    // Publish only the complete batch; restore it if registry generation fails.
    await rename(stage, live);
    replaced = true;
    await afterReplace();
  } catch (error) {
    if (replaced) await rm(live, { recursive: true, force: true });
    if (hasBackup) await rename(backup, live);
    throw error;
  } finally {
    try {
      if (ownsStage) await rm(stage, { recursive: true, force: true });
      if (ownsPngStage) await rm(pngStage, { recursive: true, force: true });
    } finally {
      if (ownsLock) await rm(lock, { recursive: true, force: true });
    }
  }
  if (hasBackup) await rm(backup, { recursive: true, force: true });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  let browser;
  try {
    browser = await chromium.launch();
    await captureEditorScenes({ browser });
    console.log(`Published ${editorScenes.length} editor WebP(s) and regenerated the asset registry.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await browser?.close();
  }
}
