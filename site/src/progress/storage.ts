import {
  createDefaultProgress,
  PROGRESS_KEY,
  PROGRESS_VERSION,
  type LessonProgress,
  type ProgressState,
} from './schema';

export { PROGRESS_KEY } from './schema';

export interface ProgressLoadResult {
  progress: ProgressState;
  available: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isLessonProgress(value: unknown): value is LessonProgress {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Array.isArray(value.completedStepIds) &&
    value.completedStepIds.every((stepId) => typeof stepId === 'string') &&
    typeof value.quizPassed === 'boolean' &&
    typeof value.completed === 'boolean'
  );
}

function isProgressState(value: unknown): value is ProgressState {
  if (!isRecord(value)) {
    return false;
  }

  if (
    value.version !== PROGRESS_VERSION ||
    !isRecord(value.lessons) ||
    typeof value.totalXp !== 'number' ||
    !Number.isFinite(value.totalXp) ||
    value.totalXp < 0
  ) {
    return false;
  }

  if (
    value.lastLessonSlug !== undefined &&
    typeof value.lastLessonSlug !== 'string'
  ) {
    return false;
  }

  return Object.values(value.lessons).every(isLessonProgress);
}

export function loadProgress(storage: Storage): ProgressLoadResult {
  let serialized: string | null;

  try {
    serialized = storage.getItem(PROGRESS_KEY);
  } catch {
    return {
      progress: createDefaultProgress(),
      available: false,
    };
  }

  if (serialized === null) {
    return {
      progress: createDefaultProgress(),
      available: true,
    };
  }

  try {
    const parsed: unknown = JSON.parse(serialized);

    return {
      progress: isProgressState(parsed) ? parsed : createDefaultProgress(),
      available: true,
    };
  } catch {
    return {
      progress: createDefaultProgress(),
      available: true,
    };
  }
}

export function saveProgress(
  storage: Storage,
  progress: ProgressState,
): boolean {
  try {
    storage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}
