import { expect, it } from 'vitest';
import { lessons } from './index';

// Pixel bounds measured on the committed 1440×900 editor captures. These
// regressions prevent a callout from swallowing adjacent controls. Re-measure
// against the screenshot whenever the official editor captures are refreshed.
it.each([
  ['lesson-01-step-03', 'Sprites category', 352, 104, 201, 41],
  ['lesson-01-step-05', 'Stop button', 40, 480, 38, 39],
  ['lesson-02-step-03', 'Image Width field', 31, 842, 40, 30],
  ['lesson-02-step-05', 'white color swatch', 69, 328, 29, 30],
  ['lesson-02-step-06', 'Restart button', 77, 479, 40, 41],
  ['lesson-13-step-03', 'Duplicate Current Frame', 1309, 491, 48, 33],
  ['lesson-14-step-02', 'tilemap width field', 31, 842, 40, 30],
  ['lesson-16-step-01', 'tilemap width field', 31, 842, 40, 30],
] as const)('%s highlights only the %s control', (id, _control, x, y, width, height) => {
  const visual = lessons.flatMap((lesson) => lesson.steps).find((step) => step.id === id)!.visual;
  expect(visual.kind).toBe('editor');
  if (visual.kind !== 'editor') throw new Error('Expected an editor visual');
  const focus = visual.focus;
  expect(focus.x * 1440).toBeGreaterThanOrEqual(x - 1);
  expect(focus.y * 900).toBeGreaterThanOrEqual(y - 1);
  expect((focus.x + focus.width) * 1440).toBeLessThanOrEqual(x + width + 1);
  expect((focus.y + focus.height) * 900).toBeLessThanOrEqual(y + height + 1);
  // A tiny rectangle inside the control must not satisfy the single-target check.
  expect(focus.width * 1440).toBeGreaterThan(width * 0.8);
  expect(focus.height * 900).toBeGreaterThan(height * 0.8);
});
