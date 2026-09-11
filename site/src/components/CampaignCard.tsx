import { resolveLessonSlug } from '../curriculum';
import type { Campaign, Lesson } from '../curriculum/types';
import type { ProgressState } from '../progress/schema';
import { LessonCard } from './LessonCard';

interface CampaignCardProps {
  campaign: Campaign;
  visibleLessons?: Lesson[];
  progress: ProgressState;
}

export function CampaignCard({
  campaign,
  visibleLessons = campaign.lessons,
  progress,
}: CampaignCardProps) {
  const rememberedSlug = resolveLessonSlug(progress.lastLessonSlug);
  const completedCount = campaign.lessons.filter(
    (lesson) => progress.lessons[lesson.id]?.completed,
  ).length;
  const completionPercent = Math.round(
    (completedCount / campaign.lessons.length) * 100,
  );
  const titleId = `${campaign.id}-title`;

  return (
    <article
      className="campaign-card"
      data-campaign-color={campaign.color}
      aria-labelledby={titleId}
    >
      <header className="campaign-card__header">
        <div className="campaign-card__identity">
          <span className="campaign-card__number" aria-hidden="true">
            {String(campaign.order).padStart(2, '0')}
          </span>
          <div>
            <p className="campaign-card__kicker">Рівень {campaign.order}</p>
            <h3 id={titleId}>{campaign.title}</h3>
            <p>{campaign.description}</p>
          </div>
        </div>

        <div className="campaign-card__reward">
          <span aria-hidden="true">◆</span>
          <span>
            Нагорода
            <strong>{campaign.reward}</strong>
          </span>
        </div>
      </header>

      <div className="campaign-card__progress">
        <span>{completedCount} із {campaign.lessons.length} місій</span>
        <div
          className="campaign-progress-track"
          role="progressbar"
          aria-label={`Прогрес рівня «${campaign.title}»`}
          aria-valuemin={0}
          aria-valuemax={campaign.lessons.length}
          aria-valuenow={completedCount}
        >
          <span style={{ width: `${completionPercent}%` }} />
        </div>
      </div>

      <ol className="lesson-grid">
        {visibleLessons.map((lesson) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            lessonProgress={progress.lessons[lesson.id]}
            isRemembered={rememberedSlug === lesson.slug}
          />
        ))}
      </ol>
    </article>
  );
}
