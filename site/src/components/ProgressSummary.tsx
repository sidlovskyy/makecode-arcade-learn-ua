import { lessonHref } from '../app/routes';
import type { Campaign, Lesson } from '../curriculum/types';
import type { ProgressState } from '../progress/schema';

interface ProgressSummaryProps {
  campaigns: Campaign[];
  progress: ProgressState;
}

function getResumeLesson(
  lessons: Lesson[],
  progress: ProgressState,
): Lesson | undefined {
  const rememberedLesson = lessons.find(
    (lesson) => lesson.slug === progress.lastLessonSlug,
  );

  if (
    rememberedLesson &&
    !progress.lessons[rememberedLesson.id]?.completed
  ) {
    return rememberedLesson;
  }

  return lessons.find((lesson) => !progress.lessons[lesson.id]?.completed);
}

export function ProgressSummary({
  campaigns,
  progress,
}: ProgressSummaryProps) {
  const lessons = campaigns.flatMap((campaign) => campaign.lessons);
  const completedCount = lessons.filter(
    (lesson) => progress.lessons[lesson.id]?.completed,
  ).length;
  const completionPercent = lessons.length === 0
    ? 0
    : Math.round((completedCount / lessons.length) * 100);
  const resumeLesson = getResumeLesson(lessons, progress);
  const hasStarted = completedCount > 0 || Boolean(progress.lastLessonSlug);
  const allComplete = lessons.length > 0 && completedCount === lessons.length;

  return (
    <aside className="progress-summary" aria-labelledby="progress-title">
      <div className="progress-summary__topline">
        <p className="eyebrow eyebrow--mint">Твій маршрут</p>
        <span className="progress-summary__percent">{completionPercent}%</span>
      </div>
      <h2 id="progress-title">
        {allComplete ? 'Квест пройдено!' : 'Наступна місія вже чекає'}
      </h2>
      <p className="progress-summary__copy">
        {allComplete
          ? 'Ти відкрив усі навички курсу. Повертайся до місій, щоб створювати нові версії ігор.'
          : 'Рухайся у своєму темпі: виконуй кроки, експериментуй і збирай XP.'}
      </p>

      <div
        className="progress-track"
        role="progressbar"
        aria-label="Прогрес курсу"
        aria-valuemin={0}
        aria-valuemax={lessons.length}
        aria-valuenow={completedCount}
        aria-valuetext={`${completedCount} із ${lessons.length} місій завершено`}
      >
        <span style={{ width: `${completionPercent}%` }} />
      </div>

      <div className="progress-summary__stats" aria-label="Статистика курсу">
        <div>
          <strong>{completedCount}/{lessons.length}</strong>
          <span>місій</span>
        </div>
        <div>
          <strong>{progress.totalXp}</strong>
          <span>XP зібрано</span>
        </div>
      </div>

      {resumeLesson ? (
        <a className="button button--primary progress-summary__action" href={lessonHref(resumeLesson.slug)}>
          <span>{hasStarted ? 'Продовжити' : 'Почати квест'}</span>
          <span aria-hidden="true">→</span>
          <span className="sr-only">: {resumeLesson.title}</span>
        </a>
      ) : (
        <a className="button button--primary progress-summary__action" href="#/">
          Переглянути місії
          <span aria-hidden="true">→</span>
        </a>
      )}
    </aside>
  );
}
