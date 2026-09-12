import { useCallback, useEffect, useRef, useState } from 'react';
import { AchievementToast } from '../components/AchievementToast';
import { AppHeader } from '../components/AppHeader';
import { CourseMap } from '../components/CourseMap';
import { LessonScreen } from '../components/LessonScreen';
import { NotFound } from '../components/NotFound';
import { ProgressSummary } from '../components/ProgressSummary';
import { SiteFooter } from '../components/SiteFooter';
import { StorageNotice } from '../components/StorageNotice';
import { curriculum, lessonBySlug } from '../curriculum';
import type { Lesson } from '../curriculum/types';
import type { ProgressState } from '../progress/schema';
import { useProgress } from '../progress/useProgress';
import { navigateTo, parseHash, type AppRoute } from './routes';

interface CompletionResult {
  lessonTitle: string;
  xp: number;
  campaignReward?: string;
}

function readRoute(): AppRoute {
  return parseHash(window.location.hash);
}

function getCampaignReward(lessonId: string): string | undefined {
  const completedCampaign = curriculum.find((campaign) => {
    const finalLesson = campaign.lessons[campaign.lessons.length - 1];
    return finalLesson?.id === lessonId;
  });

  return completedCampaign?.reward;
}

function HomeRoute({ progress }: { progress: ProgressState }) {
  return (
    <main className="home-main" id="main-content" tabIndex={-1}>
      <div className="page-shell">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero__copy">
            <p className="eyebrow">MakeCode Arcade · курс українською</p>
            <h1 id="hero-title">
              Від першого пікселя
              <span>до власної гри</span>
            </h1>
            <p className="hero__lead">
              Створюй персонажів, світи й цілі ігри у своєму темпі. Кожна місія пояснює одну нову суперсилу та одразу дає спробувати її в редакторі.
            </p>
            <ul className="hero__facts" aria-label="Про курс">
              <li>6 рівнів</li>
              <li>24 місії</li>
              <li>Жодних блокувань</li>
            </ul>
          </div>

          <div className="hero__panel">
            <ProgressSummary campaigns={curriculum} progress={progress} />
          </div>
        </section>

        <CourseMap campaigns={curriculum} progress={progress} />
      </div>
    </main>
  );
}

export function App() {
  const [route, setRoute] = useState<AppRoute>(readRoute);
  const [completionResult, setCompletionResult] = useState<CompletionResult>();
  const hasRenderedInitialRoute = useRef(false);
  const progressStore = useProgress();
  const { loadOutcome, progress, storageAvailable } = progressStore;

  useEffect(() => {
    const handleHashChange = () => setRoute(readRoute());
    window.addEventListener('hashchange', handleHashChange);

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (!hasRenderedInitialRoute.current) {
      hasRenderedInitialRoute.current = true;
      return;
    }

    document.getElementById('main-content')?.focus();
  }, [route]);

  const handleLessonCompleted = useCallback((lesson: Lesson) => {
    setCompletionResult({
      lessonTitle: lesson.title,
      xp: lesson.xp,
      campaignReward: getCampaignReward(lesson.id),
    });
  }, []);

  const dismissAchievement = useCallback(() => {
    setCompletionResult(undefined);
  }, []);

  const activeLesson = route.name === 'lesson'
    ? lessonBySlug.get(route.slug)
    : undefined;

  return (
    <div className="app-shell">
      <AppHeader totalXp={progress.totalXp} />
      <StorageNotice
        storageAvailable={storageAvailable}
        recoveryFailed={loadOutcome === 'reset'}
      />
      {route.name === 'home' && <HomeRoute progress={progress} />}
      {route.name === 'lesson' && activeLesson && (
        <LessonScreen
          key={activeLesson.id}
          lesson={activeLesson}
          lessonProgress={progress.lessons[activeLesson.id]}
          actions={progressStore}
          storageAvailable={storageAvailable}
          onHome={() => navigateTo('#/')}
          onCompleted={handleLessonCompleted}
        />
      )}
      {(route.name === 'not-found' || (route.name === 'lesson' && !activeLesson)) && (
        <NotFound />
      )}
      {completionResult && (
        <AchievementToast
          lessonTitle={completionResult.lessonTitle}
          xp={completionResult.xp}
          campaignReward={completionResult.campaignReward}
          onDismiss={dismissAchievement}
        />
      )}
      <SiteFooter />
    </div>
  );
}
