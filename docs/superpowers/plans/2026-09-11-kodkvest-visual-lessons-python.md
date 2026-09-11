# КодКвест Visual Lessons and Python Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one clear, local visual to every practical step in all 24 lessons, render block programs with the official MakeCode Arcade block renderer, and replace the learner-facing JavaScript/TypeScript track in campaign 6 with Blocks → Python.

**Architecture:** Keep the React/Vite application static and offline at runtime. Curriculum steps reference a discriminated visual descriptor; reusable React components resolve committed assets through a generated registry. Separate Node/Playwright authoring tools contact the official MakeCode renderer and capture editor surfaces into a staging directory, validate a complete batch, and only then replace committed SVG/WebP assets. Level 6 keeps stable lesson IDs for progress while canonical slugs and learner content move to Python; old slugs remain read-only aliases.

**Tech Stack:** React 19, TypeScript 5.9, Vite 8, Vitest, Testing Library, Node.js ESM, Playwright 1.63, official MakeCode Arcade renderer.

---

## Ground rules and fixed inventory

- Run npm, Node, and test commands from `/Users/sidlovskyy/projects/me/kodkvest/site`. Run every `git` command from the repository root `/Users/sidlovskyy/projects/me/kodkvest`; the staged paths below are root-relative.
- Preserve `.superpowers/`; it is unrelated, untracked user/workflow state.
- Do not add a backend, runtime iframe, runtime renderer request, analytics, or remote visual asset.
- Do not edit global or project MCP configuration.
- Keep all learner-facing prose Ukrainian. Keep labels inside official MakeCode blocks in English because Arcade has no Ukrainian block locale.
- Keep the existing 24 lesson IDs and all 145 step IDs. Progress remains keyed by lesson and step IDs.
- A `blocks` visual contains the complete accumulated script after that step, not an isolated new block. The normalized focus rectangle identifies only the newly added or changed part and is also labeled `Додай зараз`.
- An `editor` visual uses one of the committed base screenshots and one normalized focus rectangle. Reuse the same bitmap for different focus rectangles.
- Python must be selectable text. Renderer input TypeScript is authoring metadata only and must never be imported by runtime code.
- Run the focused test after every red/green step and make the listed commit before moving to the next task.

The approved final visual inventory is:

| Kind | Count | Local bitmap/SVG requirement |
|---|---:|---|
| `blocks` | 87 | One exact MakeCode SVG per step |
| `comparison` | 5 | One exact MakeCode SVG plus Python text per step |
| `python` | 13 | Python text only |
| `editor` | 19 | Reuses a small set of MakeCode WebP screenshots |
| `guide` | 21 | Semantic HTML only |
| **Total** | **145** | **92 block SVGs** |

The reusable editor scene IDs are fixed to:

- `editor:arcade-home`
- `editor:blocks-workspace`
- `editor:sprite-image-editor`
- `editor:animation-extension`
- `editor:animation-frames`
- `editor:tilemap-editor`

## Task 1: Introduce the visual data contract and isolated validator

**Files:**

- Create: `src/lesson-visuals/types.ts`
- Create: `src/lesson-visuals/validate.ts`
- Create: `src/lesson-visuals/validate.test.ts`
- Modify: `src/curriculum/types.ts`

- [ ] **Step 1: Write failing validator tests for every visual kind**

Cover one valid descriptor for each of `blocks`, `editor`, `python`, `comparison`, and `guide`. Also cover these exact failures: blank Ukrainian alt text, blank explanation, unknown asset ID, asset-kind mismatch, empty Python, empty guide items, and any focus coordinate outside `0..1` or whose `x + width`/`y + height` exceeds `1`.

Use this fixture shape in `src/lesson-visuals/validate.test.ts`:

```ts
const assets = {
  'blocks:lesson-01-step-04': { kind: 'blocks', src: '/blocks.svg' },
  'editor:blocks-workspace': { kind: 'editor', src: '/editor.webp' },
} as const;

const blockVisual: LessonStepVisual = {
  kind: 'blocks',
  assetId: 'blocks:lesson-01-step-04',
  alt: 'Блок on start зі зміною кольору тла.',
  explanation: 'Цей блок задає колір сцени після запуску.',
  focus: { x: 0.08, y: 0.42, width: 0.84, height: 0.38, label: 'Додай зараз' },
};
```

- [ ] **Step 2: Run the test and confirm the red state**

Run: `npm test -- src/lesson-visuals/validate.test.ts`

Expected: FAIL because the visual modules do not exist.

- [ ] **Step 3: Add the discriminated union**

Implement these exact public shapes in `src/lesson-visuals/types.ts`:

```ts
export interface NormalizedRect {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

interface ExplainedVisual {
  explanation: string;
}

export interface BlocksStepVisual extends ExplainedVisual {
  kind: 'blocks';
  assetId: string;
  alt: string;
  focus: NormalizedRect;
}

export interface EditorStepVisual extends ExplainedVisual {
  kind: 'editor';
  assetId: string;
  alt: string;
  focus: NormalizedRect;
}

export interface PythonStepVisual extends ExplainedVisual {
  kind: 'python';
  label: string;
  code: string;
}

export interface ComparisonStepVisual extends ExplainedVisual {
  kind: 'comparison';
  blocks: Omit<BlocksStepVisual, 'kind' | 'explanation'>;
  python: Pick<PythonStepVisual, 'label' | 'code'>;
}

export interface GuideStepVisual {
  kind: 'guide';
  title: string;
  items: [string, ...string[]];
}

export type LessonStepVisual =
  | BlocksStepVisual
  | EditorStepVisual
  | PythonStepVisual
  | ComparisonStepVisual
  | GuideStepVisual;

export interface LessonVisualAsset {
  kind: 'blocks' | 'editor';
  src: string;
}

export type LessonVisualAssetRegistry = Readonly<Record<string, LessonVisualAsset>>;
```

