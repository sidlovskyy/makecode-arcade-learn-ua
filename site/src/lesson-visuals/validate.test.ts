import { describe, expect, it } from 'vitest';
import type { LessonStepVisual } from './types';
import { validateLessonVisual } from './validate';

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

const comparisonVisual = {
  kind: 'comparison',
  explanation: 'Блок і код Python виконують ту саму дію.',
  blocks: {
    assetId: 'blocks:lesson-01-step-04',
    alt: 'Блок on start зі зміною кольору тла.',
    focus: { x: 0.08, y: 0.42, width: 0.84, height: 0.38, label: 'Блок' },
  },
  python: {
    label: 'Python',
    code: 'scene.set_background_color(7)',
  },
} satisfies LessonStepVisual;

const validVisuals: LessonStepVisual[] = [
  blockVisual,
  {
    kind: 'editor',
    assetId: 'editor:blocks-workspace',
    alt: 'Робоча область редактора блоків.',
    explanation: 'Тут учень складає програму з блоків.',
    focus: { x: 0.1, y: 0.1, width: 0.8, height: 0.8, label: 'Робоча область' },
  },
  {
    kind: 'python',
    label: 'Python',
    code: 'scene.set_background_color(7)',
    explanation: 'Цей рядок задає колір тла.',
  },
  comparisonVisual,
  {
    kind: 'guide',
    title: 'Як додати блок',
    items: ['Відкрий категорію Scene.', 'Перетягни блок до on start.'],
  },
];

const blankRequiredStringCases = [
  {
    field: 'asset ID',
    visual: { ...blockVisual, assetId: '   ' },
    diagnostic: 'lesson-01-step-04 assetId is required',
  },
  {
    field: 'focus label',
    visual: { ...blockVisual, focus: { ...blockVisual.focus, label: '\t' } },
    diagnostic: 'lesson-01-step-04 focus.label is required',
  },
  {
    field: 'Python label',
    visual: {
      kind: 'python',
      label: ' ',
      code: 'scene.set_background_color(7)',
      explanation: 'Цей рядок задає колір тла.',
    },
    diagnostic: 'lesson-01-step-04 label is required',
  },
  {
    field: 'Python explanation',
    visual: {
      kind: 'python',
      label: 'Python',
      code: 'scene.set_background_color(7)',
      explanation: '\n',
    },
    diagnostic: 'lesson-01-step-04 explanation is required',
  },
  {
    field: 'comparison explanation',
    visual: {
      ...comparisonVisual,
      explanation: ' ',
    },
    diagnostic: 'lesson-01-step-04 explanation is required',
  },
  {
    field: 'comparison block alt text',
    visual: {
      ...comparisonVisual,
      blocks: { ...comparisonVisual.blocks, alt: '\t' },
    },
    diagnostic: 'lesson-01-step-04 blocks.alt is required',
  },
  {
    field: 'comparison Python label',
    visual: {
      ...comparisonVisual,
      python: { ...comparisonVisual.python, label: ' ' },
    },
    diagnostic: 'lesson-01-step-04 python.label is required',
  },
  {
    field: 'comparison Python code',
    visual: {
      ...comparisonVisual,
      python: { ...comparisonVisual.python, code: '\n' },
    },
    diagnostic: 'lesson-01-step-04 python.code is required',
  },
  {
    field: 'guide title',
    visual: { kind: 'guide', title: '  ', items: ['Відкрий категорію Scene.'] },
    diagnostic: 'lesson-01-step-04 guide title is required',
  },
  {
    field: 'guide item',
    visual: { kind: 'guide', title: 'Як додати блок', items: ['\t'] },
    diagnostic: 'lesson-01-step-04 guide item 1 is required',
  },
] satisfies Array<{ field: string; visual: LessonStepVisual; diagnostic: string }>;

