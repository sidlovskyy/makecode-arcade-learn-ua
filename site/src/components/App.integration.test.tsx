import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../app/App';
import { curriculum } from '../curriculum';

async function reachFirstLessonFinish(user: ReturnType<typeof userEvent.setup>) {
  for (let step = 0; step < 5; step += 1) {
    await user.click(
      screen.getByRole('button', { name: 'Крок готовий — далі' }),
    );
  }

  await user.click(
    screen.getByRole('button', {
      name: 'Кроки готові — до випробування',
    }),
  );
  await user.click(
    screen.getByRole('button', {
      name: 'Випробування виконано — до мінітесту',
    }),
  );
  await user.click(
    screen.getByRole('radio', {
      name: 'Щоб одразу запускати й перевіряти гру',
    }),
  );
  await user.click(
    screen.getByRole('button', { name: 'Перевірити відповідь' }),
  );
}

async function finishFirstLesson(user: ReturnType<typeof userEvent.setup>) {
  await reachFirstLessonFinish(user);
  await user.click(
    screen.getByRole('button', { name: 'Завершити місію' }),
  );
}

describe('App progress feedback', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState(
      null,
      '',
      '#/lesson/znaiomstvo-z-arcade',
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    window.localStorage.clear();
    window.history.replaceState(null, '', '#/');
  });

  it.each([
    ['vid-blokiv-do-kodu', 'vid-blokiv-do-python', 'lesson-21', 'Від блоків до Python'],
    ['typescript-u-hri', 'python-u-hri', 'lesson-22', 'Python у грі'],
  ])('resumes saved legacy %s from home before any lesson route canonicalizes it', async (legacy, canonical, id, title) => {
    const stored = {
      version: 1,
      lessons: {
        'lesson-01': { completedStepIds: ['lesson-01-step-01'], quizPassed: false, completed: false },
        [id]: { completedStepIds: [`${id}-step-01`, `${id}-step-02`], quizPassed: false, completed: false },
      },
      totalXp: 0,
      lastLessonSlug: legacy,
    };
    const serialized = JSON.stringify(stored);
    window.localStorage.setItem('kodkvest.progress.v1', serialized);
    window.history.replaceState(null, '', '#/');
    const user = userEvent.setup();
    render(<App />);

    const resume = screen.getByRole('link', { name: /^Продовжити/ });
    expect(resume).toHaveAttribute('href', `#/lesson/${canonical}`);
    expect(resume).toHaveAccessibleName(new RegExp(title));
    expect(window.localStorage.getItem('kodkvest.progress.v1')).toBe(serialized);

    await user.click(resume);
    expect(await screen.findByRole('heading', { name: title, level: 1 })).toBeVisible();
    expect(screen.getByText('Крок 3 із 6')).toBeVisible();
    expect(JSON.parse(window.localStorage.getItem('kodkvest.progress.v1')!)).toEqual({ ...stored, lastLessonSlug: canonical });
  });

  it.each([
    ['vid-blokiv-do-kodu', 'vid-blokiv-do-python', 'lesson-21', 'Від блоків до Python'],
    ['typescript-u-hri', 'python-u-hri', 'lesson-22', 'Python у грі'],
  ])('remembers the canonical slug from %s while keeping ID-keyed progress', async (legacy, canonical, id, title) => {
    const storedLessons = {
      [id]: { completedStepIds: [`${id}-step-01`, `${id}-step-02`], quizPassed: false, completed: false },
      'lesson-01': { completedStepIds: ['lesson-01-step-01'], quizPassed: true, completed: true },
    };
    window.localStorage.setItem('kodkvest.progress.v1', JSON.stringify({ version: 1, lessons: storedLessons, totalXp: 100, lastLessonSlug: legacy }));
    window.history.replaceState(null, '', `#/lesson/${legacy}`);
    const user = userEvent.setup();
    const view = render(<App />);
    expect(screen.getByRole('heading', { name: title, level: 1 })).toBeVisible();
    expect(screen.getByText('Крок 3 із 6')).toBeVisible();
    const remembered = JSON.parse(window.localStorage.getItem('kodkvest.progress.v1')!);
    expect(remembered).toEqual({ version: 1, lessons: storedLessons, totalXp: 100, lastLessonSlug: canonical });
    await user.click(screen.getByRole('button', { name: 'Крок готовий — далі' }));
    expect(screen.getByText('Крок 4 із 6')).toBeVisible();
    view.unmount();
    window.history.replaceState(null, '', `#/lesson/${canonical}`);
    render(<App />);
    expect(screen.getByText('Крок 4 із 6')).toBeVisible();
    expect(JSON.parse(window.localStorage.getItem('kodkvest.progress.v1')!).lessons[id].completedStepIds).toEqual([`${id}-step-01`, `${id}-step-02`, `${id}-step-03`]);
  });

  it.each([
    ['malformed JSON', '{broken'],
    [
      'an unsupported version',
      JSON.stringify({ version: 99, lessons: {}, totalXp: 0 }),
    ],
  ])('explains recovery from %s and saves new progress', async (_caseName, serialized) => {
    window.localStorage.setItem('kodkvest.progress.v1', serialized);
    window.history.replaceState(null, '', '#/');
    const user = userEvent.setup();
    render(<App />);

    const recoveryNotice = screen.getByRole('status', {
      name: 'Збережений прогрес не відновлено',
    });
    expect(recoveryNotice).toHaveTextContent(
      'Курс починається спочатку. Новий прогрес зберігатиметься у цьому браузері.',
    );

    await user.click(screen.getByRole('link', { name: /Почати квест/ }));
    await user.click(screen.getByRole('button', { name: 'Крок готовий — далі' }));

    expect(JSON.parse(window.localStorage.getItem('kodkvest.progress.v1')!)).toMatchObject({
      version: 1,
      lessons: {
        'lesson-01': {
          completedStepIds: ['lesson-01-step-01'],
        },
      },
    });
  });

  it('does not show a recovery notice on a true first visit', () => {
    window.history.replaceState(null, '', '#/');

    render(<App />);

    expect(
      screen.queryByRole('status', { name: 'Збережений прогрес не відновлено' }),
    ).not.toBeInTheDocument();
  });

  it('switches from recovery copy to unavailable-storage copy if a new save fails', async () => {
    window.localStorage.setItem('kodkvest.progress.v1', '{broken');
    window.history.replaceState(null, '', '#/');
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByText('Збережений прогрес не відновлено')).toBeVisible();

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    await user.click(screen.getByRole('link', { name: /Почати квест/ }));

    expect(await screen.findByText('Прогрес не зберігається')).toBeVisible();
    expect(screen.queryByText('Збережений прогрес не відновлено')).not.toBeInTheDocument();
  });

  it('keeps unfinished lesson 10 as resume after reviewing completed lesson 1', async () => {
    const firstLesson = curriculum[0]!.lessons[0]!;
    const stored = {
      version: 1,
      lessons: {
        [firstLesson.id]: {
          completedStepIds: firstLesson.steps.map((step) => step.id),
          quizPassed: true,
          completed: true,
        },
        'lesson-10': {
          completedStepIds: ['lesson-10-step-01'],
          quizPassed: false,
          completed: false,
        },
      },
      totalXp: 100,
      lastLessonSlug: 'rishennia-hry',
    };
    window.localStorage.setItem('kodkvest.progress.v1', JSON.stringify(stored));
    window.history.replaceState(null, '', '#/');
    const user = userEvent.setup();
    render(<App />);

    const initialResume = screen.getByRole('link', { name: /Продовжити/ });
    expect(initialResume).toHaveAttribute('href', '#/lesson/rishennia-hry');

    await user.click(initialResume);
    expect(await screen.findByText('Крок 2 із 6')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'До мапи курсу' }));
    await user.click(await screen.findByRole('link', {
      name: 'Місія 1: Знайомство з Arcade. Завершено',
    }));
    expect(await screen.findByRole('heading', {
      name: 'Знайомство з Arcade',
      level: 1,
    })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'До мапи курсу' }));

    const resumeAfterReview = await screen.findByRole('link', { name: /Продовжити/ });
    expect(resumeAfterReview).toHaveAttribute('href', '#/lesson/rishennia-hry');
    await user.click(resumeAfterReview);

    expect(await screen.findByText('Крок 2 із 6')).toBeVisible();
    expect(JSON.parse(window.localStorage.getItem('kodkvest.progress.v1')!)).toEqual(stored);
  });

  it('awards 100 XP for lesson 1, marks it complete, and restores that total', async () => {
    const user = userEvent.setup();
    const firstView = render(<App />);

    expect(screen.queryByText('Прогрес не зберігається')).not.toBeInTheDocument();

    await finishFirstLesson(user);

    const reward = screen.getByRole('status', {
      name: 'Нагорода за місію',
    });
    expect(within(reward).getByText('Знайомство з Arcade')).toBeVisible();
    expect(within(reward).getByText('+100 XP')).toBeVisible();
    expect(within(reward).queryByText('Нагорода рівня')).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /Повернутися до мапи/ }),
    );

    expect(
      await screen.findByRole('link', {
        name: 'Місія 1: Знайомство з Arcade. Завершено',
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('100 очок досвіду')).toHaveTextContent('100 XP');

    firstView.unmount();
    render(<App />);

    expect(
      screen.queryByRole('status', { name: 'Нагорода за місію' }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText('100 очок досвіду')).toHaveTextContent('100 XP');
    expect(
      screen.getByRole('link', {
        name: 'Місія 1: Знайомство з Arcade. Завершено',
      }),
    ).toBeInTheDocument();
  });

  it('shows the campaign reward only for the campaign final mission', async () => {
    window.localStorage.setItem(
      'kodkvest.progress.v1',
      JSON.stringify({
        version: 1,
        lessons: {
          'lesson-04': {
            completedStepIds: [
              'lesson-04-step-01',
              'lesson-04-step-02',
              'lesson-04-step-03',
              'lesson-04-step-04',
              'lesson-04-step-05',
              'lesson-04-step-06',
            ],
            quizPassed: true,
            completed: false,
          },
        },
        totalXp: 0,
        lastLessonSlug: 'pikselni-perehony',
      }),
    );
    window.history.replaceState(null, '', '#/lesson/pikselni-perehony');
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole('button', { name: 'Завершити місію' }),
    );

    const reward = screen.getByRole('status', {
      name: 'Нагорода за місію',
    });
    expect(within(reward).getByText('+150 XP')).toBeVisible();
    expect(within(reward).getByText('Нагорода рівня')).toBeVisible();
    expect(within(reward).getByText('Перший піксель')).toBeVisible();

    await user.click(
      within(reward).getByRole('button', {
        name: 'Закрити повідомлення про нагороду',
      }),
    );
    expect(reward).not.toBeInTheDocument();
  });

  it('keeps blocked-storage copy truthful through explicit completion', async () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText('Прогрес не зберігається')).toBeVisible();
    expect(
      screen.getByText(
        'Уроки працюють як завжди, але після закриття сторінки прогрес зникне.',
      ),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', {
        name: 'Знайомство з Arcade',
        level: 1,
      }),
    ).toBeInTheDocument();

    await reachFirstLessonFinish(user);

    expect(
      screen.queryByText('Прогрес збережеться у цьому браузері.'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        'XP буде зараховано для цієї сесії, але після закриття сторінки прогрес зникне.',
      ),
    ).toBeVisible();

    await user.click(
      screen.getByRole('button', { name: 'Завершити місію' }),
    );

    const reward = screen.getByRole('status', {
      name: 'Нагорода за місію',
    });
    expect(within(reward).getByText('+100 XP')).toBeVisible();
    expect(screen.getByText('Прогрес не зберігається')).toBeVisible();
    expect(
      screen.getByRole('heading', { name: 'Супер! Нова навичка твоя.' }),
    ).toBeInTheDocument();
  });

  it.each([
    ['home', '#/', /Від першого пікселя/],
    ['not-found', '#/nevidoma-storinka', 'Місії не знайдено'],
  ])('keeps the blocked-storage notice on the %s route', (_route, hash, headingName) => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    window.history.replaceState(null, '', hash);

    render(<App />);

    expect(screen.getByText('Прогрес не зберігається')).toBeVisible();
    expect(
      screen.getByRole('heading', { name: headingName }),
    ).toBeInTheDocument();
  });
});