Add `visual?: LessonStepVisual` to `LessonStep` as a deliberate compile bridge. Task 11 removes `?` after every campaign is migrated.

- [ ] **Step 4: Implement `validateLessonVisual`**

Export `validateLessonVisual(stepId, visual, assets): string[]`. Prefix every diagnostic with the step ID, verify all required strings with `.trim()`, validate the full normalized rectangle, and resolve both the top-level and comparison `assetId` against the passed registry. Do not import generated assets into this pure validator.

- [ ] **Step 5: Run the focused and existing curriculum tests**

Run: `npm test -- src/lesson-visuals/validate.test.ts src/curriculum/validate.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add site/src/lesson-visuals site/src/curriculum/types.ts
git commit -m "feat: define lesson visual descriptors"
```

## Task 2: Build the atomic MakeCode block authoring pipeline

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `site/.gitignore`
- Create: `tools/visuals/render-blocks-lib.mjs`
- Create: `tools/visuals/render-blocks-lib.test.mjs`
- Create: `tools/render-block-visuals.mjs`
- Create: `tools/check-visual-assets.mjs`
- Create: `tools/generate-visual-registry.mjs`
- Create: `tools/visuals/catalog/index.mjs`
- Create: `tools/visuals/catalog/campaign-01.mjs`
- Create: `src/lesson-visuals/generated-assets.ts`
- Create after generation: `src/assets/lesson-visuals/blocks/lesson-01-step-04.svg`

- [ ] **Step 1: Install the authoring-only browser dependency and scripts**

Run: `npm install --save-dev playwright@1.63.0 sharp@0.35.4`

Add these scripts:

```json
{
  "visuals:setup": "playwright install chromium",
  "visuals:test": "node --test tools/visuals/*.test.mjs",
  "visuals:render": "node tools/render-block-visuals.mjs",
  "visuals:registry": "node tools/generate-visual-registry.mjs",
  "visuals:check": "node tools/check-visual-assets.mjs"
}
```

Add `/.visuals-tmp/` to `site/.gitignore`.

- [ ] **Step 2: Write failing Node tests for batch safety**

Test pure helpers with `node:test` and real temporary directories created under `os.tmpdir()`. Cover duplicate IDs, a response from a non-MakeCode origin, wrong `source`, wrong response ID, an `error`, blank/malformed SVG, zero dimensions, a missing response, and the atomic rule that a failed staged batch leaves an existing live SVG byte-for-byte unchanged.

Run: `npm run visuals:test`

Expected: FAIL because `render-blocks-lib.mjs` does not exist.

- [ ] **Step 3: Implement the catalog and response validation**

Each catalog entry has this exact shape:

```js
{
  id: 'lesson-01-step-04',
  code: `scene.setBackgroundColor(7)`,
  options: { snippetMode: true },
}
```

`catalog/index.mjs` concatenates all six campaign modules and fails on duplicate IDs. Start `campaign-01.mjs` with the entry above; later campaign tasks expand it. Export helpers from `render-blocks-lib.mjs` for catalog validation, response validation, SVG safety validation, and staged replacement.

Require all successful messages to satisfy:

```js
event.origin === 'https://arcade.makecode.com'
event.source === rendererFrame.contentWindow
message.source === 'makecode'
message.type === 'renderblocks'
typeof message.svg === 'string' && message.svg.trim().startsWith('<svg')
Number.isFinite(message.width) && message.width > 0
Number.isFinite(message.height) && message.height > 0
```

Reject SVG containing `<script`, `javascript:`, or a remote `href`. Include the catalog ID in every thrown error.

- [ ] **Step 4: Implement the Playwright renderer protocol**

`render-block-visuals.mjs` must:

1. launch Chromium;
2. load a blank local page with a hidden iframe at `https://arcade.makecode.com/--docs?render=1&lang=en`;
3. wait for the trusted `renderready` message;
4. post one `{ type: 'renderblocks', id, code, options }` request at a time to `https://arcade.makecode.com/`;
5. validate the matching response;
6. write all SVGs under `.visuals-tmp/blocks/`;
7. replace `src/assets/lesson-visuals/blocks/` only after every catalog entry succeeds;
8. call the registry generator; and
9. close Chromium in `finally`.

Use a 30-second ready timeout and a 30-second timeout per snippet. Do not keep partial results after failure.

- [ ] **Step 5: Generate the typed asset registry**

`generate-visual-registry.mjs` scans only committed `.svg` and `.webp` files and writes stable, sorted imports to `src/lesson-visuals/generated-assets.ts`:

```ts
import lesson01Step04 from '../assets/lesson-visuals/blocks/lesson-01-step-04.svg';

export const lessonVisualAssets = {
  'blocks:lesson-01-step-04': { kind: 'blocks', src: lesson01Step04 },
} as const;

export type LessonVisualAssetId = keyof typeof lessonVisualAssets;
```

`check-visual-assets.mjs` runs the same scan in check-only mode and exits nonzero if the generated file differs, an import target is missing, a block catalog entry lacks an SVG, or an SVG lacks positive `viewBox`/dimensions.

- [ ] **Step 6: Prove the pipeline on the first real block**

Run:

```bash
npm run visuals:setup
npm run visuals:render
npm run visuals:test
npm run visuals:check
```

Expected: one exact English-label MakeCode SVG exists for `lesson-01-step-04`; all authoring tests and checks pass.

- [ ] **Step 7: Commit**

