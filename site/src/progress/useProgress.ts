import { useCallback, useState } from 'react';
import {
  completeLesson,
  completeStep,
  passQuiz,
  setLastLesson,
  type ProgressState,
} from './schema';
import { loadProgress, saveProgress } from './storage';

export interface ProgressActions {
  markStepDone(lessonId: string, stepId: string): void;
  markQuizPassed(lessonId: string): void;
  finishLesson(lessonId: string, slug: string, xp: number): void;
  rememberLesson(slug: string): void;
}

export interface ProgressStore extends ProgressActions {
  progress: ProgressState;
  storageAvailable: boolean;
}

interface ProgressSnapshot {
  progress: ProgressState;
  storageAvailable: boolean;
}

type ProgressUpdate = (progress: ProgressState) => ProgressState;

export function useProgress(
  storage: Storage = window.localStorage,
): ProgressStore {
  const [snapshot, setSnapshot] = useState<ProgressSnapshot>(() => {
    const loaded = loadProgress(storage);

    return {
      progress: loaded.progress,
      storageAvailable: loaded.available,
    };
  });

  const updateProgress = useCallback(
    (update: ProgressUpdate) => {
      setSnapshot((current) => {
        const progress = update(current.progress);

        return {
          progress,
          storageAvailable: saveProgress(storage, progress),
        };
      });
    },
    [storage],
  );

  const markStepDone = useCallback(
    (lessonId: string, stepId: string) => {
      updateProgress((progress) => completeStep(progress, lessonId, stepId));
    },
    [updateProgress],
  );

  const markQuizPassed = useCallback(
    (lessonId: string) => {
      updateProgress((progress) => passQuiz(progress, lessonId));
    },
    [updateProgress],
  );

  const finishLesson = useCallback(
    (lessonId: string, slug: string, xp: number) => {
      updateProgress((progress) =>
        setLastLesson(completeLesson(progress, lessonId, xp), slug),
      );
    },
    [updateProgress],
  );

  const rememberLesson = useCallback(
    (slug: string) => {
      updateProgress((progress) => setLastLesson(progress, slug));
    },
    [updateProgress],
  );

  return {
    progress: snapshot.progress,
    storageAvailable: snapshot.storageAvailable,
    markStepDone,
    markQuizPassed,
    finishLesson,
    rememberLesson,
  };
}
