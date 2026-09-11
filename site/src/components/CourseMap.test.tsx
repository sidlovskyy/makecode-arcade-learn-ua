import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
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

afterEach(cleanup);

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
});
