import { beforeEach, describe, expect, it } from 'vitest';
import {
  completeLesson,
  completeStep,
  createDefaultProgress,
  passQuiz,
  setLastLesson,
  type ProgressState,
} from './schema';
import { loadProgress, PROGRESS_KEY, saveProgress } from './storage';

const CLEAN_PROGRESS: ProgressState = {
  version: 1,
  lessons: {},
  totalXp: 0,
};

const STORED_PROGRESS: ProgressState = {
  version: 1,
  lessons: {
    'lesson-01': {
      completedStepIds: ['open-editor', 'create-sprite'],
      quizPassed: true,
      completed: true,
    },
    'future-lesson': {
      completedStepIds: ['future-step'],
      quizPassed: false,
      completed: false,
    },
  },
  totalXp: 125,
  lastLessonSlug: 'mii-pershyi-sprait',
};

beforeEach(() => {
  localStorage.clear();
});

describe('progress updates', () => {
  it('creates independent clean progress states', () => {
    const first = createDefaultProgress();
    const second = createDefaultProgress();

    expect(first).toEqual(CLEAN_PROGRESS);
    expect(second).toEqual(CLEAN_PROGRESS);
    expect(first).not.toBe(second);
    expect(first.lessons).not.toBe(second.lessons);
  });

  it('completes a step once without mutating or dropping other lessons', () => {
    const original = structuredClone(STORED_PROGRESS);
    const first = completeStep(original, 'lesson-02', 'draw-hero');
    const repeated = completeStep(first, 'lesson-02', 'draw-hero');

    expect(first.lessons['lesson-02']).toEqual({
      completedStepIds: ['draw-hero'],
      quizPassed: false,
      completed: false,
    });
    expect(repeated.lessons['lesson-02']?.completedStepIds).toEqual(['draw-hero']);
    expect(repeated.lessons['future-lesson']).toEqual(
      STORED_PROGRESS.lessons['future-lesson'],
    );
    expect(original).toEqual(STORED_PROGRESS);
    expect(first).not.toBe(original);
    expect(repeated).not.toBe(first);
  });

  it('passes a quiz idempotently and preserves completed steps', () => {
    const withStep = completeStep(CLEAN_PROGRESS, 'lesson-02', 'draw-hero');
    const first = passQuiz(withStep, 'lesson-02');
    const repeated = passQuiz(first, 'lesson-02');

    expect(first.lessons['lesson-02']).toEqual({
      completedStepIds: ['draw-hero'],
      quizPassed: true,
      completed: false,
    });
    expect(repeated.lessons['lesson-02']).toEqual(first.lessons['lesson-02']);
    expect(withStep.lessons['lesson-02']?.quizPassed).toBe(false);
    expect(repeated).not.toBe(first);
  });

  it('completes a lesson and awards its XP only once', () => {
    const started: ProgressState = {
      version: 1,
      lessons: {
        'lesson-02': {
          completedStepIds: ['draw-hero'],
          quizPassed: true,
          completed: false,
        },
      },
      totalXp: 25,
    };

    const completed = completeLesson(started, 'lesson-02', 100);
    const repeated = completeLesson(completed, 'lesson-02', 100);

    expect(completed.lessons['lesson-02']).toEqual({
      completedStepIds: ['draw-hero'],
      quizPassed: true,
      completed: true,
    });
    expect(completed.totalXp).toBe(125);
    expect(repeated.totalXp).toBe(125);
    expect(repeated.lessons['lesson-02']?.completed).toBe(true);
    expect(started.lessons['lesson-02']?.completed).toBe(false);
    expect(started.totalXp).toBe(25);
    expect(repeated).not.toBe(completed);
  });

  it('sets the last lesson without changing progress data', () => {
    const next = setLastLesson(STORED_PROGRESS, 'heroi-pid-kontrolem');

    expect(next.lastLessonSlug).toBe('heroi-pid-kontrolem');
    expect(next.lessons).toEqual(STORED_PROGRESS.lessons);
    expect(next.totalXp).toBe(125);
    expect(next).not.toBe(STORED_PROGRESS);
  });
});

describe('progress storage', () => {
  it('returns a clean state when storage is empty', () => {
    expect(loadProgress(localStorage)).toEqual({
      progress: CLEAN_PROGRESS,
      available: true,
    });
  });

  it('round-trips valid progress including unknown lesson entries', () => {
    expect(saveProgress(localStorage, STORED_PROGRESS)).toBe(true);
    expect(loadProgress(localStorage)).toEqual({
      progress: STORED_PROGRESS,
      available: true,
    });
  });

  it('returns a clean state when stored JSON is corrupt', () => {
    localStorage.setItem(PROGRESS_KEY, '{broken');

    expect(loadProgress(localStorage)).toEqual({
      progress: CLEAN_PROGRESS,
      available: true,
    });
  });

  it('ignores progress from an unsupported schema version', () => {
    localStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify({ ...STORED_PROGRESS, version: 2 }),
    );

    expect(loadProgress(localStorage)).toEqual({
      progress: CLEAN_PROGRESS,
      available: true,
    });
  });

  it.each([
    ['a null root', 'null'],
    ['an array root', '[]'],
    ['a missing lessons record', '{"version":1,"totalXp":0}'],
    ['an array of lessons', '{"version":1,"lessons":[],"totalXp":0}'],
    ['a string XP value', '{"version":1,"lessons":{},"totalXp":"100"}'],
    ['a negative XP value', '{"version":1,"lessons":{},"totalXp":-1}'],
    [
      'an invalid lesson entry',
      '{"version":1,"lessons":{"lesson-01":null},"totalXp":0}',
    ],
    [
      'a non-string completed step',
      '{"version":1,"lessons":{"lesson-01":{"completedStepIds":[1],"quizPassed":false,"completed":false}},"totalXp":0}',
    ],
    [
      'a non-boolean quiz flag',
      '{"version":1,"lessons":{"lesson-01":{"completedStepIds":[],"quizPassed":"yes","completed":false}},"totalXp":0}',
    ],
    [
      'a non-boolean completion flag',
      '{"version":1,"lessons":{"lesson-01":{"completedStepIds":[],"quizPassed":false,"completed":1}},"totalXp":0}',
    ],
    [
      'a non-string last lesson slug',
      '{"version":1,"lessons":{},"totalXp":0,"lastLessonSlug":7}',
    ],
  ])('ignores stored progress with %s', (_caseName, serialized) => {
    localStorage.setItem(PROGRESS_KEY, serialized);

    expect(loadProgress(localStorage)).toEqual({
      progress: CLEAN_PROGRESS,
      available: true,
    });
  });

  it('reports unavailable storage when reading throws', () => {
    const blocked = {
      getItem: () => {
        throw new Error('blocked');
      },
    } as unknown as Storage;

    expect(loadProgress(blocked)).toEqual({
      progress: CLEAN_PROGRESS,
      available: false,
    });
  });

  it('returns false instead of throwing when writing fails', () => {
    const blocked = {
      setItem: () => {
        throw new Error('blocked');
      },
    } as unknown as Storage;

    expect(saveProgress(blocked, STORED_PROGRESS)).toBe(false);
  });
});
