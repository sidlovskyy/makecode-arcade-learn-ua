import { useMemo, useState } from 'react';
import type { Campaign, Difficulty } from '../curriculum/types';
import type { ProgressState } from '../progress/schema';
import { CampaignCard } from './CampaignCard';

type DifficultyFilter = Difficulty | 'all';

const difficultyOptions: Array<{
  value: DifficultyFilter;
  label: string;
}> = [
  { value: 'all', label: 'Усі рівні' },
  { value: 'starter', label: 'Старт' },
  { value: 'explorer', label: 'Дослідник' },
  { value: 'builder', label: 'Творець' },
  { value: 'master', label: 'Майстер' },
];

interface CourseMapProps {
  campaigns: Campaign[];
  progress: ProgressState;
}

function matchesQuery(campaign: Campaign, query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase('uk-UA');

  if (!normalizedQuery) {
    return campaign.lessons;
  }

  return campaign.lessons.filter((lesson) => {
    const searchableText = [
      lesson.title,
      lesson.summary,
      lesson.objective,
      ...lesson.concepts,
    ]
      .join(' ')
      .toLocaleLowerCase('uk-UA');

    return searchableText.includes(normalizedQuery);
  });
}

export function CourseMap({ campaigns, progress }: CourseMapProps) {
  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all');

  const visibleCampaigns = useMemo(
    () => campaigns
      .map((campaign) => ({
        campaign,
        lessons: matchesQuery(campaign, query).filter(
          (lesson) => difficulty === 'all' || lesson.difficulty === difficulty,
        ),
      }))
      .filter(({ lessons }) => lessons.length > 0),
    [campaigns, difficulty, query],
  );

  const resultCount = visibleCampaigns.reduce(
    (total, { lessons }) => total + lessons.length,
    0,
  );
  const hasActiveFilters = query.length > 0 || difficulty !== 'all';

  function clearFilters() {
    setQuery('');
    setDifficulty('all');
  }

  return (
    <section className="course-map" id="course-map" aria-labelledby="course-map-title">
      <header className="section-heading">
        <div>
          <p className="eyebrow">Карта пригоди</p>
          <h2 id="course-map-title">Обери наступну місію</h2>
        </div>
        <p>
          Іди за маршрутом або відкривай будь-яку тему. Тут немає заблокованих рівнів.
        </p>
      </header>

      <div className="course-filters" role="search" aria-label="Пошук і фільтри місій">
        <label className="field field--search">
          <span>Пошук місій</span>
          <span className="field__control">
            <span className="field__icon" aria-hidden="true">⌕</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Наприклад, спрайт або анімація"
            />
          </span>
        </label>

        <label className="field">
          <span>Складність</span>
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value as DifficultyFilter)}
          >
            {difficultyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button
          className="button button--secondary course-filters__clear"
          type="button"
          onClick={clearFilters}
          disabled={!hasActiveFilters}
        >
          Скинути фільтри
        </button>
      </div>

      <p className="course-results">
        {resultCount === 1 ? 'Знайдено 1 місію' : `Знайдено місій: ${resultCount}`}
      </p>

      {visibleCampaigns.length > 0 ? (
        <div className="campaign-list">
          {visibleCampaigns.map(({ campaign, lessons }) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              visibleLessons={lessons}
              progress={progress}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-state__icon" aria-hidden="true">?</span>
          <h3>Такої місії поки не видно</h3>
          <p>Спробуй коротше слово або скинь фільтри — усі 24 місії на місці.</p>
          <button className="button button--primary" type="button" onClick={clearFilters}>
            Показати всі місії
          </button>
        </div>
      )}
    </section>
  );
}
