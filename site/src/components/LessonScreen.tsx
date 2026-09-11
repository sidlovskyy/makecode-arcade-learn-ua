import { useEffect, useId, useRef, useState } from 'react';
import type { Lesson, LessonStep } from '../curriculum/types';
import type { LessonProgress } from '../progress/schema';
import type { ProgressActions } from '../progress/useProgress';
import { ChallengePanel } from './ChallengePanel';
import { Quiz } from './Quiz';
import { StepNavigator } from './StepNavigator';

interface LessonScreenProps {
  lesson: Lesson;
  lessonProgress?: LessonProgress;
  actions: ProgressActions;
  onHome(): void;
}

type LessonPhase = 'steps' | 'challenge' | 'quiz';

const difficultyLabels = {
  starter: 'Старт',
  explorer: 'Дослідник',
  builder: 'Творець',
  master: 'Майстер',
} as const;

interface PracticalStepProps {
  step: LessonStep;
  stepNumber: number;
  stepCount: number;
  isCompleted: boolean;
  onBack?: () => void;
  onContinue(): void;
}

function PracticalStep({
  step,
  stepNumber,
  stepCount,
  isCompleted,
  onBack,
  onContinue,
}: PracticalStepProps) {
  const [isHintVisible, setIsHintVisible] = useState(false);
  const hintId = useId();
  const isLastStep = stepNumber === stepCount;

  return (
    <article className="lesson-card-surface practical-step" aria-labelledby="practical-step-title">
      <div className="lesson-card-surface__topline">
        <p className="eyebrow">Крок {stepNumber} із {stepCount}</p>
        {isCompleted && <span className="completed-label">✓ Виконано</span>}
      </div>
      <h2 id="practical-step-title">{step.title}</h2>
      <p className="practical-step__instruction">{step.instruction}</p>

      <section className="expected-result" aria-labelledby="expected-result-title">
        <span className="expected-result__icon" aria-hidden="true">✓</span>
        <div>
          <h3 id="expected-result-title">Що має вийти</h3>
          <p>{step.expected}</p>
        </div>
      </section>

      {step.hint && (
        <div className="hint-disclosure">
          <button
            className="hint-disclosure__button"
            type="button"
            aria-expanded={isHintVisible}
            aria-controls={hintId}
            onClick={() => setIsHintVisible((visible) => !visible)}
          >
            <span aria-hidden="true">?</span>
            {isHintVisible
              ? 'Сховати підказку до кроку'
              : 'Показати підказку до кроку'}
          </button>
          {isHintVisible && (
            <p className="hint-disclosure__content" id={hintId}>
              {step.hint}
            </p>
          )}
        </div>
      )}

      <div className="lesson-card-surface__actions lesson-step-actions">
        {onBack && (
          <button className="button button--secondary" type="button" onClick={onBack}>
            <span aria-hidden="true">←</span>
            Назад
          </button>
        )}
        <button className="button button--primary" type="button" onClick={onContinue}>
          {isLastStep
            ? 'Кроки готові — до випробування'
            : isCompleted
              ? 'До наступного кроку'
              : 'Крок готовий — далі'}
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </article>
  );
}

