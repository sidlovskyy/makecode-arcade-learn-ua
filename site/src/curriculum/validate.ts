import type { Campaign, Lesson } from './types';

const OFFICIAL_MAKECODE_ORIGIN = 'https://arcade.makecode.com';

interface LessonEntry {
  lesson: Lesson;
}

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isOfficialMakeCodeUrl(value: unknown): value is string {
  if (!hasText(value)) {
    return false;
  }

  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      url.origin === OFFICIAL_MAKECODE_ORIGIN &&
      url.hostname === 'arcade.makecode.com' &&
      url.pathname.startsWith('/') &&
      url.username === '' &&
      url.password === ''
    );
  } catch {
    return false;
  }
}

export function validateCurriculum(campaigns: Campaign[]): string[] {
  const errors: string[] = [];
  const entries: LessonEntry[] = [];
  const lessonIds = new Set<string>();
  const lessonSlugs = new Set<string>();

  for (const campaign of campaigns) {
    const campaignLessons = Array.isArray(campaign?.lessons) ? campaign.lessons : [];

    for (const lesson of campaignLessons) {
      entries.push({ lesson });

      if (lessonIds.has(lesson.id)) {
        errors.push(`duplicate lesson id: ${lesson.id}`);
      } else {
        lessonIds.add(lesson.id);
      }

      if (lessonSlugs.has(lesson.slug)) {
        errors.push(`duplicate lesson slug: ${lesson.slug}`);
      } else {
        lessonSlugs.add(lesson.slug);
      }
    }
  }

  for (const { lesson } of entries) {
    const lessonId = lesson.id;

    if (!Array.isArray(lesson.steps) || lesson.steps.length < 5 || lesson.steps.length > 8) {
      errors.push(`${lessonId} must have 5–8 steps`);
    }

    if (!hasText(lesson.challenge?.title) || !hasText(lesson.challenge?.prompt)) {
      errors.push(`${lessonId} challenge title and prompt are required`);
    }

    const quizOptions = Array.isArray(lesson.quiz?.options) ? lesson.quiz.options : [];
    if (quizOptions.length !== 3) {
      errors.push(`${lessonId} quiz must have exactly 3 options`);
    }

    if (
      !Number.isInteger(lesson.quiz?.correctIndex) ||
      lesson.quiz.correctIndex < 0 ||
      lesson.quiz.correctIndex >= quizOptions.length
    ) {
      errors.push(`${lessonId} quiz correctIndex must point to an existing option`);
    }

    if (!hasText(lesson.quiz?.explanation)) {
      errors.push(`${lessonId} quiz explanation is required`);
    }

    if (!isOfficialMakeCodeUrl(lesson.makeCodeUrl)) {
      errors.push(`${lessonId} must use an official MakeCode Arcade URL`);
    }

    const prerequisites = Array.isArray(lesson.prerequisites) ? lesson.prerequisites : [];
    for (const prerequisite of prerequisites) {
      if (!lessonIds.has(prerequisite)) {
        errors.push(`${lessonId} has unknown prerequisite: ${prerequisite}`);
      }
    }
  }

  return errors;
}
