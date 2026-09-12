# Lesson 02 Authentic Sprite Progression Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace lesson 02's repeated blank editor sample with authentic MakeCode captures of a silhouette, a detailed hero, and that hero running in the simulator.

**Architecture:** Extend the existing `editor:sprite-image-editor` WebP into a four-panel 1440×900 atlas. The capture authoring script deterministically paints one 16×16 hero in isolated official MakeCode sessions; curriculum descriptors select panels through the existing `sourcePanel` contract, so runtime rendering needs no new component behavior.

**Tech Stack:** React 19, TypeScript, Vitest, Playwright, Node test runner, Sharp, official MakeCode Arcade capture UI.

---

### Task 1: Lock the sprite progression contract with failing tests

**Files:**
- Modify: `site/tools/visuals/editor-scenes.test.mjs`
- Modify: `site/src/curriculum/campaign-01.test.ts`

- [x] **Step 1: Add a failing capture-definition test**

Assert that the sprite scene is an atlas and that its deterministic pixel programs progress without replacing the silhouette:

```js
import { editorScenes, heroSilhouette, heroDetailed } from './editor-scenes.mjs';

test('lesson 02 captures blank, silhouette, detailed hero, and simulator panels', () => {
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
  const metadata = await sharp(new URL('../../src/assets/lesson-visuals/editor/sprite-image-editor.webp', import.meta.url)).metadata();
  assert.equal(metadata.width, 1440);
  assert.equal(metadata.height, 3600);
});
```

- [x] **Step 2: Add a failing curriculum test**

```ts
it('shows the real sprite progression from blank editor to running hero', () => {
  const steps = campaign01.lessons[1]!.steps;
  expect(steps.slice(2, 6).map(step => step.visual)).toMatchObject([
    { kind: 'editor', assetId: 'editor:sprite-image-editor', sourcePanel: 0, alt: expect.stringMatching(/порожн/) },
    { kind: 'editor', assetId: 'editor:sprite-image-editor', sourcePanel: 1, alt: expect.stringMatching(/силует/) },
    { kind: 'editor', assetId: 'editor:sprite-image-editor', sourcePanel: 2, alt: expect.stringMatching(/геро.*детал/) },
    { kind: 'editor', assetId: 'editor:sprite-image-editor', sourcePanel: 3, alt: expect.stringMatching(/симулятор/) },
  ]);
  expect(JSON.stringify(steps[4]!.visual)).not.toMatch(/зразок показує палітру|не готового героя/);
  expect(JSON.stringify(steps[5]!.visual)).not.toMatch(/проєкт порожній/);
});
```

- [x] **Step 3: Run the focused tests and verify RED**

Run:

```bash
npm test -- src/curriculum/campaign-01.test.ts
node --test tools/visuals/editor-scenes.test.mjs
```

Expected: failures because the exports, sprite atlas panels, and panel mappings do not exist.

### Task 2: Capture the authentic four-state MakeCode atlas

**Files:**
- Modify: `site/tools/visuals/editor-scenes.mjs`
- Modify: `site/src/assets/lesson-visuals/editor/sprite-image-editor.webp`
- Modify: `site/src/lesson-visuals/generated-assets.ts`

- [x] **Step 1: Define the stable 16×16 hero**

Export two 16-row arrays. `heroSilhouette` uses `8` for a blue padded robot shape; `heroDetailed` copies it and replaces only interior pixels with white `1` eyes and a yellow `5` chest emblem. Every row is exactly 16 characters and `.` remains transparent.