describe('validateLessonVisual', () => {
  it.each(validVisuals)('accepts a valid $kind descriptor', (visual) => {
    expect(validateLessonVisual('lesson-01-step-04', visual, assets)).toEqual([]);
  });

  it('rejects blank Ukrainian alt text', () => {
    const visual = { ...blockVisual, alt: '   ' };

    expect(validateLessonVisual('lesson-01-step-04', visual, assets)).toContain(
      'lesson-01-step-04 alt is required',
    );
  });

  it('rejects a blank explanation', () => {
    const visual = { ...blockVisual, explanation: '\t' };

    expect(validateLessonVisual('lesson-01-step-04', visual, assets)).toContain(
      'lesson-01-step-04 explanation is required',
    );
  });

  it('rejects an unknown top-level asset ID', () => {
    const visual = { ...blockVisual, assetId: 'blocks:missing' };

    expect(validateLessonVisual('lesson-01-step-04', visual, assets)).toContain(
      'lesson-01-step-04 assetId "blocks:missing" is not registered',
    );
  });

  it('rejects a top-level asset-kind mismatch', () => {
    const visual: LessonStepVisual = {
      ...blockVisual,
      assetId: 'editor:blocks-workspace',
    };

    expect(validateLessonVisual('lesson-01-step-04', visual, assets)).toContain(
      'lesson-01-step-04 assetId "editor:blocks-workspace" must reference a blocks asset',
    );
  });

  it('resolves comparison asset IDs and rejects a kind mismatch', () => {
    const comparison: LessonStepVisual = {
      kind: 'comparison',
      explanation: 'Блок і код Python виконують ту саму дію.',
      blocks: {
        assetId: 'editor:blocks-workspace',
        alt: 'Блок on start зі зміною кольору тла.',
        focus: { x: 0.08, y: 0.42, width: 0.84, height: 0.38, label: 'Блок' },
      },
      python: { label: 'Python', code: 'scene.set_background_color(7)' },
    };

    expect(validateLessonVisual('lesson-01-step-04', comparison, assets)).toContain(
      'lesson-01-step-04 blocks.assetId "editor:blocks-workspace" must reference a blocks asset',
    );
  });

  it('rejects empty Python code', () => {
    const visual: LessonStepVisual = {
      kind: 'python',
      label: 'Python',
      code: '\n ',
      explanation: 'Цей рядок задає колір тла.',
    };

    expect(validateLessonVisual('lesson-01-step-04', visual, assets)).toContain(
      'lesson-01-step-04 code is required',
    );
  });

  it('rejects an empty guide item list', () => {
    const visual: LessonStepVisual = {
      kind: 'guide',
      title: 'Як додати блок',
      items: [],
    } as unknown as LessonStepVisual;

    expect(validateLessonVisual('lesson-01-step-04', visual, assets)).toContain(
      'lesson-01-step-04 guide items must not be empty',
    );
  });

  it.each(blankRequiredStringCases)(
    'rejects a blank required $field',
    ({ visual, diagnostic }) => {
      expect(validateLessonVisual('lesson-01-step-04', visual, assets)).toContain(diagnostic);
    },
  );

  it.each([
    ['x below zero', { x: -0.01, y: 0.1, width: 0.5, height: 0.5 }],
    ['x above one', { x: 1.01, y: 0.1, width: 0, height: 0.5 }],
    ['y below zero', { x: 0.1, y: -0.01, width: 0.5, height: 0.5 }],
    ['y above one', { x: 0.1, y: 1.01, width: 0.5, height: 0 }],
    ['width below zero', { x: 0.1, y: 0.1, width: -0.01, height: 0.5 }],
    ['width above one', { x: 0, y: 0.1, width: 1.01, height: 0.5 }],
    ['height below zero', { x: 0.1, y: 0.1, width: 0.5, height: -0.01 }],
    ['height above one', { x: 0.1, y: 0, width: 0.5, height: 1.01 }],
    ['right edge beyond one', { x: 0.6, y: 0.1, width: 0.5, height: 0.5 }],
    ['bottom edge beyond one', { x: 0.1, y: 0.6, width: 0.5, height: 0.5 }],
  ])('rejects a focus rectangle with %s', (_case, focus) => {
    const visual: LessonStepVisual = {
      ...blockVisual,
      focus: { ...focus, label: 'Додай зараз' },
    };

    expect(validateLessonVisual('lesson-01-step-04', visual, assets)).toContain(
      'lesson-01-step-04 focus must fit within normalized coordinates 0..1',
    );
  });
});
