import { useEffect, useRef } from 'react';
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
  const listRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const list = listRef.current;
    const active = list?.querySelector('[aria-current="step"]');
    if (!list || !active) return;
    const bounds = list.getBoundingClientRect();
    const target = active.getBoundingClientRect();
    if (target.left < bounds.left) list.scrollLeft += Math.floor(target.left - bounds.left) - 2;
    else if (target.right > bounds.left + list.clientWidth) list.scrollLeft += Math.ceil(target.right - bounds.left - list.clientWidth) + 2;
  }, [currentIndex]);

  return (
    <nav className="step-navigator" aria-label="Кроки місії">
      <div className="step-navigator__heading">
        <p className="eyebrow">Маршрут місії</p>
        <strong>{completedStepIds.size} із {steps.length}</strong>
      </div>

      <ol className="step-list" ref={listRef}>
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
                  {index + 1}
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
