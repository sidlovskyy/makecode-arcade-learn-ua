import { act, cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../app/App';
import { curriculum } from '../curriculum';
import { createDefaultProgress, type ProgressState } from '../progress/schema';
import { AppHeader } from './AppHeader';
import { CourseMap } from './CourseMap';
import { ProgressSummary } from './ProgressSummary';
import { SiteFooter } from './SiteFooter';

const campaignTitles = [
  'Новачок',
  'Дослідник',
  'Розробник ігор',
  'Архітектор світів',
  'Геймдизайнер',
  'Майстер коду',
];

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
  window.history.replaceState(null, '', '#/');
});

describe('home chrome', () => {
  it('shows the brand, course navigation, XP, and project notice', () => {
    render(
      <>
        <AppHeader totalXp={275} />
        <SiteFooter />
      </>,
    );

    expect(screen.getAllByRole('link', { name: 'КодКвест — на головну' })).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'Курс' })).toHaveAttribute('href', '#/');
    expect(screen.getByLabelText('275 очок досвіду')).toHaveTextContent('275 XP');
    expect(screen.getByText(
      'КодКвест — незалежний навчальний проєкт. Microsoft MakeCode є продуктом Microsoft.',
    )).toBeInTheDocument();
  });

  it('responds to hash changes while keeping the footer on a lesson route', () => {
    window.history.replaceState(null, '', '#/');
    render(<App />);

    expect(screen.getByRole('heading', { name: /Від першого пікселя/ })).toBeInTheDocument();

    act(() => {
      window.history.replaceState(null, '', '#/lesson/mii-pershyi-sprait');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    expect(screen.queryByRole('heading', { name: /Від першого пікселя/ })).not.toBeInTheDocument();
    expect(screen.getByText(
      'КодКвест — незалежний навчальний проєкт. Microsoft MakeCode є продуктом Microsoft.',
    )).toBeInTheDocument();

    act(() => {
      window.history.replaceState(null, '', '#/');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    expect(screen.getByRole('heading', { name: /Від першого пікселя/ })).toBeInTheDocument();
  });
});

describe('CourseMap', () => {
  it.each([
    ['vid-blokiv-do-kodu', 'vid-blokiv-do-python', 'Від блоків до Python'],
    ['typescript-u-hri', 'python-u-hri', 'Python у грі'],
  ])('marks remembered legacy %s in progress before the first completed step', (legacy, canonical, title) => {
    const progress = { ...createDefaultProgress(), lastLessonSlug: legacy };
    render(<CourseMap campaigns={curriculum} progress={progress} />);

    const lesson = screen.getByRole('link', { name: new RegExp(`Місія \\d+: ${title}`) });
    expect(lesson).toHaveAttribute('href', `#/lesson/${canonical}`);
    expect(lesson).toHaveAttribute('data-status', 'in-progress');
    expect(lesson).toHaveAccessibleName(new RegExp(`${title}\\. У процесі`));
    expect(progress.lastLessonSlug).toBe(legacy);
    expect(progress.lessons).toEqual({});
  });

  it('shows all six campaigns and all 24 accessible lesson links', () => {
    render(
      <CourseMap campaigns={curriculum} progress={createDefaultProgress()} />,
    );

    for (const title of campaignTitles) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    }

    expect(
      screen.getAllByRole('link', { name: /^Місія \d+:/ }),
    ).toHaveLength(24);
  });

  it('lets a keyboard user open the first lesson with Enter', async () => {
    const user = userEvent.setup();
    render(
      <CourseMap campaigns={curriculum} progress={createDefaultProgress()} />,
    );

    await user.tab();
    expect(screen.getByRole('searchbox', { name: 'Пошук місій' })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('combobox', { name: 'Складність' })).toHaveFocus();

    await user.tab();
    const firstLesson = screen.getByRole('link', {
      name: 'Місія 1: Знайомство з Arcade. Не розпочато',
    });
    expect(firstLesson).toHaveFocus();

    await user.keyboard('{Enter}');

    expect(window.location.hash).toBe('#/lesson/znaiomstvo-z-arcade');
  });

  it('narrows the real curriculum to lessons relevant to a search', async () => {
    const user = userEvent.setup();
    render(
      <CourseMap campaigns={curriculum} progress={createDefaultProgress()} />,
    );

    await user.type(screen.getByRole('searchbox', { name: 'Пошук місій' }), 'спрайт');

    const visibleLinks = screen.getAllByRole('link', { name: /^Місія \d+:/ });

    expect(visibleLinks).toHaveLength(6);
    for (const title of [
      'Мій перший спрайт',
      'Герой під контролем',
      'Коли спрайти зустрічаються',
      'Снаряди й небезпеки',
      'Мешканці світу',
      'Графіка майстра',
    ]) {
      expect(screen.getByRole('link', { name: new RegExp(title) })).toBeInTheDocument();
    }
    expect(screen.queryByRole('link', { name: /Місія 1: Знайомство з Arcade/ })).not.toBeInTheDocument();
  });

  it('filters by difficulty and can clear the filters', async () => {
    const user = userEvent.setup();
    render(
      <CourseMap campaigns={curriculum} progress={createDefaultProgress()} />,
    );

    const search = screen.getByRole('searchbox', { name: 'Пошук місій' });
    const difficulty = screen.getByRole('combobox', { name: 'Складність' });
    await user.type(search, 'спрайт');
    await user.selectOptions(difficulty, 'master');

    expect(screen.getAllByRole('link', { name: /^Місія \d+:/ })).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Скинути фільтри' }));

    expect(search).toHaveValue('');
    expect(search).toHaveFocus();
    expect(difficulty).toHaveValue('all');
    expect(screen.getAllByRole('link', { name: /^Місія \d+:/ })).toHaveLength(24);
  });

  it('announces zero and restored results and keeps focus after showing all missions', async () => {
    const user = userEvent.setup();
    render(
      <CourseMap campaigns={curriculum} progress={createDefaultProgress()} />,
    );
    const search = screen.getByRole('searchbox', { name: 'Пошук місій' });

    await user.type(search, 'zzzz');

    const resultStatus = screen.getByRole('status');
    expect(resultStatus).toHaveAttribute('aria-live', 'polite');
    expect(resultStatus).toHaveAttribute('aria-atomic', 'true');
    expect(resultStatus).toHaveTextContent('Знайдено місій: 0');

    const showAll = screen.getByRole('button', { name: 'Показати всі місії' });
    showAll.focus();
    await user.keyboard('{Enter}');

    expect(search).toHaveFocus();
    expect(resultStatus).toHaveTextContent('Знайдено місій: 24');
    expect(screen.getAllByRole('link', { name: /^Місія \d+:/ })).toHaveLength(24);
  });

  it('exposes each lesson card summary, difficulty, duration, and XP', () => {
    const { container } = render(
      <CourseMap campaigns={curriculum} progress={createDefaultProgress()} />,
    );

    const firstLesson = screen.getByRole('link', {
      name: 'Місія 1: Знайомство з Arcade. Не розпочато',
    });
    expect(firstLesson).toHaveAccessibleDescription(
      'Оглянь редактор і запусти свій перший проєкт. Старт 20 хв 100 XP',
    );

    const metadataGroups = container.querySelectorAll('.lesson-card__meta');
    expect(metadataGroups).toHaveLength(24);
    for (const metadata of metadataGroups) {
      expect(metadata).not.toHaveAttribute('aria-hidden');
    }
  });

  it('keeps the final advanced lesson clickable with clean progress', () => {
    render(
      <CourseMap campaigns={curriculum} progress={createDefaultProgress()} />,
    );

    const finalLesson = screen.getByRole('link', {
      name: /Місія 24: Моя власна гра/,
    });

    expect(finalLesson).toHaveAttribute('href', '#/lesson/moia-vlasna-hra');
    expect(finalLesson).not.toHaveAttribute('aria-disabled');
    expect(finalLesson).not.toHaveAttribute('tabindex', '-1');
  });

  it('shows completion statuses without hiding lesson links', () => {
    const progress: ProgressState = {
      version: 1,
      lessons: {
        'lesson-01': {
          completedStepIds: [],
          quizPassed: true,
          completed: true,
        },
      },
      totalXp: 100,
      lastLessonSlug: 'mii-pershyi-sprait',
    };

    render(<CourseMap campaigns={curriculum} progress={progress} />);

    expect(screen.getByRole('link', {
      name: /Місія 1: Знайомство з Arcade\. Завершено/,
    })).toBeInTheDocument();
    expect(screen.getByRole('link', {
      name: /Місія 2: Мій перший спрайт\. У процесі/,
    })).toBeInTheDocument();
  });
});

describe('ProgressSummary', () => {
  it('starts a fresh course at the first mission', () => {
    render(
      <ProgressSummary campaigns={curriculum} progress={createDefaultProgress()} />,
    );

    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByRole('link', {
      name: /Почати квест.*Знайомство з Arcade/,
    })).toHaveAttribute('href', '#/lesson/znaiomstvo-z-arcade');

    const artwork = screen.getByRole('img', {
      name: 'Дитина з портативною консоллю серед піксельних героїв і фантастичних світів',
    });
    expect(artwork).toHaveAttribute('width', '1536');
    expect(artwork).toHaveAttribute('height', '1024');
  });

  it('resumes the remembered unfinished lesson and reports course progress', () => {
    const progress: ProgressState = {
      version: 1,
      lessons: {
        'lesson-01': {
          completedStepIds: [],
          quizPassed: true,
          completed: true,
        },
      },
      totalXp: 100,
      lastLessonSlug: 'mii-pershyi-sprait',
    };

    render(<ProgressSummary campaigns={curriculum} progress={progress} />);

    expect(screen.getByRole('progressbar', { name: 'Прогрес курсу' })).toHaveAttribute(
      'aria-valuenow',
      '1',
    );
    expect(screen.getByText('4%')).toBeInTheDocument();
    expect(within(screen.getByLabelText('Статистика курсу')).getByText('1/24')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Продовжити.*Мій перший спрайт/ })).toHaveAttribute(
      'href',
      '#/lesson/mii-pershyi-sprait',
    );
  });

  it('moves to the first unfinished mission when the remembered one is complete', () => {
    const progress: ProgressState = {
      version: 1,
      lessons: {
        'lesson-01': {
          completedStepIds: [],
          quizPassed: true,
          completed: true,
        },
      },
      totalXp: 100,
      lastLessonSlug: 'znaiomstvo-z-arcade',
    };

    render(<ProgressSummary campaigns={curriculum} progress={progress} />);

    expect(screen.getByRole('link', {
      name: /Продовжити.*Мій перший спрайт/,
    })).toHaveAttribute('href', '#/lesson/mii-pershyi-sprait');
  });

  it.each([
    ['normally', false, 'smooth'],
    ['without animation when reduced motion is requested', true, 'auto'],
  ] as const)('reveals and focuses the course map %s after every mission is complete', async (
    _caseName,
    reducedMotion,
    expectedBehavior,
  ) => {
    window.history.replaceState(null, '', '#/');
    const completedLessons = Object.fromEntries(
      curriculum.flatMap((campaign) => campaign.lessons).map((lesson) => [
        lesson.id,
        {
          completedStepIds: lesson.steps.map((step) => step.id),
          quizPassed: true,
          completed: true,
        },
      ]),
    );
    const progress: ProgressState = {
      version: 1,
      lessons: completedLessons,
      totalXp: 5000,
      lastLessonSlug: 'moia-vlasna-hra',
    };

    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: reducedMotion }));
    const user = userEvent.setup();
    render(
      <>
        <ProgressSummary campaigns={curriculum} progress={progress} />
        <CourseMap campaigns={curriculum} progress={progress} />
      </>,
    );

    expect(screen.getByRole('heading', { name: 'Квест пройдено!' })).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Переглянути місії/ }));

    const mapHeading = screen.getByRole('heading', { name: 'Обери наступну місію' });
    expect(mapHeading).toHaveFocus();
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: expectedBehavior,
      block: 'start',
    });
    expect(window.location.hash).toBe('#/');
  });
});
