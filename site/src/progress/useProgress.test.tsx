import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PROGRESS_KEY, type ProgressState } from './schema';
import { useProgress } from './useProgress';

class MemoryStorage implements Storage {
  readonly #values = new Map<string, string>();

  get length(): number {
    return this.#values.size;
  }

  clear(): void {
    this.#values.clear();
  }

  getItem(key: string): string | null {
    return this.#values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.#values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.#values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.#values.set(key, value);
  }
}

function readStoredProgress(storage: Storage): ProgressState {
  const serialized = storage.getItem(PROGRESS_KEY);

  if (serialized === null) {
    throw new Error('Expected persisted progress');
  }

  return JSON.parse(serialized) as ProgressState;
}

describe('useProgress', () => {
  it('loads injected storage once and exposes its availability', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      PROGRESS_KEY,
      JSON.stringify({
        version: 1,
        lessons: {},
        totalXp: 25,
        lastLessonSlug: 'znaiomstvo-z-arcade',
      }),
    );
    const { result, rerender } = renderHook(() => useProgress(storage));

    expect(result.current.progress).toEqual({
      version: 1,
      lessons: {},
      totalXp: 25,
      lastLessonSlug: 'znaiomstvo-z-arcade',
    });
    expect(result.current.storageAvailable).toBe(true);

    storage.setItem(
      PROGRESS_KEY,
      JSON.stringify({ version: 1, lessons: {}, totalXp: 999 }),
    );
    rerender();

    expect(result.current.progress.totalXp).toBe(25);
  });

  it('starts clean and unavailable when the initial storage read is blocked', () => {
    const blocked = {
      getItem: () => {
        throw new Error('blocked');
      },
    } as unknown as Storage;

    const { result } = renderHook(() => useProgress(blocked));

    expect(result.current.progress).toEqual({
      version: 1,
      lessons: {},
      totalXp: 0,
    });
    expect(result.current.storageAvailable).toBe(false);
  });

  it('marks a step done in state and injected storage', () => {
    const storage = new MemoryStorage();
    const { result } = renderHook(() => useProgress(storage));

    act(() => result.current.markStepDone('lesson-02', 'draw-hero'));

    expect(result.current.progress.lessons['lesson-02']).toEqual({
      completedStepIds: ['draw-hero'],
      quizPassed: false,
      completed: false,
    });
    expect(readStoredProgress(storage).lessons['lesson-02']).toEqual({
      completedStepIds: ['draw-hero'],
      quizPassed: false,
      completed: false,
    });
  });

  it('passes a quiz in state and injected storage', () => {
    const storage = new MemoryStorage();
    const { result } = renderHook(() => useProgress(storage));

    act(() => result.current.markQuizPassed('lesson-02'));

    expect(result.current.progress.lessons['lesson-02']?.quizPassed).toBe(true);
    expect(readStoredProgress(storage).lessons['lesson-02']?.quizPassed).toBe(true);
  });

  it('finishes a lesson, remembers it, and awards XP only once', () => {
    const storage = new MemoryStorage();
    const { result } = renderHook(() => useProgress(storage));

    act(() => {
      result.current.finishLesson('lesson-02', 'mii-pershyi-sprait', 100);
      result.current.finishLesson('lesson-02', 'mii-pershyi-sprait', 100);
    });

    expect(result.current.progress.lessons['lesson-02']?.completed).toBe(true);
    expect(result.current.progress.totalXp).toBe(100);
    expect(result.current.progress.lastLessonSlug).toBe('mii-pershyi-sprait');
    expect(readStoredProgress(storage)).toEqual(result.current.progress);
  });

  it('remembers the active lesson in state and injected storage', () => {
    const storage = new MemoryStorage();
    const { result } = renderHook(() => useProgress(storage));

    act(() => result.current.rememberLesson('heroi-pid-kontrolem'));

    expect(result.current.progress.lastLessonSlug).toBe('heroi-pid-kontrolem');
    expect(readStoredProgress(storage).lastLessonSlug).toBe(
      'heroi-pid-kontrolem',
    );
  });

  it('keeps the state update and marks storage unavailable when saving fails', () => {
    const blockedWriteStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('blocked');
      },
    } as unknown as Storage;
    const { result } = renderHook(() => useProgress(blockedWriteStorage));

    expect(result.current.storageAvailable).toBe(true);

    act(() => result.current.markStepDone('lesson-02', 'draw-hero'));

    expect(result.current.progress.lessons['lesson-02']?.completedStepIds).toEqual([
      'draw-hero',
    ]);
    expect(result.current.storageAvailable).toBe(false);
  });
});
