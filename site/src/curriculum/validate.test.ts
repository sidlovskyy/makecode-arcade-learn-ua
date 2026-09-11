import { describe, expect, it } from 'vitest';
import type { Campaign, Lesson, LessonStep } from './types';
import { validateCurriculum } from './validate';

function makeSteps(count = 5): LessonStep[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `step-${index + 1}`,
    title: `Крок ${index + 1}`,
    instruction: 'Виконай дію в редакторі.',
    expected: 'Зміна видима у симуляторі.',
  }));
}

function makeLesson(overrides: Partial<Lesson> = {}): Lesson {
  return {
    id: 'lesson-01',
    slug: 'znaiomstvo-z-arcade',
    order: 1,
    title: 'Знайомство з Arcade',
    summary: 'Відкрий редактор і запусти перший проєкт.',
    durationMinutes: 20,
    difficulty: 'starter',
    concepts: ['редактор', 'симулятор'],
    prerequisites: [],
    objective: 'Навчитися створювати, запускати й зберігати проєкт.',
    steps: makeSteps(),
    challenge: {
      title: 'Самостійний запуск',
      prompt: 'Запусти гру без підказки.',
    },
    quiz: {
      question: 'Де запускається гра?',
      options: ['У симуляторі', 'У кошику', 'У пошті'],
      correctIndex: 0,
      explanation: 'Симулятор одразу показує результат програми.',
    },
    xp: 100,
    makeCodeUrl: 'https://arcade.makecode.com/',
    ...overrides,
  };
}

const validCampaign: Campaign = {
  id: 'novachok',
  order: 1,
  title: 'Новачок',
  description: 'Перші кроки у створенні ігор.',
  color: 'mint',
  reward: 'Перший піксель',
  lessons: [
    makeLesson(),
    makeLesson({
      id: 'lesson-02',
      slug: 'mii-pershyi-sprait',
      order: 2,
      title: 'Мій перший спрайт',
      prerequisites: ['lesson-01'],
    }),
  ],
};

function brokenCampaign(lessonOverrides: Partial<Lesson> = {}): Campaign {
  const broken = structuredClone(validCampaign);
  broken.lessons[0] = makeLesson(lessonOverrides);
  return broken;
}

describe('validateCurriculum', () => {
  it('accepts a complete two-mission curriculum', () => {
    expect(validateCurriculum([validCampaign])).toEqual([]);
  });

  it('rejects a duplicate mission ID', () => {
    const broken = brokenCampaign({ id: 'lesson-02' });
    expect(validateCurriculum([broken])).toContain('duplicate lesson id: lesson-02');
  });

  it('rejects a duplicate mission slug', () => {
    const broken = brokenCampaign({ slug: 'mii-pershyi-sprait' });
    expect(validateCurriculum([broken])).toContain(
      'duplicate lesson slug: mii-pershyi-sprait',
    );
  });

  it('rejects a missing or non-official MakeCode URL', () => {
    const missing = brokenCampaign({ makeCodeUrl: '' as Lesson['makeCodeUrl'] });
    const wrongHost = brokenCampaign({
      makeCodeUrl: 'https://makecode.com/arcade' as Lesson['makeCodeUrl'],
    });
    expect(validateCurriculum([missing])).toContain(
      'lesson-01 must use an official MakeCode Arcade URL',
    );
    expect(validateCurriculum([wrongHost])).toContain(
      'lesson-01 must use an official MakeCode Arcade URL',
    );
  });

  it('requires between five and eight steps', () => {
    expect(validateCurriculum([brokenCampaign({ steps: makeSteps(4) })])).toContain(
      'lesson-01 must have 5–8 steps',
    );
    expect(validateCurriculum([brokenCampaign({ steps: makeSteps(9) })])).toContain(
      'lesson-01 must have 5–8 steps',
    );
  });

  it('requires a complete challenge', () => {
    const broken = brokenCampaign({
      challenge: { title: '', prompt: 'Запусти гру без підказки.' },
    });
    expect(validateCurriculum([broken])).toContain(
      'lesson-01 challenge title and prompt are required',
    );
  });

  it('requires a three-option quiz with a valid index and explanation', () => {
    const twoOptions = brokenCampaign({
      quiz: {
        question: 'Де запускається гра?',
        options: ['У симуляторі', 'У кошику'],
        correctIndex: 0,
        explanation: 'Симулятор одразу показує результат програми.',
      } as Lesson['quiz'],
    });
    const wrongIndex = brokenCampaign({
      quiz: {
        question: 'Де запускається гра?',
        options: ['У симуляторі', 'У кошику', 'У пошті'],
        correctIndex: 3,
        explanation: 'Симулятор одразу показує результат програми.',
      },
    });
    const noExplanation = brokenCampaign({
      quiz: {
        question: 'Де запускається гра?',
        options: ['У симуляторі', 'У кошику', 'У пошті'],
        correctIndex: 0,
        explanation: '   ',
      },
    });
    expect(validateCurriculum([twoOptions])).toContain(
      'lesson-01 quiz must have exactly 3 options',
    );
    expect(validateCurriculum([wrongIndex])).toContain(
      'lesson-01 quiz correctIndex must point to an existing option',
    );
    expect(validateCurriculum([noExplanation])).toContain(
      'lesson-01 quiz explanation is required',
    );
  });

  it('rejects a prerequisite that is not in the curriculum', () => {
    const broken = structuredClone(validCampaign);
    broken.lessons[1]!.prerequisites = ['lesson-unknown'];
    expect(validateCurriculum([broken])).toContain(
      'lesson-02 has unknown prerequisite: lesson-unknown',
    );
  });

  it('reports all independent problems in stable order', () => {
    const broken = brokenCampaign({
      steps: makeSteps(4),
      makeCodeUrl: '' as Lesson['makeCodeUrl'],
      quiz: {
        question: 'Де запускається гра?',
        options: ['У симуляторі', 'У кошику', 'У пошті'],
        correctIndex: 0,
        explanation: '',
      },
    });
    broken.lessons[1]!.prerequisites = ['lesson-unknown'];
    expect(validateCurriculum([broken])).toEqual([
      'lesson-01 must have 5–8 steps',
      'lesson-01 quiz explanation is required',
      'lesson-01 must use an official MakeCode Arcade URL',
      'lesson-02 has unknown prerequisite: lesson-unknown',
    ]);
  });
});
