import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../app/App';
import { lessons } from '../curriculum';
import type { Lesson } from '../curriculum/types';
import type { LessonProgress } from '../progress/schema';
import type { ProgressActions } from '../progress/useProgress';
import { LessonScreen } from './LessonScreen';

const lesson = lessons[0]!;

function createActions(): ProgressActions {
  return {
    markStepDone: vi.fn(),
    markQuizPassed: vi.fn(),
    finishLesson: vi.fn(),
    rememberLesson: vi.fn(),
  };
}

function createProgress(
  overrides: Partial<LessonProgress> = {},
): LessonProgress {
  return {
    completedStepIds: [],
    quizPassed: false,
    completed: false,
    ...overrides,
  };
}

function renderLesson({
  activeLesson = lesson,
  progress = createProgress(),
  actions = createActions(),
  storageAvailable = true,
  onCompleted = vi.fn(),
}: {
  activeLesson?: Lesson;
  progress?: LessonProgress;
  actions?: ProgressActions;
  storageAvailable?: boolean;
  onCompleted?: (completedLesson: Lesson) => void;
} = {}) {
  const onHome = vi.fn();
  const view = render(
    <LessonScreen
      lesson={activeLesson}
      lessonProgress={progress}
      actions={actions}
      storageAvailable={storageAvailable}
      onHome={onHome}
      onCompleted={onCompleted}
    />,
  );

  return { ...view, actions, onHome, onCompleted };
}

async function openQuiz(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getByRole('button', {
      name: 'Випробування виконано — до мінітесту',
    }),
  );
}