```js
export const heroSilhouette = [
  '................', '.....888888.....', '....88888888....', '...8888888888...',
  '...8888888888...', '..888888888888..', '..888888888888..', '..888888888888..',
  '...8888888888...', '...8888888888...', '...8888888888...', '....88888888....',
  '...888....888...', '...888....888...', '...888....888...', '................',
];
export const heroDetailed = heroSilhouette.map((row, y) => [...row].map((pixel, x) => {
  if (pixel === '8' && y === 4 && [5, 6, 9, 10].includes(x)) return '1';
  if (pixel === '8' && [[7, 8], [6, 9], [7, 9], [8, 9], [9, 9], [7, 10], [8, 10]].some(([dx, dy]) => x === dx && y === dy)) return '5';
  return pixel;
}).join(''));
```

- [x] **Step 2: Add deterministic native editor painters**

Implement `paintImage(page, rows)` using `canvas.paint-surface.main` bounds, the official `Color N (...)` buttons, and center clicks in the 16×16 grid. Validate the dimensions and each row before painting. Add `silhouetteEditor` and `detailedEditor` preparations that call `assetEditor(page, 'Image')` and paint the matching rows.

```js
async function paintImage(page, rows) {
  if (rows.length !== 16 || rows.some(row => row.length !== 16 || /[^.0-9]/.test(row))) {
    throw new Error('sprite rows must be a 16×16 palette-index image');
  }
  const canvas = page.locator('canvas.paint-surface.main');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('missing sprite canvas');
  let selected;
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const color = rows[y][x];
    if (color === '.') continue;
    if (selected !== color) {
      await page.getByRole('button', { name: new RegExp(`^Color ${color} \\(`) }).click();
      selected = color;
    }
    await page.mouse.click(box.x + box.width * (x + 0.5) / 16, box.y + box.height * (y + 0.5) / 16);
  }
}

async function silhouetteEditor(page) { await assetEditor(page, 'Image'); await paintImage(page, heroSilhouette); }
async function detailedEditor(page) { await assetEditor(page, 'Image'); await paintImage(page, heroDetailed); }
```

- [x] **Step 3: Add a completed simulator preparation**

Create a clean project, switch to the official JavaScript editor only as capture plumbing, insert a block-convertible `sprites.create(img\`...\`, SpriteKind.Player)` program generated from `heroDetailed`, convert back to Blocks, restart, and wait for the simulator and workspace loading overlays to settle. The learner-facing curriculum remains blocks/Python.

```js
const arcadeImage = rows => rows.map(row => [...row].join(' ')).join('\n');
async function completedHeroWorkspace(page) {
  await project(page);
  await button(page, 'Convert code to JavaScript').click();
  const editor = page.locator('.monaco-editor textarea');
  await editor.focus();
  await page.keyboard.press('ControlOrMeta+KeyA');
  await page.keyboard.insertText(`let mySprite = sprites.create(img\`\n${arcadeImage(heroDetailed)}\n\`, SpriteKind.Player)`);
  await button(page, 'Convert code to Blocks').click();
  await button(page, 'Restart the simulator').click();
  await page.waitForFunction(() => [...document.querySelectorAll('.ui.active.loader')]
    .every(loader => !loader.getBoundingClientRect().width || getComputedStyle(loader).visibility === 'hidden'));
}
```

- [x] **Step 4: Turn the sprite capture into an atlas**

Keep the existing blank panel with `preserveFirstPanel: true`, then capture `[silhouetteEditor, detailedEditor, completedHeroWorkspace]` and declare panel names `['blank', 'silhouette', 'detailed', 'simulator']` through the same scene-option mechanism used by the tilemap atlas.

- [x] **Step 5: Run focused source tests before capture**

Run the two Task 1 commands. Expected: the capture-definition and pixel-progression assertions pass; the committed bitmap test remains RED with height 900 until Step 6 publishes the atlas.

- [x] **Step 6: Capture only the sprite scene atomically**

Run:

```bash
node --input-type=module <<'NODE'
import { chromium } from 'playwright';
import { captureEditorScenes } from './tools/capture-editor-scenes.mjs';
import { editorScenes } from './tools/visuals/editor-scenes.mjs';
const browser = await chromium.launch();
try {
  const sprite = editorScenes.find(({ id }) => id === 'editor:sprite-image-editor');
  await captureEditorScenes({ browser, scenes: [sprite], preserveUncaptured: true });
} finally {
  await browser.close();
}
NODE
```

Expected output: `sprite-image-editor.webp` is 1440×3600 and the registry records `panelCount: 4`; the other five WebPs remain byte-identical.

- [x] **Step 7: Inspect all four panels visually**

Extract temporary panel PNGs with Sharp or use the image viewer. Confirm official UI chrome, blank panel, identical blue silhouette base, visible white/yellow details, and the completed hero near the simulator center.

- [x] **Step 8: Re-run the Task 1 tests and verify GREEN**

Run both focused commands again. Expected: every test passes, including the committed 1440×3600 bitmap assertion.

### Task 3: Bind lesson 02 to the real progression

**Files:**
- Modify: `site/src/curriculum/campaign-01.ts`
- Modify: `site/e2e/lesson-visuals.spec.ts`

- [x] **Step 1: Update the four descriptors**

Set steps 03–06 to `sourcePanel` 0–3. Keep step 03's blank wording. Describe the visible blue silhouette in step 04, the white eyes/yellow emblem in step 05, and the completed hero in the simulator in step 06. Point each normalized focus rectangle at the relevant canvas or simulator region.

- [x] **Step 2: Add an E2E progression regression**

Open lesson 02, advance through steps 03–06, decode each editor image, and assert its inline `top` value is `0%`, `-100%`, `-200%`, and `-300%`. For every panel, open the lightbox and assert the same crop, truthful alt text, visible focus, focus restoration, and no page overflow.

```ts
test('lesson 02 sprite progression shows four truthful MakeCode states', async ({ page }) => {
  const lesson = lessons.find(({ id }) => id === 'lesson-02')!;
  await page.goto(`/#/lesson/${lesson.slug}`);
  for (let index = 0; index < lesson.steps.length; index++) {
    if (index > 0) await continueStep(page);
    if (index < 2) continue;
    const visual = lesson.steps[index].visual;
    if (visual.kind !== 'editor') throw new Error('Expected editor progression');
    const figure = page.locator('.visual-figure');
    const image = figure.getByRole('img', { name: visual.alt });
    await image.evaluate((element: HTMLImageElement) => element.decode());
    await expect(image).toHaveCSS('top', `${-900 * (visual.sourcePanel ?? 0)}px`);
    const opener = figure.getByRole('button', { name: 'Відкрити крупніше' });
    await opener.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('img', { name: visual.alt })).toHaveCSS('top', `${-900 * (visual.sourcePanel ?? 0)}px`);
    await expect(dialog.locator('.visual-focus')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(opener).toBeFocused();
    await expectNoOverflow(page);
  }
});
```

- [x] **Step 3: Run focused verification**

Run:

```bash
npm test -- src/curriculum/campaign-01.test.ts src/components/StepVisual.test.tsx
node --test tools/visuals/editor-scenes.test.mjs tools/visuals/check-visual-assets.test.mjs
npx playwright test e2e/lesson-visuals.spec.ts --grep 'lesson 02 sprite progression'
npm run visuals:check
```

Expected: all pass; visual audit reports 93 SVGs plus six editor WebPs.

- [x] **Step 4: Run full verification**

Run:

```bash
npm run check
npm run test:e2e
npm audit --audit-level=high
git diff --check
```

Expected: typecheck, 255+ application tests, 243+ local authoring tests, production build, all applicable E2E tests, dependency audit, and whitespace validation pass.

- [x] **Step 5: Commit the implementation**

Stage only the capture source/tests, curriculum/tests, E2E regression, generated registry, and the changed sprite WebP. Commit as:

```bash
git commit -m "fix: show authentic sprite progression"
```

Do not stage ignored `.superpowers/` evidence, push, publish, or alter the other five editor WebPs.