```bash
git add .gitignore site/package.json site/package-lock.json site/tools site/src/lesson-visuals/generated-assets.ts site/src/assets/lesson-visuals/blocks
git commit -m "build: add MakeCode block asset pipeline"
```

## Task 3: Capture reusable MakeCode editor screenshots locally

**Files:**

- Create: `tools/visuals/editor-scenes.mjs`
- Create: `tools/visuals/editor-scenes.test.mjs`
- Create: `tools/capture-editor-scenes.mjs`
- Modify: `package.json`
- Regenerate: `src/lesson-visuals/generated-assets.ts`
- Create after capture: `src/assets/lesson-visuals/editor/*.webp`

- [ ] **Step 1: Write failing scene-definition tests**

Assert that there are exactly six unique scene IDs matching the fixed inventory, every URL begins with `https://arcade.makecode.com/`, the viewport is `1440×900`, each scene has a non-empty `prepare` function, and output names end in `.webp`.

Run: `npm run visuals:test`

Expected: FAIL because the scene module is missing.

- [ ] **Step 2: Define exact capture scenes**

Implement these deterministic states:

| Asset ID | State captured at 1440×900 |
|---|---|
| `editor:arcade-home` | Arcade home with the `New Project` button visible |
| `editor:blocks-workspace` | A named blank project showing simulator, toolbox, workspace, project-name control, Save, Pause, and Restart |
| `editor:sprite-image-editor` | The 16×16 sprite image editor with palette and canvas visible |
| `editor:animation-extension` | The Extensions gallery with the official Animation tile visible |
| `editor:animation-frames` | The Animation frame editor with its frame strip visible |
| `editor:tilemap-editor` | The tilemap editor with size, tile palette, wall tool, and canvas visible |

Use role/text locators first. If MakeCode exposes a necessary control only inside its editor iframe, scope the locator with `frameLocator`. Set `animations: 'disabled'`, wait for fonts, and mask only volatile anonymous project identifiers; do not mask instructional controls.

- [ ] **Step 3: Implement staged WebP capture**

Add `"visuals:capture": "node tools/capture-editor-scenes.mjs"`. The script captures each scene as a PNG in `.visuals-tmp/editor-png`, converts it with Sharp to lossless WebP in `.visuals-tmp/editor`, verifies `width > 0` and `height > 0` from Sharp metadata, then atomically replaces `src/assets/lesson-visuals/editor/` and regenerates the registry. A failed scene must leave the live directory unchanged.

- [ ] **Step 4: Capture and inspect all six surfaces**

Run:

```bash
npm run visuals:capture
npm run visuals:check
```

Open each WebP and confirm it contains no personal name, email, recent-project title, avatar, browser chrome, or cookie banner. Confirm every required control in the table is legible at native size. Re-capture until all six pass.

- [ ] **Step 5: Commit**

```bash
git add site/package.json site/tools site/src/assets/lesson-visuals/editor site/src/lesson-visuals/generated-assets.ts
git commit -m "build: capture reusable MakeCode editor scenes"
```

## Task 4: Build accessible visual components and the lesson-1 vertical slice

**Files:**

- Create: `src/lesson-visuals/pythonTokens.ts`
- Create: `src/lesson-visuals/pythonTokens.test.ts`
- Create: `src/components/StepVisual.tsx`
- Create: `src/components/StepVisual.test.tsx`
- Create: `src/components/BlockDiagram.tsx`
- Create: `src/components/EditorScreenshot.tsx`
- Create: `src/components/PythonExample.tsx`
- Create: `src/components/BlocksPythonComparison.tsx`
- Create: `src/components/GuideVisual.tsx`
- Create: `src/components/VisualLightbox.tsx`
- Modify: `src/components/LessonScreen.tsx`
- Modify: `src/components/LessonScreen.test.tsx`
- Modify: `src/curriculum/campaign-01.ts`
- Modify: `src/styles/global.css`

- [ ] **Step 1: Write failing component and tokenizer tests**

Test all five variants. Required assertions:

- `blocks` renders the registry asset, Ukrainian alt, explanation, focus overlay, and `Додай зараз` text;
- `editor` renders with `loading="lazy"` and the step-specific callout;
- `python` exposes code as text and copies the exact unmodified string;
- copy success announces `Скопійовано` through `role="status"` and returns to `Копіювати код` after two seconds using fake timers;
- `comparison` has headings `Блоки` and `Python` in DOM order;
- `guide` is a semantic ordered list;
- a failed image shows its alt and explanation as text without removing the instruction;
- `Відкрити крупніше` opens an `aria-modal` dialog, `Escape` closes it, and focus returns to the opener;
- the Python tokenizer identifies keywords, strings, numbers, comments, identifiers, punctuation, and whitespace without changing concatenated source text.

Run: `npm test -- src/lesson-visuals/pythonTokens.test.ts src/components/StepVisual.test.tsx`

Expected: FAIL because the components do not exist.

- [ ] **Step 2: Implement the pure Python tokenizer**

Return `{ type, value }[]` tokens and render spans with `data-token` attributes. Never use `dangerouslySetInnerHTML`. Verify `tokens.map(({ value }) => value).join('') === source` in tests.

- [ ] **Step 3: Implement the five renderers and dispatcher**

Resolve assets only through `lessonVisualAssets[assetId]`. `StepVisual` must use an exhaustive `switch` with a `never` guard. Images use `decoding="async"`; the current step uses `loading="eager"` and an editor screenshot can use `loading="lazy"`. Use CSS percentage positioning from the normalized focus rectangle:

```tsx
style={{
  left: `${focus.x * 100}%`,
  top: `${focus.y * 100}%`,
  width: `${focus.width * 100}%`,
  height: `${focus.height * 100}%`,
}}
```

