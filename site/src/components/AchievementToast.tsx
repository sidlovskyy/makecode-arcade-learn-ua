import { useId } from 'react';

interface AchievementToastProps {
  lessonTitle: string;
  xp: number;
  campaignReward?: string;
  onDismiss(): void;
}

export function AchievementToast({
  lessonTitle,
  xp,
  campaignReward,
  onDismiss,
}: AchievementToastProps) {
  const titleId = useId();

  return (
    <aside
      className="achievement-toast"
      role="status"
      aria-live="polite"
      aria-labelledby={titleId}
    >
      <span className="achievement-toast__icon" aria-hidden="true">✦</span>
      <div className="achievement-toast__content">
        <p className="eyebrow eyebrow--mint">Нагороду отримано</p>
        <h2 id={titleId}>Нагорода за місію</h2>
        <p className="achievement-toast__lesson">{lessonTitle}</p>
        <strong className="achievement-toast__xp">+{xp} XP</strong>
        {campaignReward && (
          <p className="achievement-toast__campaign">
            <span>Нагорода рівня</span>
            <strong>{campaignReward}</strong>
          </p>
        )}
      </div>
      <button
        className="achievement-toast__dismiss"
        type="button"
        aria-label="Закрити повідомлення про нагороду"
        onClick={onDismiss}
      >
        <span aria-hidden="true">×</span>
      </button>
    </aside>
  );
}
