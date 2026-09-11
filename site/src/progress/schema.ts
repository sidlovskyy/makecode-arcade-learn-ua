export const PROGRESS_VERSION = 1 as const;
export const PROGRESS_KEY = 'kodkvest.progress.v1';

export interface LessonProgress {
  completedStepIds: string[];
  quizPassed: boolean;
  completed: boolean;
}

export interface ProgressState {
  version: typeof PROGRESS_VERSION;
  lessons: Record<string, LessonProgress>;
  totalXp: number;
  lastLessonSlug?: string;
}

export const createDefaultProgress = (): ProgressState => ({
  version: PROGRESS_VERSION,
  lessons: {},
  totalXp: 0,
});

const createLessonProgress = (): LessonProgress => ({
  completedStepIds: [],
  quizPassed: false,
  completed: false,
});

function getLessonProgress(
  progress: ProgressState,
  lessonId: string,
): LessonProgress {
  return progress.lessons[lessonId] ?? createLessonProgress();
}

export function completeStep(
  progress: ProgressState,
  lessonId: string,
  stepId: string,
): ProgressState {
  const lesson = getLessonProgress(progress, lessonId);
  const completedStepIds = lesson.completedStepIds.includes(stepId)
    ? [...lesson.completedStepIds]
    : [...lesson.completedStepIds, stepId];

  return {
    ...progress,
    lessons: {
      ...progress.lessons,
      [lessonId]: {
        ...lesson,
        completedStepIds,
      },
    },
  };
}

export function passQuiz(
  progress: ProgressState,
  lessonId: string,
): ProgressState {
  const lesson = getLessonProgress(progress, lessonId);

  return {
    ...progress,
    lessons: {
      ...progress.lessons,
      [lessonId]: {
        ...lesson,
        completedStepIds: [...lesson.completedStepIds],
        quizPassed: true,
      },
    },
  };
}

export function completeLesson(
  progress: ProgressState,
  lessonId: string,
  xp: number,
): ProgressState {
  const lesson = getLessonProgress(progress, lessonId);

  return {
    ...progress,
    lessons: {
      ...progress.lessons,
      [lessonId]: {
        ...lesson,
        completedStepIds: [...lesson.completedStepIds],
        completed: true,
      },
    },
    totalXp: progress.totalXp + (lesson.completed ? 0 : xp),
  };
}

export function setLastLesson(
  progress: ProgressState,
  slug: string,
): ProgressState {
  return {
    ...progress,
    lastLessonSlug: slug,
  };
}