The lightbox must render only while open, focus its close button on mount, trap `Tab` between dialog controls, close on `Escape` or the explicit `Закрити` button, lock body scrolling, and restore the prior focused element on cleanup.

- [ ] **Step 4: Add the first six real descriptors**

Add these visuals to lesson 1:

| Step | Kind | Asset |
|---|---|---|
| `lesson-01-step-01` | editor | `editor:arcade-home` |
| `lesson-01-step-02` | editor | `editor:blocks-workspace` |
| `lesson-01-step-03` | editor | `editor:blocks-workspace` |
| `lesson-01-step-04` | blocks | `blocks:lesson-01-step-04` |
| `lesson-01-step-05` | editor | `editor:blocks-workspace` |
| `lesson-01-step-06` | editor | `editor:blocks-workspace` |

Use a different normalized focus rectangle and Ukrainian callout for each editor step. The block explanation must say that `set background color` runs inside `on start` and changes the simulator background.

- [ ] **Step 5: Insert the visual at the correct lesson position**

In `PracticalStep`, render `<StepVisual visual={step.visual} eager />` immediately after `.practical-step__instruction` and before `.expected-result`. Keep a temporary null guard until Task 11:

```tsx
{step.visual && <StepVisual visual={step.visual} eager />}
```

Extend `LessonScreen.test.tsx` to assert instruction → visual → expected-result DOM order and prove step completion, XP, and review mode behavior are unchanged.

- [ ] **Step 6: Add responsive and accessible styles**

Keep the page free of horizontal scrolling. The in-card image is `max-width: 100%`; the lightbox may pan inside its own scroll container. Use a 3px pink focus outline plus a visible `Додай зараз` pill. All copy/enlarge/close buttons are at least 44×44 px. At `max-width: 760px`, the comparison becomes one column and the visual toolbar wraps. Honor existing reduced-motion rules.

- [ ] **Step 7: Run the vertical-slice checks**

Run:

```bash
npm test -- src/lesson-visuals src/components/StepVisual.test.tsx src/components/LessonScreen.test.tsx
npm run typecheck
npm run build
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add site/src/components site/src/lesson-visuals site/src/curriculum/campaign-01.ts site/src/styles/global.css
git commit -m "feat: show accessible visuals in lesson steps"
```

## Task 5: Complete campaign 1 visuals

**Files:**

- Modify: `tools/visuals/catalog/campaign-01.mjs`
- Modify: `src/curriculum/campaign-01.ts`
- Modify: `src/curriculum/validate.test.ts`
- Regenerate: `src/assets/lesson-visuals/blocks/*.svg`
- Regenerate: `src/lesson-visuals/generated-assets.ts`

- [ ] **Step 1: Add a failing campaign-1 coverage assertion**

Assert all 24 campaign-1 steps have a visual and assert this exact kind tally:

```ts
expect(countVisualKinds(campaign01)).toEqual({
  blocks: 10,
  editor: 11,
  guide: 3,
  python: 0,
  comparison: 0,
});
```

Run: `npm test -- src/curriculum/validate.test.ts`

Expected: FAIL because lessons 2–4 lack descriptors.

- [ ] **Step 2: Add the remaining exact visual assignments**

Use `editor` for:

- `lesson-02-step-01` → `editor:arcade-home`
- `lesson-02-step-03`, `lesson-02-step-04`, `lesson-02-step-05` → `editor:sprite-image-editor`
- `lesson-02-step-06` → `editor:blocks-workspace`
- `lesson-04-step-03` → `editor:sprite-image-editor`

Use `guide` for `lesson-03-step-03`, `lesson-03-step-04`, and `lesson-04-step-06`. Their lists respectively explain the x axis, y axis, and a three-route play-test.

Use `blocks` for these ten steps:

```text
lesson-01-step-04
lesson-02-step-02
lesson-03-step-01 lesson-03-step-02 lesson-03-step-05 lesson-03-step-06
lesson-04-step-01 lesson-04-step-02 lesson-04-step-04 lesson-04-step-05
```

For every block entry, add the complete accumulated program for that lesson through that step to the campaign catalog. Make drawn sprite images simple but valid 16×16 `img` literals so the renderer shows the image field. Keep variable names identical to the lesson text (`mySprite`, `finish`).

- [ ] **Step 3: Generate and validate campaign 1**

Run:

```bash
npm run visuals:render
npm run visuals:check
npm test -- src/curriculum/validate.test.ts src/components/LessonScreen.test.tsx
```

Expected: 10 campaign-1 SVGs; all 24 steps covered; PASS.

- [ ] **Step 4: Visually inspect the ten SVGs**

Confirm full scripts are not clipped, labels are English, nested blocks attach correctly, selected SpriteKinds and numbers match the instruction, and each descriptor focus rectangle surrounds only the new change.

- [ ] **Step 5: Commit**

```bash
git add site/tools/visuals/catalog/campaign-01.mjs site/src/curriculum/campaign-01.ts site/src/curriculum/validate.test.ts site/src/assets/lesson-visuals/blocks site/src/lesson-visuals/generated-assets.ts
git commit -m "content: add campaign one lesson visuals"
```

## Task 6: Add campaign 2 block progression and guides

**Files:**

- Create: `tools/visuals/catalog/campaign-02.mjs`
- Modify: `tools/visuals/catalog/index.mjs`
- Modify: `src/curriculum/campaign-02.ts`
- Modify: `src/curriculum/validate.test.ts`
- Regenerate: `src/assets/lesson-visuals/blocks/*.svg`
- Regenerate: `src/lesson-visuals/generated-assets.ts`

- [ ] **Step 1: Add a failing coverage test**

