import { createServer } from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { defaultSiteRoot, generateVisualRegistry } from './generate-visual-registry.mjs';
import { blockCatalog } from './visuals/catalog/index.mjs';
import { normalizeRendererSvg, stagedReplace, validateRenderMessage } from './visuals/render-blocks-lib.mjs';
import { optimizeRendererSvg } from './visuals/optimize-svg.mjs';

const batchId = blockCatalog.map(({ id }) => id).join(', ') || '<empty-catalog>';
let browser;
const server = createServer((_request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end('<!doctype html><html lang="en"><head><title>Block asset authoring</title></head><body></body></html>');
});

try {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  browser = await chromium.launch();
  const page = await browser.newPage();
  const optimizerPage = await browser.newPage({ offline: true });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.addScriptTag({ content: `window.validateRenderMessage = ${validateRenderMessage.toString()};` });
  await page.evaluate(({ batchId }) => new Promise((resolve, reject) => {
    const frame = document.createElement('iframe');
    frame.id = 'makecode-renderer';
    frame.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;border:0';
    const timer = setTimeout(() => {
      window.removeEventListener('message', onMessage);
      reject(new Error(`${batchId}: renderer ready timeout after 30000ms`));
    }, 30_000);
    function onMessage(event) {
      if (event.origin !== 'https://arcade.makecode.com' || event.source !== frame.contentWindow) return;
      if (event.data?.source !== 'makecode' || event.data?.type !== 'renderready') return;
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      resolve();
    }
    window.addEventListener('message', onMessage);
    frame.src = 'https://arcade.makecode.com/--docs?render=1&lang=en';
    document.body.appendChild(frame);
  }), { batchId });

  await stagedReplace({
    catalog: blockCatalog,
    stagingDir: path.join(defaultSiteRoot, '.visuals-tmp/blocks'),
    liveDir: path.join(defaultSiteRoot, 'src/assets/lesson-visuals/blocks'),
    render: async (entry) => {
      const svg = await page.evaluate((entry) => new Promise((resolve, reject) => {
        const frame = document.getElementById('makecode-renderer');
        const timer = setTimeout(() => {
          window.removeEventListener('message', onMessage);
          reject(new Error(`${entry.id}: missing renderer response after 30000ms`));
        }, 30_000);
        function onMessage(event) {
          if (event.data?.type !== 'renderblocks') return;
          try {
            const svg = window.validateRenderMessage(event, frame.contentWindow, entry.id);
            clearTimeout(timer);
            window.removeEventListener('message', onMessage);
            resolve(svg);
          } catch (error) {
            clearTimeout(timer);
            window.removeEventListener('message', onMessage);
            reject(error);
          }
        }
        window.addEventListener('message', onMessage);
        frame.contentWindow.postMessage({
          type: 'renderblocks', id: entry.id, code: entry.code, options: entry.options,
        }, 'https://arcade.makecode.com/');
      }), entry);
      const normalized = normalizeRendererSvg(svg, entry.id);
      const optimized = await optimizeRendererSvg(optimizerPage, normalized, entry.id);
      console.log(`Rendered ${entry.id}: ${Buffer.byteLength(svg)} → ${Buffer.byteLength(optimized)} bytes`);
      return optimized;
    },
    afterReplace: () => generateVisualRegistry(),
  });
  console.log(`Published ${blockCatalog.length} block SVG(s) and regenerated the asset registry.`);
} catch (error) {
  console.error(`${batchId}: ${error.message}`);
  process.exitCode = 1;
} finally {
  try {
    await browser?.close();
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}
