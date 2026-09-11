import { describe, expect, it } from 'vitest';
import { curriculum, lessons, lessonBySlug } from './index';
import { campaign01 } from './campaign-01';
import { campaign02 } from './campaign-02';
import { campaign03 } from './campaign-03';
import { campaign04 } from './campaign-04';
import { campaign05 } from './campaign-05';
import { campaign06 } from './campaign-06';
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

const expectedCampaignIdentities = [
  ['campaign-01', 1, 'Новачок'],
  ['campaign-02', 2, 'Дослідник'],
  ['campaign-03', 3, 'Розробник ігор'],
  ['campaign-04', 4, 'Архітектор світів'],
  ['campaign-05', 5, 'Геймдизайнер'],
  ['campaign-06', 6, 'Майстер коду'],
];

const expectedLessonIdentities = [
  ['lesson-01', 'znaiomstvo-z-arcade', 'Знайомство з Arcade'],
  ['lesson-02', 'mii-pershyi-sprait', 'Мій перший спрайт'],
  ['lesson-03', 'heroi-pid-kontrolem', 'Герой під контролем'],
  ['lesson-04', 'pikselni-perehony', 'Піксельні перегони'],
  ['lesson-05', 'knopky-i-podii', 'Кнопки й події'],
  ['lesson-06', 'koly-spraity-zustrichaiutsia', 'Коли спрайти зустрічаються'],
  ['lesson-07', 'rakhunok-zhyttia-chas', 'Рахунок, життя, час'],
  ['lesson-08', 'lovy-zirky', 'Лови зірки'],
  ['lesson-09', 'snariady-i-nebezpeky', 'Снаряди й небезпеки'],
  ['lesson-10', 'rishennia-hry', 'Рішення гри'],
  ['lesson-11', 'hra-ne-zupyniaietsia', 'Гра не зупиняється'],
  ['lesson-12', 'kosmichnyi-zakhysnyk', 'Космічний захисник'],
  ['lesson-13', 'zhyvi-personazhi', 'Живі персонажі'],
  ['lesson-14', 'buduiemo-kartu', 'Будуємо карту'],
  ['lesson-15', 'meshkantsi-svitu', 'Мешканці світу'],
  ['lesson-16', 'zahublenyi-krystal', 'Загублений кристал'],
  ['lesson-17', 'rivni-ta-skladnist', 'Рівні та складність'],
  ['lesson-18', 'rozumni-suprotyvnyky', 'Розумні супротивники'],
  ['lesson-19', 'vid-prototypu-do-hry', 'Від прототипу до гри'],
  ['lesson-20', 'arena-bosiv', 'Арена босів'],
  ['lesson-21', 'vid-blokiv-do-python', 'Від блоків до Python'],
  ['lesson-22', 'python-u-hri', 'Python у грі'],
  ['lesson-23', 'hrafika-maistra', 'Графіка майстра'],
  ['lesson-24', 'moia-vlasna-hra', 'Моя власна гра'],
];

const expectedCampaignLessonIds = [
  ['lesson-01', 'lesson-02', 'lesson-03', 'lesson-04'],
  ['lesson-05', 'lesson-06', 'lesson-07', 'lesson-08'],
  ['lesson-09', 'lesson-10', 'lesson-11', 'lesson-12'],
  ['lesson-13', 'lesson-14', 'lesson-15', 'lesson-16'],
  ['lesson-17', 'lesson-18', 'lesson-19', 'lesson-20'],
  ['lesson-21', 'lesson-22', 'lesson-23', 'lesson-24'],
];