Assert campaign 2 has `{ blocks: 20, editor: 0, guide: 4, python: 0, comparison: 0 }`.

- [ ] **Step 2: Assign the four guide steps**

Use `guide` for:

- `lesson-05-step-05` — button-event test matrix;
- `lesson-06-step-06` — overlap test cases;
- `lesson-07-step-06` — score/life/time restart checklist;
- `lesson-08-step-06` — three complete catch-game runs.

- [ ] **Step 3: Assign exact block visuals to every other campaign-2 step**

The block IDs are:

```text
lesson-05-step-01 lesson-05-step-02 lesson-05-step-03 lesson-05-step-04 lesson-05-step-06
lesson-06-step-01 lesson-06-step-02 lesson-06-step-03 lesson-06-step-04 lesson-06-step-05
lesson-07-step-01 lesson-07-step-02 lesson-07-step-03 lesson-07-step-04 lesson-07-step-05
lesson-08-step-01 lesson-08-step-02 lesson-08-step-03 lesson-08-step-04 lesson-08-step-05
```

Build cumulative source separately per lesson; event handlers stay as separate top-level stacks in the same SVG. Match all button names, SpriteKinds, scores, lives, countdowns, velocities, destroy effects, and numeric values to the corresponding instruction.

- [ ] **Step 4: Render, verify, and run tests**

Run:

```bash
npm run visuals:render
npm run visuals:check
npm test -- src/curriculum/validate.test.ts
```

Expected: 30 total block SVGs and full coverage for campaigns 1–2.

- [ ] **Step 5: Commit**

```bash
git add site/tools/visuals/catalog site/src/curriculum/campaign-02.ts site/src/curriculum/validate.test.ts site/src/assets/lesson-visuals/blocks site/src/lesson-visuals/generated-assets.ts
git commit -m "content: add campaign two lesson visuals"
```

## Task 7: Add campaign 3 visuals

**Files:**

- Create: `tools/visuals/catalog/campaign-03.mjs`
- Modify: `tools/visuals/catalog/index.mjs`
- Modify: `src/curriculum/campaign-03.ts`
- Modify: `src/curriculum/validate.test.ts`
- Regenerate: `src/assets/lesson-visuals/blocks/*.svg`
- Regenerate: `src/lesson-visuals/generated-assets.ts`

- [ ] **Step 1: Add a failing coverage test**

Assert campaign 3 has `{ blocks: 19, editor: 1, guide: 4, python: 0, comparison: 0 }`.

- [ ] **Step 2: Assign non-block visuals exactly**

Use `editor:sprite-image-editor` for `lesson-11-step-02`. Its focus and explanation point to the small star image being drawn; the surrounding instruction continues to name the `repeat` and sprite blocks.

Use `guide` for:

- `lesson-09-step-06` — projectile and danger play-test;
- `lesson-10-step-06` — both branches of the game-decision test;
- `lesson-11-step-05` — escalating-loop observation log;
- `lesson-12-step-06` — three-run shooter checklist.

- [ ] **Step 3: Assign block visuals to the remaining 19 steps**

```text
lesson-09-step-01 lesson-09-step-02 lesson-09-step-03 lesson-09-step-04 lesson-09-step-05
lesson-10-step-01 lesson-10-step-02 lesson-10-step-03 lesson-10-step-04 lesson-10-step-05
lesson-11-step-01 lesson-11-step-03 lesson-11-step-04 lesson-11-step-06
lesson-12-step-01 lesson-12-step-02 lesson-12-step-03 lesson-12-step-04 lesson-12-step-05
```

Catalog sources must preserve separate event/update stacks and show complete state for projectile creation, random positions, conditions, update intervals, and enemy spawning.

- [ ] **Step 4: Render, inspect, and verify**

Run:

```bash
npm run visuals:render
npm run visuals:check
npm test -- src/curriculum/validate.test.ts
```

Expected: 49 total block SVGs and full coverage for campaigns 1–3.

- [ ] **Step 5: Commit**

```bash
git add site/tools/visuals/catalog site/src/curriculum/campaign-03.ts site/src/curriculum/validate.test.ts site/src/assets/lesson-visuals/blocks site/src/lesson-visuals/generated-assets.ts
git commit -m "content: add campaign three lesson visuals"
```

## Task 8: Add campaign 4 world-building visuals

**Files:**

- Create: `tools/visuals/catalog/campaign-04.mjs`
- Modify: `tools/visuals/catalog/index.mjs`
- Modify: `src/curriculum/campaign-04.ts`
- Modify: `src/curriculum/validate.test.ts`
- Regenerate: `src/assets/lesson-visuals/blocks/*.svg`
- Regenerate: `src/lesson-visuals/generated-assets.ts`

- [ ] **Step 1: Add a failing coverage test**

Assert campaign 4 has `{ blocks: 17, editor: 6, guide: 1, python: 0, comparison: 0 }`.

- [ ] **Step 2: Assign editor and guide steps**

Use these exact editor assets:

| Step | Asset |
|---|---|
| `lesson-13-step-02` | `editor:animation-extension` |
| `lesson-13-step-03` | `editor:animation-frames` |
| `lesson-14-step-01` | `editor:tilemap-editor` |
| `lesson-14-step-02` | `editor:tilemap-editor` |
| `lesson-14-step-03` | `editor:tilemap-editor` |
| `lesson-16-step-01` | `editor:tilemap-editor` |

Use `guide` for `lesson-14-step-06` with a collision/camera walkthrough checklist.

- [ ] **Step 3: Assign block visuals to the other 17 steps**