describe('LessonScreen', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.location.hash = '#/';
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('puts the objective before the practical work and links safely to MakeCode', () => {
    renderLesson();

    const objective = screen.getByText(lesson.objective);
    const stepHeading = screen.getByRole('heading', {
      name: lesson.steps[0]!.title,
    });
    const makeCodeLink = screen.getByRole('link', {
      name: /Відкрити MakeCode/,
    });

    expect(
      objective.compareDocumentPosition(stepHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(makeCodeLink).toHaveAttribute('href', lesson.makeCodeUrl);
    expect(makeCodeLink).toHaveAttribute('target', '_blank');
    expect(makeCodeLink).toHaveAttribute('rel', 'noreferrer noopener');
  });

  it('remembers the lesson once on mount without repeating on a normal rerender', () => {
    const actions = createActions();
    const view = renderLesson({ actions });

    expect(actions.rememberLesson).toHaveBeenCalledTimes(1);
    expect(actions.rememberLesson).toHaveBeenCalledWith(lesson.slug);

    view.rerender(
      <LessonScreen
        lesson={lesson}
        lessonProgress={createProgress()}
        actions={actions}
        storageAvailable={true}
        onHome={view.onHome}
      />,
    );

    expect(actions.rememberLesson).toHaveBeenCalledTimes(1);
  });

  it('places a visual between the instruction and expected result in every first-lesson step', () => {
    lesson.steps.forEach((step, index) => {
      const view = renderLesson({ progress: createProgress({ completedStepIds: lesson.steps.slice(0, index).map(({ id }) => id) }) });
      const instruction = screen.getByText(step.instruction);
      const visual = view.container.querySelector('.step-visual');
      expect(visual).toBeInTheDocument();
      expect(instruction.compareDocumentPosition(visual!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(visual!.compareDocumentPosition(screen.getByText(step.expected)) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      view.unmount();
    });
  });

  it('marks one step done, advances once, and exposes completed-step navigation', async () => {
    const user = userEvent.setup();
    const { actions } = renderLesson();

    await user.click(
      screen.getByRole('button', { name: 'Крок готовий — далі' }),
    );

    expect(actions.markStepDone).toHaveBeenCalledTimes(1);
    expect(actions.markStepDone).toHaveBeenCalledWith(
      lesson.id,
      lesson.steps[0]!.id,
    );
    expect(
      screen.getByRole('heading', { name: lesson.steps[1]!.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: `Крок 2: ${lesson.steps[1]!.title}`,
      }),
    ).toHaveAttribute('aria-current', 'step');

    await user.click(
      screen.getByRole('button', {
        name: `Крок 1: ${lesson.steps[0]!.title}. Виконано`,
      }),
    );

    expect(
      screen.getByRole('heading', { name: lesson.steps[0]!.title }),
    ).toBeInTheDocument();
  });

  it('keeps a practical hint hidden until the learner asks for it', async () => {
    const user = userEvent.setup();
    const hintedStepIndex = lesson.steps.findIndex((step) => step.hint);
    const hintedStep = lesson.steps[hintedStepIndex]!;
    const earlierStepIds = lesson.steps
      .slice(0, hintedStepIndex)
      .map((step) => step.id);

    renderLesson({
      progress: createProgress({ completedStepIds: earlierStepIds }),
    });

    expect(screen.queryByText(hintedStep.hint!)).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Показати підказку до кроку' }),
    );

    expect(screen.getByText(hintedStep.hint!)).toBeVisible();
  });

  it('reveals the independent challenge only after all practical steps', async () => {
    const user = userEvent.setup();
    const { actions } = renderLesson();

    expect(screen.queryByText(lesson.challenge.prompt)).not.toBeInTheDocument();

    for (let index = 0; index < lesson.steps.length; index += 1) {
      const label = index === lesson.steps.length - 1
        ? 'Кроки готові — до випробування'
        : 'Крок готовий — далі';
      await user.click(screen.getByRole('button', { name: label }));
    }

    expect(actions.markStepDone).toHaveBeenCalledTimes(lesson.steps.length);
    expect(
      screen.getByRole('heading', { name: lesson.challenge.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(lesson.challenge.prompt)).toBeVisible();
    expect(screen.queryByText(lesson.quiz.question)).not.toBeInTheDocument();
  });

  it('keeps the challenge hint hidden and then opens the quiz', async () => {
    const user = userEvent.setup();
    renderLesson({
      progress: createProgress({
        completedStepIds: lesson.steps.map((step) => step.id),
      }),
    });

    expect(screen.queryByText(lesson.challenge.hint!)).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', {
        name: 'Показати підказку до випробування',
      }),
    );
    expect(screen.getByText(lesson.challenge.hint!)).toBeVisible();

    await openQuiz(user);
    expect(screen.getByText(lesson.quiz.question)).toBeVisible();
  });

  it('explains a wrong quiz answer, allows a retry, and never completes it', async () => {
    const user = userEvent.setup();
    const actions = createActions();
    renderLesson({
      progress: createProgress({
        completedStepIds: lesson.steps.map((step) => step.id),
      }),
      actions,
    });
    await openQuiz(user);

    const wrongIndex = lesson.quiz.correctIndex === 0 ? 1 : 0;
    const wrongOption = screen.getByRole('radio', {
      name: lesson.quiz.options[wrongIndex],
    });
    await user.click(wrongOption);
    await user.click(screen.getByRole('button', { name: 'Перевірити відповідь' }));

    expect(screen.getByText(lesson.quiz.explanation)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Спробувати ще раз' })).toBeEnabled();
    expect(wrongOption).toBeEnabled();
    expect(actions.markQuizPassed).not.toHaveBeenCalled();
    expect(actions.finishLesson).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('button', { name: 'Завершити місію' }),
    ).not.toBeInTheDocument();
  });

  it('explains a correct answer and offers one completion action', async () => {
    const user = userEvent.setup();
    const actions = createActions();
    renderLesson({
      progress: createProgress({
        completedStepIds: lesson.steps.map((step) => step.id),
      }),
      actions,
    });
    await openQuiz(user);

    await user.click(
      screen.getByRole('radio', {
        name: lesson.quiz.options[lesson.quiz.correctIndex],
      }),
    );
    await user.click(screen.getByRole('button', { name: 'Перевірити відповідь' }));

    expect(screen.getByText(lesson.quiz.explanation)).toBeVisible();
    expect(actions.markQuizPassed).toHaveBeenCalledTimes(1);
    expect(
      screen.getAllByRole('button', { name: 'Завершити місію' }),
    ).toHaveLength(1);

    await user.click(
      screen.getByRole('button', { name: 'Завершити місію' }),
    );

    expect(actions.finishLesson).toHaveBeenCalledTimes(1);
    expect(actions.finishLesson).toHaveBeenCalledWith(
      lesson.id,
      lesson.slug,
      lesson.xp,
    );
    expect(
      screen.queryByRole('button', { name: 'Завершити місію' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(`+${lesson.xp} XP`)).toBeVisible();
  });

  it('emits completion once, only after explicit finish and after the progress action', async () => {
    const callOrder: string[] = [];
    const actions = createActions();
    vi.mocked(actions.finishLesson).mockImplementation(() => {
      callOrder.push('finishLesson');
    });
    const onCompleted = vi.fn((_completedLesson: Lesson) => {
      callOrder.push('onCompleted');
    });
    const user = userEvent.setup();
    renderLesson({
      progress: createProgress({
        completedStepIds: lesson.steps.map((step) => step.id),
      }),
      actions,
      onCompleted,
    });
    await openQuiz(user);

    await user.click(
      screen.getByRole('radio', {
        name: lesson.quiz.options[lesson.quiz.correctIndex],
      }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Перевірити відповідь' }),
    );

    expect(actions.markQuizPassed).toHaveBeenCalledTimes(1);
    expect(actions.finishLesson).not.toHaveBeenCalled();
    expect(onCompleted).not.toHaveBeenCalled();

    const finishButton = screen.getByRole('button', {
      name: 'Завершити місію',
    });
    act(() => {
      finishButton.click();
      finishButton.click();
    });

    expect(actions.finishLesson).toHaveBeenCalledTimes(1);
    expect(actions.finishLesson).toHaveBeenCalledWith(
      lesson.id,
      lesson.slug,
      lesson.xp,
    );
    expect(onCompleted).toHaveBeenCalledTimes(1);
    expect(onCompleted).toHaveBeenCalledWith(lesson);
    expect(callOrder).toEqual(['finishLesson', 'onCompleted']);
  });

  it('resumes a passed quiz at one completion action without passing it again', async () => {
    const user = userEvent.setup();
    const actions = createActions();
    renderLesson({
      progress: createProgress({
        completedStepIds: lesson.steps.map((step) => step.id),
        quizPassed: true,
      }),
      actions,
    });

    expect(screen.getByText(lesson.quiz.question)).toBeVisible();
    expect(screen.getByText(lesson.quiz.explanation)).toBeVisible();
    expect(
      screen.getAllByRole('button', { name: 'Завершити місію' }),
    ).toHaveLength(1);
    expect(actions.markQuizPassed).not.toHaveBeenCalled();
    expect(actions.finishLesson).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole('button', { name: 'Завершити місію' }),
    );

    expect(actions.markQuizPassed).not.toHaveBeenCalled();
    expect(actions.finishLesson).toHaveBeenCalledTimes(1);
    expect(actions.finishLesson).toHaveBeenCalledWith(
      lesson.id,
      lesson.slug,
      lesson.xp,
    );
  });

  it('lets a learner review completed steps and return to the completion summary without changing progress', async () => {
    const user = userEvent.setup();
    const actions = createActions();
    renderLesson({
      progress: createProgress({
        completedStepIds: lesson.steps.map((step) => step.id),
        quizPassed: true,
        completed: true,
      }),
      actions,
    });

    expect(
      screen.getByRole('heading', { name: 'Супер! Нова навичка твоя.' }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', {
        name: `Крок 2: ${lesson.steps[1]!.title}. Виконано`,
      }),
    );

    expect(
      screen.getByRole('heading', { name: lesson.steps[1]!.title }),
    ).toBeInTheDocument();
    expect(screen.getByText('Режим перегляду')).toBeVisible();
    expect(screen.getByRole('img')).toBeVisible();
    expect(
      screen.getByText('Прогрес і XP не зміняться.'),
    ).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Наступний крок' }));

    expect(
      screen.getByRole('heading', { name: lesson.steps[2]!.title }),
    ).toBeInTheDocument();
    expect(actions.markStepDone).not.toHaveBeenCalled();
    expect(actions.markQuizPassed).not.toHaveBeenCalled();
    expect(actions.finishLesson).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole('button', { name: 'До підсумку місії' }),
    );

    expect(
      screen.getByRole('heading', { name: 'Супер! Нова навичка твоя.' }),
    ).toBeInTheDocument();
    expect(actions.markStepDone).not.toHaveBeenCalled();
    expect(actions.markQuizPassed).not.toHaveBeenCalled();
    expect(actions.finishLesson).not.toHaveBeenCalled();
  });
});

describe('lesson routing', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    window.location.hash = '#/';
  });

  it('renders a known lesson route with the shared footer', async () => {
    window.location.hash = `#/lesson/${lesson.slug}`;

    render(<App />);

    expect(
      await screen.findByRole('heading', { name: lesson.title, level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'КодКвест — незалежний навчальний проєкт. Microsoft MakeCode є продуктом Microsoft.',
      ),
    ).toBeInTheDocument();
  });

  it('renders a helpful not-found route with a way back to the map', () => {
    window.location.hash = '#/lesson/nevidoma-misiia';

    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Місії не знайдено' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Повернутися до мапи' }),
    ).toHaveAttribute('href', '#/');
    expect(
      screen.getByText(
        'КодКвест — незалежний навчальний проєкт. Microsoft MakeCode є продуктом Microsoft.',
      ),
    ).toBeInTheDocument();
  });
});
