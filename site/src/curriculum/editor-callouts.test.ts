import { expect, it } from 'vitest';
import { lessons } from './index';

// Pixel bounds measured on the committed 1440×900 editor captures. These
// regressions prevent a callout from swallowing adjacent controls. Re-measure
// against the screenshot whenever the official editor captures are refreshed.
it.each([
  ['lesson-01-step-03', 'Sprites category', 352, 104, 201, 41],
  ['lesson-01-step-05', 'Stop button', 40, 480, 38, 39],
  ['lesson-02-step-03', 'Image Width field', 31, 842, 40, 30],
  ['lesson-02-step-05', 'finished hero detail area', 604, 269, 318, 344],
  ['lesson-02-step-06', 'running hero in the simulator', 150, 175, 60, 66],
  ['lesson-13-step-03', 'Duplicate Current Frame', 1309, 491, 48, 33],
  ['lesson-14-step-02', 'tilemap width field', 31, 842, 40, 30],
  ['lesson-24-step-06', 'Python Save control in logical panel 2', 551, 841, 44, 44],
] as const)('%s matches the captured %s target', (id, _target, x, y, width, height) => {
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

it('C04-006: lesson 16 highlights the completed starter map rather than only its width field', () => {
  const visual = lessons.find(({ id }) => id === 'lesson-16')!.steps[0]!.visual;
  if (visual.kind !== 'editor') throw new Error('Expected completed-map editor capture');
  expect(visual.focus.width).toBeGreaterThan(0.5);
  expect(visual.focus.height).toBeGreaterThan(0.2);
  expect(visual.alt).toMatch(/30×8.*три платформи/);
});

it.each(['lesson-14', 'lesson-16'])('C04-006: %s map outline matches the captured 30×8 canvas including both boundaries', (id) => {
  const visual = lessons.find(lesson => lesson.id === id)!.steps[0]!.visual;
  if (visual.kind !== 'editor') throw new Error('Expected map editor');
  expect(visual.focus.x * 1440).toBeCloseTo(185, 0);
  expect(visual.focus.y * 900).toBeCloseTo(310, 0);
  expect(visual.focus.width * 1440).toBeCloseTo(1230, 0);
  expect(visual.focus.height * 900).toBeCloseTo(328, 0);
});
