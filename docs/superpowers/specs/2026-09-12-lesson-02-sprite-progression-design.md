# Lesson 02 authentic sprite progression

Date: 2026-09-12

## Problem and root cause

Lesson 02 correctly starts with a transparent 16×16 image, but steps 03–05 all reference the same `editor:sprite-image-editor` capture. That capture contains only the blank editor. Step 05 therefore says that a silhouette should already exist while showing an empty canvas. Step 06 similarly reuses the generic blank workspace, so the lesson never visually demonstrates its promised result.

The official MakeCode editor is expected to start blank. The defect is reusing that initial state after the learner has been asked to draw.

## Considered approaches

1. **One authentic four-panel atlas — selected.** Keep the existing WebP asset ID and file count, capture each state from the official MakeCode UI, and select panels with the existing `sourcePanel` mechanism.
2. **Three additional WebPs.** Simpler individual files, but expands the fixed editor-asset inventory and duplicates full-screen UI pixels.
3. **Draw a sprite over the blank screenshot in site CSS.** Smallest asset change, but produces a synthetic, potentially misleading MakeCode view and cannot faithfully show the simulator result.

## Design

`editor:sprite-image-editor` becomes a vertical atlas of four 1440×900 panels:

1. blank 16×16 image editor for step 03;
2. a simple solid hero silhouette for step 04;
3. the same hero with high-contrast face and emblem details for step 05;
4. the completed `Player` sprite visible in the simulator, with the real Restart control, for step 06.

The capture automation will build these states deterministically in isolated official MakeCode Arcade sessions. The sprite uses a compact, readable 16×16 design with transparent padding. The later states preserve the earlier pixels so the images teach progression instead of unrelated examples.

Steps 03–06 retain their IDs, order, instructions, expected outcomes, and progress semantics. Their visual descriptors select the appropriate panel and use truthful Ukrainian alt text, focus labels, and explanations. Step 05 must no longer claim that the example is only a palette reference; step 06 must no longer describe the captured project as blank.

No runtime renderer, iframe, backend, synthetic MakeCode UI, new asset file, or learner-facing JavaScript is introduced.

## Failure handling

The existing capture pipeline remains atomic: it stages every requested panel, validates dimensions, replaces the live asset only after all captures succeed, regenerates the asset registry, and rolls back on failure. Every browser context remains isolated from cookies and project history.

## Verification

Tests must fail before the new capture/content exists and then prove:

- the sprite editor asset advertises exactly four panels;
- lesson 02 maps steps 03–06 to panels 0–3;
- the panel descriptions accurately progress from blank to silhouette to detailed hero to simulator;
- the captured atlas has four equal 1440×900 panels and later panels contain the intended authentic MakeCode states;
- inline and enlarged rendering crop exactly one selected panel;
- lesson 02 renders without clipping on supported viewports;
- the full local authoring, asset-safety, application, build, and E2E suites remain green.

Success means a child can compare their work with a real, progressively completed example at every drawing step while the repository retains 24 lessons, 145 stable steps, 93 SVGs, and six editor WebPs.
