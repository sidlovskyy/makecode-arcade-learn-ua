import { useCallback, useRef, useState } from 'react';
import {
  completeLesson,
  completeStep,
  createDefaultProgress,
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

interface InitialProgress extends ProgressSnapshot {
  storage: Storage | null;
}

type ProgressUpdate = (progress: ProgressState) => ProgressState;

function getDefaultStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function initializeProgress(storage: Storage | undefined): InitialProgress {
  const resolvedStorage = storage ?? getDefaultStorage();

  if (resolvedStorage === null) {
    return {
      progress: createDefaultProgress(),
      storageAvailable: false,
      storage: null,
    };
  }

  const loaded = loadProgress(resolvedStorage);

  return {
    progress: loaded.progress,
    storageAvailable: loaded.available,
    storage: resolvedStorage,
  };
}

export function useProgress(storage?: Storage): ProgressStore {
  const [initial] = useState<InitialProgress>(() => initializeProgress(storage));
  const progressRef = useRef(initial.progress);
  const storageRef = useRef(initial.storage);
  const storageAvailableRef = useRef(initial.storageAvailable);
  const [snapshot, setSnapshot] = useState<ProgressSnapshot>(() => ({
    progress: initial.progress,
    storageAvailable: initial.storageAvailable,
  }));

  const updateProgress = useCallback((update: ProgressUpdate) => {
    const progress = update(progressRef.current);
    progressRef.current = progress;

    const storage = storageRef.current;
    const saved = storage === null ? false : saveProgress(storage, progress);
    const storageAvailable = storageAvailableRef.current && saved;
    storageAvailableRef.current = storageAvailable;

    setSnapshot({ progress, storageAvailable });
  }, []);

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
