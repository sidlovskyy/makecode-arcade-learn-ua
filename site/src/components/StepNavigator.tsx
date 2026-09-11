import type { LessonStep } from '../curriculum/types';

interface StepNavigatorProps {
  steps: LessonStep[];
  currentIndex: number;
  completedStepIds: ReadonlySet<string>;
  onSelectStep(index: number): void;
}

export function StepNavigator({
  steps,
  currentIndex,
  completedStepIds,
  onSelectStep,
}: StepNavigatorProps) {
  return (
    <nav className="step-navigator" aria-label="Кроки місії">
      <div className="step-navigator__heading">
        <p className="eyebrow">Маршрут місії</p>
        <strong>{completedStepIds.size} із {steps.length}</strong>
      </div>

      <ol className="step-list">
        {steps.map((step, index) => {
          const isCurrent = index === currentIndex;
          const isCompleted = completedStepIds.has(step.id);
          const isAvailable = isCurrent || isCompleted;
          const accessibleName = `Крок ${index + 1}: ${step.title}${
            isCompleted ? '. Виконано' : ''
          }`;

          return (
            <li
              key={step.id}
              className="step-list__item"
              data-status={isCurrent ? 'current' : isCompleted ? 'completed' : 'upcoming'}
            >
              <button
                type="button"
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={accessibleName}
                disabled={!isAvailable}
                onClick={() => onSelectStep(index)}
              >
                <span className="step-list__marker" aria-hidden="true">
                  {isCompleted ? '✓' : index + 1}
                </span>
                <span className="step-list__label">{step.title}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
