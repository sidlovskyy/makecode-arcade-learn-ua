import type { Campaign, Lesson } from './types';
import { lessonVisualAssets } from '../lesson-visuals/generated-assets';
import { validateLessonVisual } from '../lesson-visuals/validate';

const OFFICIAL_MAKECODE_ORIGIN = 'https://arcade.makecode.com';

interface LessonEntry {
  lesson: Lesson;
}

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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
  const stepIds = new Set<string>();

  if (!Array.isArray(campaigns)) {
    return ['curriculum must be an array'];
  }

  for (let campaignIndex = 0; campaignIndex < campaigns.length; campaignIndex += 1) {
    const campaignValue = campaigns[campaignIndex];
    if (!isRecord(campaignValue)) {
      errors.push(`campaign ${campaignIndex} must be an object`);
      continue;
    }

    const lessonsValue = campaignValue.lessons;
    if (!Array.isArray(lessonsValue)) {
      continue;
    }

    for (let lessonIndex = 0; lessonIndex < lessonsValue.length; lessonIndex += 1) {
      const lessonValue = lessonsValue[lessonIndex];
      if (!isRecord(lessonValue)) {
        errors.push(`campaign ${campaignIndex} lesson ${lessonIndex} must be an object`);
        continue;
      }

      const lesson = lessonValue as unknown as Lesson;
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

    const steps = Array.isArray(lesson.steps) ? lesson.steps : [];
    for (const [stepIndex, step] of steps.entries()) {
      if (!isRecord(step)) {
        errors.push(`${lessonId} step ${stepIndex} must be an object`);
        continue;
      }
      if (stepIds.has(step.id)) {
        errors.push(`duplicate step id: ${step.id}`);
      } else {
        stepIds.add(step.id);
      }
      errors.push(...validateLessonVisual(step.id, step.visual, lessonVisualAssets));
    }
  }

  return errors;
}
