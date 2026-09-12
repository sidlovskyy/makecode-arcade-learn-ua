import { useRef, useState, type FormEvent } from 'react';
import type { LessonQuiz } from '../curriculum/types';

interface QuizProps {
  quiz: LessonQuiz;
  initiallyPassed?: boolean;
  onPassed(): void;
}

export function Quiz({
  quiz,
  initiallyPassed = false,
  onPassed,
}: QuizProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hasAttempted, setHasAttempted] = useState(initiallyPassed);
  const [isPassed, setIsPassed] = useState(initiallyPassed);
  const passedRef = useRef(initiallyPassed);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedIndex === null || passedRef.current) {
      return;
    }

    setHasAttempted(true);

    if (selectedIndex === quiz.correctIndex) {
      passedRef.current = true;
      setIsPassed(true);
      onPassed();
    }
  }

  return (
    <section className="lesson-card-surface quiz-panel" aria-labelledby="quiz-title">
      <div className="lesson-card-surface__topline">
        <p className="eyebrow">Фінальна перевірка</p>
        <span className="lesson-stage-badge" aria-hidden="true">?</span>
      </div>
      <h2 id="quiz-title" tabIndex={-1}>Мінітест</h2>

      <form onSubmit={handleSubmit}>
        <fieldset disabled={isPassed}>
          <legend>{quiz.question}</legend>
          <div className="quiz-options">
            {quiz.options.map((option, index) => (
              <label className="quiz-option" key={option}>
                <input
                  type="radio"
                  name="lesson-quiz"
                  value={index}
                  checked={selectedIndex === index}
                  onChange={() => setSelectedIndex(index)}
                />
                <span className="quiz-option__marker" aria-hidden="true">
                  {String.fromCharCode(65 + index)}
                </span>
                <span>{option}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {hasAttempted && (
          <div
            className={`quiz-feedback quiz-feedback--${isPassed ? 'correct' : 'retry'}`}
            role="status"
          >
            <strong>{isPassed ? 'Правильно!' : 'Майже! Спробуй ще раз.'}</strong>
            <p>{quiz.explanation}</p>
          </div>
        )}

        {!isPassed && (
          <div className="lesson-card-surface__actions">
            <button
              className="button button--primary"
              type="submit"
              disabled={selectedIndex === null}
            >
              {hasAttempted ? 'Спробувати ще раз' : 'Перевірити відповідь'}
            </button>
          </div>
        )}
      </form>
    </section>
  );
}