```text
lesson-13-step-01 lesson-13-step-04 lesson-13-step-05 lesson-13-step-06
lesson-14-step-04 lesson-14-step-05
lesson-15-step-01 lesson-15-step-02 lesson-15-step-03 lesson-15-step-04 lesson-15-step-05 lesson-15-step-06
lesson-16-step-02 lesson-16-step-03 lesson-16-step-04 lesson-16-step-05 lesson-16-step-06
```

Include required extension packages in renderer options. For Animation use the official built-in/extension configuration required by current Arcade; for any extension call, set the catalog `options.package` to the exact package spec verified in MakeCode. Tilemap sources must use valid tile assets and preserve the lesson’s wall/location semantics.

- [ ] **Step 4: Render, inspect, and verify**

Run:

```bash
npm run visuals:render
npm run visuals:check
npm test -- src/curriculum/validate.test.ts
```

Expected: 66 total block SVGs and full coverage for campaigns 1–4.

- [ ] **Step 5: Commit**

```bash
git add site/tools/visuals/catalog site/src/curriculum/campaign-04.ts site/src/curriculum/validate.test.ts site/src/assets/lesson-visuals/blocks site/src/lesson-visuals/generated-assets.ts
git commit -m "content: add campaign four lesson visuals"
```

## Task 9: Add campaign 5 advanced block visuals

**Files:**

- Create: `tools/visuals/catalog/campaign-05.mjs`
- Modify: `tools/visuals/catalog/index.mjs`
- Modify: `src/curriculum/campaign-05.ts`
- Modify: `src/curriculum/validate.test.ts`
- Regenerate: `src/assets/lesson-visuals/blocks/*.svg`
- Regenerate: `src/lesson-visuals/generated-assets.ts`

- [ ] **Step 1: Add a failing coverage test**

Assert campaign 5 has `{ blocks: 20, editor: 0, guide: 4, python: 0, comparison: 0 }`.

- [ ] **Step 2: Assign guide steps**

Use `guide` for:

- `lesson-18-step-04` — compare two enemy behaviors;
- `lesson-19-step-05` — play-test observation notes;
- `lesson-19-step-06` — one-change regression checklist;
- `lesson-20-step-06` — complete boss-arena test runs.

- [ ] **Step 3: Assign block visuals to the remaining 20 steps**

```text
lesson-17-step-01 lesson-17-step-02 lesson-17-step-03 lesson-17-step-04 lesson-17-step-05 lesson-17-step-06
lesson-18-step-01 lesson-18-step-02 lesson-18-step-03 lesson-18-step-05 lesson-18-step-06
lesson-19-step-01 lesson-19-step-02 lesson-19-step-03 lesson-19-step-04
lesson-20-step-01 lesson-20-step-02 lesson-20-step-03 lesson-20-step-04 lesson-20-step-05
```

Preserve cumulative state for levels, arrays, functions, boss health, AI/update events, and difficulty parameters. A focus rectangle may enclose a whole new event stack when that stack is the current step.

- [ ] **Step 4: Render and verify**

Run:

```bash
npm run visuals:render
npm run visuals:check
npm test -- src/curriculum/validate.test.ts
```

Expected: 86 total block SVGs and full coverage for campaigns 1–5.

- [ ] **Step 5: Commit**

```bash
git add site/tools/visuals/catalog site/src/curriculum/campaign-05.ts site/src/curriculum/validate.test.ts site/src/assets/lesson-visuals/blocks site/src/lesson-visuals/generated-assets.ts
git commit -m "content: add campaign five lesson visuals"
```

## Task 10: Rewrite campaign 6 as Blocks → Python and preserve old links

**Files:**

- Create: `tools/visuals/catalog/campaign-06.mjs`
- Modify: `tools/visuals/catalog/index.mjs`
- Modify: `src/curriculum/campaign-06.ts`
- Modify: `src/curriculum/index.ts`
- Modify: `src/curriculum/validate.test.ts`
- Modify: `src/components/App.integration.test.tsx`
- Regenerate: `src/assets/lesson-visuals/blocks/*.svg`
- Regenerate: `src/lesson-visuals/generated-assets.ts`

- [ ] **Step 1: Write failing Python-track and compatibility tests**

Assert:

```ts
expect(campaign06.lessons.map(({ slug, title }) => [slug, title])).toEqual([
  ['vid-blokiv-do-python', 'Від блоків до Python'],
  ['python-u-hri', 'Python у грі'],
  ['hrafika-maistra', 'Графіка майстра'],
  ['moia-vlasna-hra', 'Моя власна гра'],
]);

expect(JSON.stringify(campaign06)).not.toMatch(/JavaScript|TypeScript/);
expect(countVisualKinds(campaign06)).toEqual({
  blocks: 1,
  editor: 1,
  guide: 5,
  python: 13,
  comparison: 5,
});
```

Also assert that `lessonBySlug.get('vid-blokiv-do-kodu')` resolves lesson 21 and `lessonBySlug.get('typescript-u-hri')` resolves lesson 22, but both returned lessons expose their new canonical slugs. In `App.integration.test.tsx`, open an old hash and verify `rememberLesson` receives the new canonical slug while the existing lesson/step progress remains visible.

Run: `npm test -- src/curriculum/validate.test.ts src/components/App.integration.test.tsx`

Expected: FAIL on old campaign-6 content.

- [ ] **Step 2: Rewrite lesson 21 as `Від блоків до Python`**

Set slug `vid-blokiv-do-python`, link `https://arcade.makecode.com/python`, and teach this exact progression:

| Step | Kind | Learning action |
|---|---|---|
| `lesson-21-step-01` | blocks | Build a Player sprite, movement, and A-button speech baseline |
| `lesson-21-step-02` | comparison | Switch to Python and match sprite creation |
| `lesson-21-step-03` | comparison | Match the A-button event and named handler |
| `lesson-21-step-04` | python | Change a `speed = 80` variable and use it for x/y movement |
| `lesson-21-step-05` | comparison | Match an `if` condition that reacts to score |
| `lesson-21-step-06` | comparison | Switch back to Blocks, verify the round trip, then return to Python |

