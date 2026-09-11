import { act, cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
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

    const difficulty = screen.getByRole('combobox', { name: 'Складність' });
    await user.selectOptions(difficulty, 'master');

    expect(screen.getAllByRole('link', { name: /^Місія \d+:/ })).toHaveLength(8);

    await user.click(screen.getByRole('button', { name: 'Скинути фільтри' }));

    expect(difficulty).toHaveValue('all');
    expect(screen.getAllByRole('link', { name: /^Місія \d+:/ })).toHaveLength(24);
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

  it('offers the course map after every mission is complete', () => {
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

    render(<ProgressSummary campaigns={curriculum} progress={progress} />);

    expect(screen.getByRole('heading', { name: 'Квест пройдено!' })).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Переглянути місії/ })).toHaveAttribute(
      'href',
      '#/',
    );
  });
});
