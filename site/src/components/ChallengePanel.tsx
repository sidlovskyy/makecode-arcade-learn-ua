import { useId, useState } from 'react';
import type { LessonChallenge } from '../curriculum/types';

interface ChallengePanelProps {
  challenge: LessonChallenge;
  onContinue(): void;
}

export function ChallengePanel({
  challenge,
  onContinue,
}: ChallengePanelProps) {
  const [isHintVisible, setIsHintVisible] = useState(false);
  const hintId = useId();

  return (
    <section className="lesson-card-surface challenge-panel" aria-labelledby="challenge-title">
      <div className="lesson-card-surface__topline">
        <p className="eyebrow">Самостійне випробування</p>
        <span className="lesson-stage-badge" aria-hidden="true">◆</span>
      </div>
      <h2 id="challenge-title" tabIndex={-1}>{challenge.title}</h2>
      <p className="challenge-panel__prompt">{challenge.prompt}</p>

      {challenge.hint && (
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
              ? 'Сховати підказку до випробування'
              : 'Показати підказку до випробування'}
          </button>
          {isHintVisible && (
            <p className="hint-disclosure__content" id={hintId}>
              {challenge.hint}
            </p>
          )}
        </div>
      )}

      <div className="lesson-card-surface__actions">
        <button className="button button--primary" type="button" onClick={onContinue}>
          Випробування виконано — до мінітесту
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}