Use real Arcade Python syntax and event registration. The baseline form is:

```py
speed = 80

def on_a_pressed():
    my_sprite.say("Код працює!")
controller.A.on_event(ControllerButtonEvent.PRESSED, on_a_pressed)

my_sprite = sprites.create(img("""
    . . 5 5 5 5 . .
    . 5 5 5 5 5 5 .
    5 5 f 5 5 f 5 5
    5 5 5 5 5 5 5 5
    . 5 5 5 5 5 5 .
    . . 5 . . 5 . .
"""), SpriteKind.player)
controller.move_sprite(my_sprite, speed, speed)
```

Before committing, paste every Python example into current MakeCode Arcade Python mode, resolve any API casing/order emitted by Arcade, and copy the verified form back into the curriculum.

- [ ] **Step 3: Rewrite lesson 22 as `Python у грі`**

Set slug `python-u-hri`, link `https://arcade.makecode.com/python`, and use six `python` steps in this order: variable, list, typed-by-use function parameter, returned enemy sprite, `for speed in speeds`, then an `if/else` difficulty branch. Build cumulatively from:

```py
wave = 0
speeds = [30, 45, 60]

def spawn_enemy(speed):
    enemy = sprites.create(img("""
        . 2 2 .
        2 2 2 2
        2 . . 2
    """), SpriteKind.enemy)
    enemy.vy = speed
    return enemy

for speed in speeds:
    spawn_enemy(speed)
    pause(500)
```

The final step must run in MakeCode Python and explain indentation, list iteration, arguments, return values, and branches in Ukrainian without naming JavaScript or TypeScript.

- [ ] **Step 4: Convert lesson 23 code actions to Python**

Keep title/slug. Use `python` for steps 1, 2, 3, 4, and 6. Use `comparison` for step 5 to introduce the minimap extension block beside the verified Python API. Update instructions, expected results, hints, challenge, concepts, objective, and quiz so the learner edits Python. Verify the package in one Arcade project using `https://arcade.makecode.com/pkg/microsoft/arcade-minimap`; use that URL as the lesson link.

- [ ] **Step 5: Make lesson 24 a Python capstone**

Use `guide` for steps 1, 2, 4, 5, and 7. Use `python` for step 3 with a compact MVP scaffold containing explicit `setup_player`, `setup_goal`, and overlap handlers that the learner customizes. Use `editor:blocks-workspace` for step 6 and focus the Save control. Keep the privacy/adult-review requirement in step 7 and link to `https://arcade.makecode.com/share`.

- [ ] **Step 6: Add old-slug aliases without changing routing or progress schema**

In `src/curriculum/index.ts`, build the canonical map first, then add:

```ts
const legacyLessonSlugs = new Map([
  ['vid-blokiv-do-kodu', 'vid-blokiv-do-python'],
  ['typescript-u-hri', 'python-u-hri'],
]);

for (const [legacySlug, canonicalSlug] of legacyLessonSlugs) {
  const lesson = lessonBySlug.get(canonicalSlug);
  if (lesson) lessonBySlug.set(legacySlug, lesson);
}
```

Do not migrate localStorage: lesson IDs and step IDs are unchanged. `LessonScreen` already remembers `lesson.slug`, so opening a legacy alias updates `lastLessonSlug` to the canonical value.

- [ ] **Step 7: Render the six new campaign-6 block assets**

Add catalog entries for the single `blocks` step and the five comparison steps. Verify each Blocks/Python pair by opening one project in Blocks, switching to Python, and confirming semantic equivalence after the round trip.

Run:

```bash
npm run visuals:render
npm run visuals:check
npm test -- src/curriculum/validate.test.ts src/components/App.integration.test.tsx
```

Expected: 92 total block SVGs, 25 campaign-6 visuals, both old aliases working, and no learner-facing JavaScript/TypeScript in campaign 6.

- [ ] **Step 8: Commit**

```bash
git add site/tools/visuals/catalog site/src/curriculum site/src/components/App.integration.test.tsx site/src/assets/lesson-visuals/blocks site/src/lesson-visuals/generated-assets.ts
git commit -m "content: teach Python in the final campaign"
```

## Task 11: Make visual coverage mandatory and audit all local assets

**Files:**

- Modify: `src/curriculum/types.ts`
- Modify: `src/curriculum/validate.ts`
- Modify: `src/curriculum/validate.test.ts`
- Modify: `tools/check-visual-assets.mjs`
- Modify: `package.json`

- [ ] **Step 1: Add failing strict curriculum tests**

Add tests proving `validateCurriculum` rejects a missing visual, invalid descriptor, unknown asset, and asset-kind mismatch. Add aggregate assertions:

```ts
const steps = lessons.flatMap((lesson) => lesson.steps);
expect(steps).toHaveLength(145);
expect(steps.every((step) => step.visual)).toBe(true);
expect(new Set(steps.map((step) => step.id)).size).toBe(145);
expect(countAllVisualKinds(steps)).toEqual({
  blocks: 87,
  comparison: 5,
  python: 13,
  editor: 19,
  guide: 21,
});
```

Run: `npm test -- src/curriculum/validate.test.ts`

Expected: FAIL because the curriculum validator does not yet require visuals.

- [ ] **Step 2: Remove the migration escape hatch**