describe('validateCurriculum', () => {
  it('completes the final campaign as Blocks to Python without changing progress IDs', () => {
    expect(campaign06.lessons.map(({ slug, title }) => [slug, title])).toEqual([
      ['vid-blokiv-do-python', 'Від блоків до Python'],
      ['python-u-hri', 'Python у грі'],
      ['hrafika-maistra', 'Графіка майстра'],
      ['moia-vlasna-hra', 'Моя власна гра'],
    ]);
    expect(JSON.stringify(campaign06)).not.toMatch(/JavaScript|TypeScript/);
    const counts = { blocks: 0, editor: 0, guide: 0, python: 0, comparison: 0 };
    for (const lesson of campaign06.lessons) {
      expect(lesson.steps.map(({ id }) => id)).toEqual(Array.from({ length: lesson.id === 'lesson-24' ? 7 : 6 }, (_, i) => `${lesson.id}-step-0${i + 1}`));
      for (const step of lesson.steps) if (step.visual) counts[step.visual.kind] += 1;
    }
    expect(counts).toEqual({ blocks: 1, editor: 1, guide: 5, python: 13, comparison: 5 });
    expect(campaign06.lessons.map(lesson => lesson.steps.map(step => step.visual?.kind))).toEqual([
      ['blocks', 'comparison', 'comparison', 'python', 'comparison', 'comparison'],
      ['python', 'python', 'python', 'python', 'python', 'python'],
      ['python', 'python', 'python', 'python', 'comparison', 'python'],
      ['guide', 'guide', 'python', 'guide', 'guide', 'editor', 'guide'],
    ]);
    expect(lessons.flatMap(lesson => lesson.steps).filter(step => step.visual)).toHaveLength(145);
  });

  it.each([
    ['vid-blokiv-do-kodu', 'vid-blokiv-do-python', 'lesson-21'],
    ['typescript-u-hri', 'python-u-hri', 'lesson-22'],
  ])('resolves legacy %s to the canonical lesson object', (legacy, canonical, id) => {
    expect(lessonBySlug.get(legacy)?.id).toBe(id);
    expect(lessonBySlug.get(legacy)?.slug).toBe(canonical);
    expect(lessonBySlug.get(legacy)).toBe(lessonBySlug.get(canonical));
  });

  it('gives every game-designer step the approved twenty blocks and four play-test guides', () => {
    const steps = campaign05.lessons.flatMap((lesson) => lesson.steps);
    expect(steps).toHaveLength(24);
    const counts = { blocks: 0, editor: 0, guide: 0, python: 0, comparison: 0 };
    for (const step of steps) if (step.visual) counts[step.visual.kind] += 1;
    expect(counts).toEqual({ blocks: 20, editor: 0, guide: 4, python: 0, comparison: 0 });
    expect(steps.filter((step) => step.visual?.kind === 'guide').map((step) => step.id)).toEqual([
      'lesson-18-step-04', 'lesson-19-step-05', 'lesson-19-step-06', 'lesson-20-step-06',
    ]);
    expect(steps.filter((step) => step.visual?.kind === 'blocks').map((step) => step.id)).toEqual([
      'lesson-17-step-01', 'lesson-17-step-02', 'lesson-17-step-03', 'lesson-17-step-04', 'lesson-17-step-05', 'lesson-17-step-06',
      'lesson-18-step-01', 'lesson-18-step-02', 'lesson-18-step-03', 'lesson-18-step-05', 'lesson-18-step-06',
      'lesson-19-step-01', 'lesson-19-step-02', 'lesson-19-step-03', 'lesson-19-step-04',
      'lesson-20-step-01', 'lesson-20-step-02', 'lesson-20-step-03', 'lesson-20-step-04', 'lesson-20-step-05',
    ]);
  });

  it('gives every world-builder step the approved block, editor and guide coverage', () => {
    const steps = campaign04.lessons.flatMap((lesson) => lesson.steps);
    expect(steps).toHaveLength(24);
    expect(steps.filter((step) => !step.visual).map((step) => step.id)).toEqual([]);
    const counts = { blocks: 0, editor: 0, guide: 0, python: 0, comparison: 0 };
    for (const step of steps) if (step.visual) counts[step.visual.kind] += 1;
    expect(counts).toEqual({ blocks: 17, editor: 6, guide: 1, python: 0, comparison: 0 });
    expect(steps.filter((step) => step.visual?.kind === 'editor').map((step) => [step.id, step.visual?.kind === 'editor' && step.visual.assetId])).toEqual([
      ['lesson-13-step-02', 'editor:animation-extension'],
      ['lesson-13-step-03', 'editor:animation-frames'],
      ['lesson-14-step-01', 'editor:tilemap-editor'],
      ['lesson-14-step-02', 'editor:tilemap-editor'],
      ['lesson-14-step-03', 'editor:tilemap-editor'],
      ['lesson-16-step-01', 'editor:tilemap-editor'],
    ]);
    expect(steps.filter((step) => step.visual?.kind === 'guide').map((step) => step.id)).toEqual(['lesson-14-step-06']);
  });

  it('gives every game-developer step a visual with the approved campaign kind coverage', () => {
    const steps = campaign03.lessons.flatMap((lesson) => lesson.steps);
    expect(steps).toHaveLength(24);
    expect(steps.filter((step) => !step.visual).map((step) => step.id)).toEqual([]);
    const counts = { blocks: 0, editor: 0, guide: 0, python: 0, comparison: 0 };
    for (const step of steps) {
      if (step.visual) counts[step.visual.kind] += 1;
    }
    expect(counts).toEqual({ blocks: 20, editor: 0, guide: 4, python: 0, comparison: 0 });
    expect(steps.filter((step) => step.visual?.kind === 'guide').map((step) => step.id)).toEqual([
      'lesson-09-step-06', 'lesson-10-step-06', 'lesson-11-step-05', 'lesson-12-step-06',
    ]);
  });

  it('gives every explorer step a visual with the approved campaign kind coverage', () => {
    const steps = campaign02.lessons.flatMap((lesson) => lesson.steps);
    expect(steps).toHaveLength(24);
    expect(steps.filter((step) => !step.visual).map((step) => step.id)).toEqual([]);
    const counts = { blocks: 0, editor: 0, guide: 0, python: 0, comparison: 0 };
    for (const step of steps) {
      if (step.visual) counts[step.visual.kind] += 1;
    }
    expect(counts).toEqual({ blocks: 20, editor: 0, guide: 4, python: 0, comparison: 0 });
    expect(steps.filter((step) => step.visual?.kind === 'guide').map((step) => step.id)).toEqual([
      'lesson-05-step-05', 'lesson-06-step-06', 'lesson-07-step-06', 'lesson-08-step-06',
    ]);
  });

  it('gives every beginner step a visual with the approved campaign kind coverage', () => {
    const steps = campaign01.lessons.flatMap((lesson) => lesson.steps);
    expect(steps).toHaveLength(24);
    expect(steps.filter((step) => !step.visual).map((step) => step.id)).toEqual([]);
    const counts = { blocks: 0, editor: 0, guide: 0, python: 0, comparison: 0 };
    for (const step of steps) {
      if (step.visual) counts[step.visual.kind] += 1;
    }
    expect(counts).toEqual({ blocks: 10, editor: 11, guide: 3, python: 0, comparison: 0 });
  });

  it('contains six valid campaigns and twenty-four ordered lessons', () => {
    expect(curriculum).toHaveLength(6);
    expect(lessons).toHaveLength(24);
    expect(lessons.map((lesson) => lesson.order)).toEqual(
      Array.from({ length: 24 }, (_, index) => index + 1),
    );
    expect(curriculum.map(({ id, order, title }) => [id, order, title])).toEqual(
      expectedCampaignIdentities,
    );
    expect(lessons.map(({ id, slug, title }) => [id, slug, title])).toEqual(
      expectedLessonIdentities,
    );
    expect(curriculum.map((campaign) => campaign.lessons.map((lesson) => lesson.id))).toEqual(
      expectedCampaignLessonIds,
    );
    expect(lessons.map((lesson) => lesson.prerequisites)).toEqual([
      [],
      ...expectedLessonIdentities.slice(0, -1).map(([id]) => [id]),
    ]);
    expect(
      lessons.every((lesson) => lesson.steps.some((step) => Boolean(step.hint?.trim()))),
    ).toBe(true);
    expect(validateCurriculum(curriculum)).toEqual([]);
  });

  it('returns a deterministic error for a non-array outer input', () => {
    const malformed = 'not-a-curriculum' as unknown as Campaign[];

    expect(validateCurriculum(malformed)).toEqual(['curriculum must be an array']);
  });

  it('returns a deterministic error for a null lesson entry', () => {
    const malformed = structuredClone(validCampaign);
    (malformed.lessons as unknown as Array<Lesson | null>)[1] = null;

    expect(validateCurriculum([malformed])).toContain(
      'campaign 0 lesson 1 must be an object',
    );
  });

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

  it('rejects a negative quiz index', () => {
    const broken = brokenCampaign({
      quiz: {
        question: 'Де запускається гра?',
        options: ['У симуляторі', 'У кошику', 'У пошті'],
        correctIndex: -1,
        explanation: 'Симулятор одразу показує результат програми.',
      },
    });

    expect(validateCurriculum([broken])).toContain(
      'lesson-01 quiz correctIndex must point to an existing option',
    );
  });

  it('rejects a non-integer quiz index', () => {
    const broken = brokenCampaign({
      quiz: {
        question: 'Де запускається гра?',
        options: ['У симуляторі', 'У кошику', 'У пошті'],
        correctIndex: 1.5,
        explanation: 'Симулятор одразу показує результат програми.',
      },
    });

    expect(validateCurriculum([broken])).toContain(
      'lesson-01 quiz correctIndex must point to an existing option',
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
