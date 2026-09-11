import { useEffect, useState } from 'react';
import { AppHeader } from '../components/AppHeader';
import { CourseMap } from '../components/CourseMap';
import { LessonScreen } from '../components/LessonScreen';
import { NotFound } from '../components/NotFound';
import { ProgressSummary } from '../components/ProgressSummary';
import { SiteFooter } from '../components/SiteFooter';
import { curriculum, lessonBySlug } from '../curriculum';
import type { ProgressState } from '../progress/schema';
import { useProgress } from '../progress/useProgress';
import { navigateTo, parseHash, type AppRoute } from './routes';

function readRoute(): AppRoute {
  return parseHash(window.location.hash);
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
  const progressStore = useProgress();
  const { progress } = progressStore;

  useEffect(() => {
    const handleHashChange = () => setRoute(readRoute());
    window.addEventListener('hashchange', handleHashChange);

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const activeLesson = route.name === 'lesson'
    ? lessonBySlug.get(route.slug)
    : undefined;

  return (
    <div className="app-shell">
      <AppHeader totalXp={progress.totalXp} />
      {route.name === 'home' && <HomeRoute progress={progress} />}
      {route.name === 'lesson' && activeLesson && (
        <LessonScreen
          key={activeLesson.id}
          lesson={activeLesson}
          lessonProgress={progress.lessons[activeLesson.id]}
          actions={progressStore}
          onHome={() => navigateTo('#/')}
        />
      )}
      {(route.name === 'not-found' || (route.name === 'lesson' && !activeLesson)) && (
        <NotFound />
      )}
      <SiteFooter />
    </div>
  );
}