Change `LessonStep.visual?: LessonStepVisual` to `visual: LessonStepVisual`. Update the `makeSteps` fixture in `validate.test.ts` to add one valid guide descriptor to every generated step. In `validateCurriculum`, call `validateLessonVisual` for every step using `lessonVisualAssets`. Check duplicate step IDs across the complete curriculum as well as missing visuals. Keep diagnostics deterministic in campaign/lesson/step order.

- [ ] **Step 3: Strengthen the offline asset audit**

Make `visuals:check` compare the generated registry with a machine-readable block manifest produced by the campaign catalogs. Verify:

- all 92 block/comparison descriptor IDs have catalog source and committed SVG;
- all six expected editor WebPs are committed and registered;
- no SVG contains script or remote references;
- registry output is sorted and current;
- all 98 registered assets are local imports: 92 SVGs and 6 WebPs.

Keep curriculum-specific checks in Vitest, where TypeScript curriculum modules can be loaded directly: the strict test verifies 145 descriptors, the five exact kind counts, registry resolution for all 111 asset references (92 unique block IDs plus 19 editor references), and that every registered asset is referenced at least once.

Add `npm run visuals:test && npm run visuals:check` between unit tests and build in `npm run check`:

```json
"check": "npm run typecheck && npm run test && npm run visuals:test && npm run visuals:check && npm run build"
```

- [ ] **Step 4: Run the strict suite**

Run: `npm run check`

Expected: typecheck PASS, all Vitest and Node tests PASS, asset audit PASS, production build PASS.

- [ ] **Step 5: Inspect the production graph**

Run:

```bash
rg -n -- "--docs\?render=1|renderblocks|<iframe" src dist || true
find dist/assets -type f | sort
```

Expected: no runtime renderer/iframe matches; production contains hashed SVG/WebP assets referenced by the lessons.

- [ ] **Step 6: Commit**

```bash
git add site/src/curriculum site/tools/check-visual-assets.mjs site/package.json
git commit -m "test: enforce complete visual lesson coverage"
```

## Task 12: Add browser QA, documentation, and final verification

**Files:**

- Create: `playwright.config.ts`
- Create: `e2e/lesson-visuals.spec.ts`
- Modify: `package.json`
- Modify: `README.md`
- Modify if attribution copy needs correction: `src/components/SiteFooter.tsx`

- [ ] **Step 1: Write browser acceptance tests**

Add `"test:e2e": "playwright test"` and configure a Vite web server at `http://127.0.0.1:4173` using `npm run dev -- --host 127.0.0.1 --port 4173`. Test Chromium at desktop `1440×900`, tablet `820×1180`, and mobile `390×844`.

The test must:

1. open lesson 1 and assert instruction → visual → expected-result order;
2. assert every local visual request stays on `127.0.0.1`;
3. assert `document.documentElement.scrollWidth === document.documentElement.clientWidth` at all three widths;
4. open/close the block lightbox with keyboard and verify returned focus;
5. open lesson 21, advance to a comparison, and see both `Блоки` and `Python`;
6. open lesson 22 and copy Python code;
7. load both legacy slugs and see the canonical lesson titles; and
8. verify an editor screenshot has nonzero natural dimensions.

Run: `npm run test:e2e`

Expected: PASS in Chromium at all three sizes.

- [ ] **Step 2: Update author and hosting documentation**

Update `README.md` to say the course progresses from blocks to Python, not TypeScript. Document:

- runtime remains fully static with no backend;
- `npm run visuals:setup` is a one-time author workstation step;
- `npm run visuals:render` regenerates exact block SVGs and requires network access to official MakeCode;
- `npm run visuals:capture` refreshes base editor WebPs and must be privacy-reviewed;
- `npm run visuals:check` is offline and runs in `npm run check`;
- committed assets are required for GitHub Pages/static hosting;
- Gist can store files but is not a normal React site host;
- renderer source code is internal authoring material, while learners see blocks and Python.

Add Microsoft/MakeCode attribution without implying endorsement.

- [ ] **Step 3: Perform content QA across all 24 lessons**

For each lesson, use the step navigator from first to last and confirm:

- its visual matches the written action and expected result;
- a blocks SVG shows the full cumulative program and the focus is the current change;
- an editor callout points at exactly one visible control;
- a guide is actionable rather than decorative;
- Python indentation and API spelling match the verified Arcade project;
- no visual is clipped at desktop, tablet, or mobile width;
- completion, quiz, XP, hint, review mode, and saved progress behavior are unchanged.

Record any mismatch as a failing regression test before fixing it. Re-run the affected catalog renderer after any source correction.

- [ ] **Step 4: Run final clean verification**

Run the first four commands from `site`, then run the final status command from the repository root:

```bash
npm ci
npm run check
npm run test:e2e
npm audit --audit-level=high
cd .. && git status --short
```

Expected:

- dependency install succeeds from the lockfile;
- TypeScript, Vitest, Node authoring tests, asset checks, Vite build, and Playwright E2E all pass;
- no high/critical vulnerabilities;
- only intended project changes are present, with `.superpowers/` still untouched.

- [ ] **Step 5: Commit**

```bash
git add site/playwright.config.ts site/e2e site/package.json site/package-lock.json site/README.md site/src/components/SiteFooter.tsx
git commit -m "docs: verify and document visual Python course"
```

## Final acceptance evidence

Before reporting completion, include these measured facts in the handoff:

- total lessons and steps validated;
- descriptor count by all five visual kinds;
- committed MakeCode SVG count and reusable WebP count;
- exact `npm run check`, `npm run test:e2e`, and audit results;
- confirmation that `src`/`dist` contain no runtime renderer or iframe;
- confirmation that campaign 6 contains no learner-facing JavaScript/TypeScript;
- confirmation that old lesson-21 and lesson-22 slugs still open and preserve ID-keyed progress.
