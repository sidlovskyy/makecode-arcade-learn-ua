import { lessonHref } from '../app/routes';
import type { Lesson } from '../curriculum/types';
import type { LessonProgress } from '../progress/schema';

type LessonStatus = 'not-started' | 'in-progress' | 'completed';

const difficultyLabels = {
  starter: 'Старт',
  explorer: 'Дослідник',
  builder: 'Творець',
  master: 'Майстер',
} as const;

const statusLabels: Record<LessonStatus, string> = {
  'not-started': 'Не розпочато',
  'in-progress': 'У процесі',
  completed: 'Завершено',
};

interface LessonCardProps {
  lesson: Lesson;
  lessonProgress?: LessonProgress;
  isRemembered?: boolean;
}

function getLessonStatus(
  lessonProgress: LessonProgress | undefined,
  isRemembered: boolean,
): LessonStatus {
  if (lessonProgress?.completed) {
    return 'completed';
  }

  if (
    isRemembered ||
    lessonProgress?.quizPassed ||
    (lessonProgress?.completedStepIds.length ?? 0) > 0
  ) {
    return 'in-progress';
  }

  return 'not-started';
}

export function LessonCard({
  lesson,
  lessonProgress,
  isRemembered = false,
}: LessonCardProps) {
  const status = getLessonStatus(lessonProgress, isRemembered);
  const statusLabel = statusLabels[status];
  const summaryId = `${lesson.id}-summary`;
  const metadataId = `${lesson.id}-metadata`;

  return (
    <li className="lesson-card-item">
      <a
        className="lesson-card"
        data-lesson-link
        data-status={status}
        href={lessonHref(lesson.slug)}
        aria-label={`Місія ${lesson.order}: ${lesson.title}. ${statusLabel}`}
        aria-describedby={`${summaryId} ${metadataId}`}
      >
        <span className="lesson-card__topline">
          <span className="lesson-number" aria-hidden="true">
            {String(lesson.order).padStart(2, '0')}
          </span>
          <span className={`lesson-status lesson-status--${status}`}>
            {status === 'completed' && <span aria-hidden="true">✓ </span>}
            {statusLabel}
          </span>
        </span>

        <span className="lesson-card__body">
          <strong className="lesson-card__title">{lesson.title}</strong>
          <span className="lesson-card__summary" id={summaryId}>{lesson.summary}</span>
        </span>

        <span className="lesson-card__meta" id={metadataId}>
          <span>{difficultyLabels[lesson.difficulty]}</span>
          {' '}
          <span>{lesson.durationMinutes} хв</span>
          {' '}
          <span>{lesson.xp} XP</span>
        </span>

        <span className="lesson-card__arrow" aria-hidden="true">→</span>
      </a>
    </li>
  );
}