export function LessonScreen({
  lesson,
  lessonProgress,
  actions,
  onHome,
}: LessonScreenProps) {
  const initialCompletedStepIds = lessonProgress?.completedStepIds ?? [];
  const allStepsInitiallyComplete = lesson.steps.every((step) =>
    initialCompletedStepIds.includes(step.id),
  );
  const initialStepIndex = lesson.steps.findIndex(
    (step) => !initialCompletedStepIds.includes(step.id),
  );
  const [completedStepIds, setCompletedStepIds] = useState(
    () => new Set(initialCompletedStepIds),
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(
    initialStepIndex === -1 ? Math.max(lesson.steps.length - 1, 0) : initialStepIndex,
  );
  const [phase, setPhase] = useState<LessonPhase>(() => {
    if (lessonProgress?.quizPassed) {
      return 'quiz';
    }

    return allStepsInitiallyComplete ? 'challenge' : 'steps';
  });
  const [quizPassed, setQuizPassed] = useState(
    Boolean(lessonProgress?.quizPassed),
  );
  const [completionRequested, setCompletionRequested] = useState(
    Boolean(lessonProgress?.completed),
  );
  const quizPassedRef = useRef(Boolean(lessonProgress?.quizPassed));
  const completionRequestedRef = useRef(Boolean(lessonProgress?.completed));
  const { finishLesson, markQuizPassed, markStepDone, rememberLesson } = actions;

  useEffect(() => {
    rememberLesson(lesson.slug);
  }, [lesson.slug, rememberLesson]);

  const currentStep = lesson.steps[currentStepIndex]!;
  const isLessonComplete = Boolean(lessonProgress?.completed) || completionRequested;

  function handleSelectStep(index: number) {
    const selectedStep = lesson.steps[index];

    if (!selectedStep || (!completedStepIds.has(selectedStep.id) && index !== currentStepIndex)) {
      return;
    }

    setCurrentStepIndex(index);
    setPhase('steps');
  }

  function handleStepContinue() {
    if (!completedStepIds.has(currentStep.id)) {
      setCompletedStepIds((current) => {
        const next = new Set(current);
        next.add(currentStep.id);
        return next;
      });
      markStepDone(lesson.id, currentStep.id);
    }

    if (currentStepIndex === lesson.steps.length - 1) {
      setPhase('challenge');
      return;
    }

    setCurrentStepIndex((index) => index + 1);
  }

  function handleQuizPassed() {
    if (quizPassedRef.current) {
      return;
    }

    quizPassedRef.current = true;
    setQuizPassed(true);
    markQuizPassed(lesson.id);
  }

  function handleFinishLesson() {
    if (completionRequestedRef.current || lessonProgress?.completed) {
      return;
    }

    completionRequestedRef.current = true;
    setCompletionRequested(true);
    finishLesson(lesson.id, lesson.slug, lesson.xp);
  }

  return (
    <main className="lesson-main" id="main-content" tabIndex={-1}>
      <div className="page-shell lesson-shell">
        <button className="lesson-back-link" type="button" onClick={onHome}>
          <span aria-hidden="true">←</span>
          До мапи курсу
        </button>

        <header className="lesson-intro">
          <div>
            <p className="eyebrow">Місія {lesson.order}</p>
            <h1>{lesson.title}</h1>
            <p>{lesson.summary}</p>
          </div>
          <ul className="lesson-meta" aria-label="Про місію">
            <li>{lesson.durationMinutes} хв</li>
            <li>{difficultyLabels[lesson.difficulty]}</li>
            <li>{lesson.xp} XP</li>
          </ul>
        </header>

        <section className="lesson-objective" aria-labelledby="lesson-objective-title">
          <span className="lesson-objective__icon" aria-hidden="true">◎</span>
          <div>
            <p className="eyebrow">Твоя мета</p>
            <h2 id="lesson-objective-title">{lesson.objective}</h2>
          </div>
        </section>

        <div className="lesson-layout">
          <aside className="lesson-sidebar">
            <StepNavigator
              steps={lesson.steps}
              currentIndex={phase === 'steps' ? currentStepIndex : -1}
              completedStepIds={completedStepIds}
              onSelectStep={handleSelectStep}
            />

            <a
              className="makecode-action"
              href={lesson.makeCodeUrl}
              target="_blank"
              rel="noreferrer noopener"
            >
              <span>
                <small>Офіційний сайт</small>
                Відкрити MakeCode
              </span>
              <span aria-hidden="true">↗</span>
            </a>
            <p className="makecode-address">
              Якщо вкладка не відкрилась, скопіюй адресу:
              <span>{lesson.makeCodeUrl}</span>
            </p>
          </aside>

          <div className="lesson-workspace">
            {isLessonComplete ? (
              <section className="lesson-card-surface completion-panel" aria-labelledby="completion-title">
                <span className="completion-panel__burst" aria-hidden="true">✦</span>
                <p className="eyebrow">Місію завершено</p>
                <h2 id="completion-title">Супер! Нова навичка твоя.</h2>
                <p>
                  Ти виконав усі кроки, пройш випробування й правильно відповів на мінітест.
                </p>
                <strong className="completion-panel__xp">+{lesson.xp} XP</strong>
                <button className="button button--primary" type="button" onClick={onHome}>
                  Повернутися до мапи
                  <span aria-hidden="true">→</span>
                </button>
              </section>
            ) : (
              <>
                {phase === 'steps' && (
                  <PracticalStep
                    key={currentStep.id}
                    step={currentStep}
                    stepNumber={currentStepIndex + 1}
                    stepCount={lesson.steps.length}
                    isCompleted={completedStepIds.has(currentStep.id)}
                    onBack={currentStepIndex > 0
                      ? () => handleSelectStep(currentStepIndex - 1)
                      : undefined}
                    onContinue={handleStepContinue}
                  />
                )}

                {phase === 'challenge' && (
                  <ChallengePanel
                    challenge={lesson.challenge}
                    onContinue={() => setPhase('quiz')}
                  />
                )}

                {phase === 'quiz' && (
                  <>
                    <Quiz
                      quiz={lesson.quiz}
                      initiallyPassed={quizPassed}
                      onPassed={handleQuizPassed}
                    />
                    {quizPassed && (
                      <section className="finish-panel" aria-label="Завершення місії">
                        <div>
                          <p className="eyebrow">Усе готово</p>
                          <h2>Забери нагороду за місію</h2>
                          <p>Прогрес збережеться у цьому браузері.</p>
                        </div>
                        <button
                          className="button button--primary"
                          type="button"
                          onClick={handleFinishLesson}
                        >
                          Завершити місію
                          <span aria-hidden="true">+{lesson.xp} XP</span>
                        </button>
                      </section>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
