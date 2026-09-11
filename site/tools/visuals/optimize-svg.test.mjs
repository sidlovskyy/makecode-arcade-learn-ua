import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { optimizeRendererSvg } from './optimize-svg.mjs';

let browser;
let page;
before(async () => {
  browser = await chromium.launch();
  page = await browser.newPage({ offline: true });
});
after(async () => { await browser?.close(); });

async function imagePixels(svg) {
  await page.goto('about:blank');
  await page.setContent(`<img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}">`);
  await page.locator('img').evaluate(image => image.decode());
  const png = await page.locator('img').screenshot();
  return sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}

test('optimizer removes unused editor CSS while preserving matching styles, used fonts and identical offline pixels', async () => {
  const noise = Array.from({ length: 2000 }, (_, index) => `.editor-only-${index} { color: red; padding: 10px; }`).join('\n');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="40" viewBox="0 0 160 40"><style>
    @font-face { font-family: UnusedEditorFont; src: url(data:font/woff;base64,AAAA); }
    @font-face { font-family: UsedBlockFont; src: url(data:font/woff;base64,AAAA); }
    :root { --block-fill: #4d6887; }
    .block { fill: var(--block-fill); }
    .label { fill: white; font: 16px UsedBlockFont, monospace; }
    @media (min-width: 1px) { .label { font-weight: bold; } .unused { opacity: 0; } }
    ${noise}
  </style><rect class="block" width="160" height="40"/><text class="label" x="8" y="26">set color</text></svg>`;
  const before = await imagePixels(svg);
  const optimized = await optimizeRendererSvg(page, svg, 'fixture-step');
  assert.ok(Buffer.byteLength(optimized) < 3000);
  assert.doesNotMatch(optimized, /editor-only-|UnusedEditorFont|\.unused/);
  assert.match(optimized, /UsedBlockFont/);
  assert.match(optimized, /@font-face/);
  assert.match(optimized, /<rect class="block" width="160" height="40"\/>/);
  const after = await imagePixels(optimized);
  assert.deepEqual(after.info, before.info);
  assert.deepEqual(after.data, before.data);
});

test('real smoke asset stays below 50 KB and renders the English block offline at its intrinsic size', async () => {
  const svg = await readFile(new URL('../../src/assets/lesson-visuals/blocks/lesson-01-step-04.svg', import.meta.url), 'utf8');
  assert.ok(Buffer.byteLength(svg) < 50_000, `smoke SVG is ${Buffer.byteLength(svg)} bytes`);
  assert.match(svg, /set\s+background\s+color\s+to/);
  const { info, data } = await imagePixels(svg);
  assert.equal(info.width, 285);
  assert.equal(info.height, 56);
  // The green swatch is visible, not a blank/failed image with the right bounds.
  let greenPixels = 0;
  for (let index = 0; index < data.length; index += 4) {
    if (data[index] < 160 && data[index + 1] > 190 && data[index + 2] < 120) greenPixels++;
  }
  assert.ok(greenPixels > 500, `expected green swatch, found ${greenPixels} pixels`);
});

test('used fonts are resolved at the SVG image viewport rather than the authoring browser viewport', async () => {
  await page.setViewportSize({ width: 1280, height: 720 });
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="40"><style>@font-face { font-family: NarrowBlockFont; src: url(data:font/woff;base64,AAAA); } text { font-family: monospace; } @media (max-width: 200px) { text { font-family: NarrowBlockFont; } }</style><text x="0" y="20">color</text></svg>';
  const optimized = await optimizeRendererSvg(page, svg, 'viewport-step');
  assert.match(optimized, /@font-face\s*\{[^}]*font-family:\s*NarrowBlockFont/);
});
