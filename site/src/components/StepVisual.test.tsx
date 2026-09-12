import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { campaign02 } from '../curriculum/campaign-02';
import { campaign06 } from '../curriculum/campaign-06';
import { lessonVisualAssets } from '../lesson-visuals/generated-assets';
import type { BlocksStepVisual, EditorStepVisual } from '../lesson-visuals/types';
import { StepVisual } from './StepVisual';

const blocks: BlocksStepVisual = {
  kind: 'blocks', assetId: 'blocks:lesson-01-step-04', alt: 'Блок зміни тла всередині запуску.',
  explanation: 'На початку гри блок змінює тло.',
  focus: { x: 0.1, y: 0.2, width: 0.7, height: 0.5, label: 'Встав блок у on start' },
};
const editor: EditorStepVisual = {
  ...blocks, kind: 'editor', assetId: 'editor:blocks-workspace',
  alt: 'Редактор із панеллю категорій.', focus: { ...blocks.focus, label: 'Відкрий Sprites' },
};
const source = 'if score > 0:\n    game.splash("<b>Привіт</b>")\n';

afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe('StepVisual', () => {
  it('C01 follow-up: enlarged action and explanation remain outside the image panning region', async () => {
    const user = userEvent.setup();
    render(<StepVisual visual={editor} />);
    await user.click(screen.getByRole('button', { name: 'Відкрити крупніше' }));
    const dialog = screen.getByRole('dialog');
    const region = within(dialog).getByRole('region', { name: /Збільшене зображення/ });
    expect(within(region).getByRole('img')).toBeVisible();
    expect(within(region).queryByText(editor.focus.label)).not.toBeInTheDocument();
    expect(within(region).queryByText(editor.explanation)).not.toBeInTheDocument();
    expect(within(dialog).getByText(editor.focus.label)).toBeVisible();
    expect(within(dialog).getByText(editor.explanation)).toBeVisible();
  });

  it('C06-002: comparisons offer a keyboard-scrollable focused native preview and the full image', () => {
    const visual = campaign06.lessons[0]!.steps[1]!.visual;
    render(<StepVisual visual={visual} />);
    expect(screen.getByRole('region', { name: 'Виділені блоки у читабельному розмірі' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('button', { name: 'Відкрити крупніше' })).toBeVisible();
  });
  it.each([0, 1, 2])('C06 atlas: selects only logical editor panel %i inline and enlarged', async (sourcePanel) => {
    const user = userEvent.setup();
    // Passing the fixture through a variable keeps this RED executable before the descriptor gains the option.
    const visual = { ...editor, assetId: 'editor:tilemap-editor', sourcePanel };
    const { container } = render(<StepVisual visual={visual} />);
    expect(container.querySelector('.visual-editor-panel')).not.toBeNull();
    expect(screen.getByRole('img')).toHaveStyle({ top: `${-100 * sourcePanel}%` });
    await user.click(screen.getByRole('button', { name: 'Відкрити крупніше' }));
    expect(within(screen.getByRole('dialog')).getByRole('img')).toHaveStyle({ top: `${-100 * sourcePanel}%` });
    expect(screen.getByRole('dialog').querySelectorAll('.visual-focus')).toHaveLength(1);
  });
  it.each([-1, 0.5, 3])('C06 atlas: rejects unavailable source panel %s instead of showing adjacent content', sourcePanel => {
    render(<StepVisual visual={{ ...editor, assetId: 'editor:tilemap-editor', sourcePanel }} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText(editor.alt)).toBeVisible();
  });
  it.each([false, true])('C04-004: isolates background and restores its previous inert state (%s)', async (previous) => {
    const user = userEvent.setup();
    const { container } = render(<StepVisual visual={blocks} />);
    const sibling = document.createElement('aside');
    if (previous) sibling.setAttribute('inert', '');
    document.body.append(sibling);
    const opener = screen.getByRole('button', { name: 'Відкрити крупніше' });
    await user.click(opener);
    expect(container).toHaveAttribute('inert');
    expect(sibling).toHaveAttribute('inert');
    expect(screen.getByRole('dialog').closest('.visual-lightbox-backdrop')).not.toHaveAttribute('inert');
    await user.keyboard('{Escape}');
    expect(container).not.toHaveAttribute('inert');
    expect(sibling.hasAttribute('inert')).toBe(previous);
    expect(opener).toHaveFocus();
    sibling.remove();
  });

  it('C04-005/C04-007: separated additions each get their own outline and readable callout', async () => {
    const extra = { x: 0.8, y: 0.1, width: 0.1, height: 0.2, label: 'Додай окрему подію' };
    const user = userEvent.setup();
    const visual = { ...blocks, additionalFocus: [extra] };
    const { container } = render(<StepVisual visual={visual} />);
    expect(container.querySelectorAll('.visual-focus')).toHaveLength(2);
    expect(screen.getByText(extra.label)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Відкрити крупніше' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog.querySelectorAll('.visual-focus')).toHaveLength(2);
    expect(within(dialog).getByText(extra.label)).toBeVisible();
  });

  it.each([blocks, editor])('C01-003: $kind uses an appropriate action in the figure and enlargement', async (visual) => {
    const user = userEvent.setup();
    render(<StepVisual visual={visual} />);
    const badge = visual.kind === 'editor' ? 'Зроби зараз' : 'Додай зараз';
    expect(screen.getByText(badge)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Відкрити крупніше' }));
    expect(within(screen.getByRole('dialog')).getByText(badge)).toBeVisible();
    expect(within(screen.getByRole('dialog')).getByText(visual.focus.label)).toBeVisible();
  });

  it('C02-002: lesson 5 verification uses a verification action inline and enlarged', async () => {
    const user = userEvent.setup();
    const visual = campaign02.lessons.find(({ id }) => id === 'lesson-05')
      ?.steps.find(({ id }) => id === 'lesson-05-step-06')?.visual;
    expect(visual).toBeDefined();
    if (!visual) throw new Error('Expected lesson-05-step-06 visual');
    const { container } = render(<StepVisual visual={visual} />);
    const figure = container.querySelector('.visual-figure');
    expect(figure).not.toBeNull();
    expect(within(figure as HTMLElement).getByText('Перевір зараз')).toBeVisible();
    expect(within(figure as HTMLElement).queryByText('Додай зараз')).not.toBeInTheDocument();

    await user.click(within(figure as HTMLElement).getByRole('button', { name: 'Відкрити крупніше' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Перевір зараз')).toBeVisible();
    expect(within(dialog).queryByText('Додай зараз')).not.toBeInTheDocument();
  });

  it('shows committed blocks, text explanation and normalized focus', () => {
    const { container } = render(<StepVisual visual={blocks} eager />);
    expect(screen.getByRole('img', { name: blocks.alt })).toHaveAttribute('src', lessonVisualAssets['blocks:lesson-01-step-04'].src);
    expect(screen.getByRole('img')).toHaveAttribute('loading', 'eager');
    expect(screen.getByRole('img')).toHaveAttribute('decoding', 'async');
    expect(screen.getByText(blocks.explanation)).toBeVisible();
    expect(screen.getByText('Додай зараз')).toBeVisible();
    expect(screen.getByText(blocks.focus.label)).toBeVisible();
    expect(container.querySelector('.visual-focus')).toHaveStyle({ left: '10%', top: '20%', width: '70%', height: '50%' });
  });

  it('loads editor screenshots lazily with a step-specific callout', () => {
    render(<StepVisual visual={editor} eager />);
    expect(screen.getByRole('img')).toHaveAttribute('loading', 'lazy');
    expect(screen.getByText('Відкрий Sprites')).toBeVisible();
  });

  it('shows exact code safely, copies it and announces success for two seconds', async () => {
    vi.useFakeTimers();
    userEvent.setup();
    let clipboardText = '';
    vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(async (value) => { clipboardText = value; });
    const { container } = render(<StepVisual visual={{ kind: 'python', label: 'Спробуй Python', code: source, explanation: 'Привітання у грі.' }} />);
    expect(container.querySelector('code')?.textContent).toBe(source);
    expect(container.querySelector('code b')).toBeNull();
    expect(container.querySelector('[data-token="keyword"]')).toHaveTextContent('if');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Копіювати код' })); });
    expect(clipboardText).toBe(source);
    expect(screen.getByRole('status')).toHaveTextContent('Скопійовано');
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByRole('button', { name: 'Копіювати код' })).toBeVisible();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('announces clipboard failure while keeping code available', async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));
    render(<StepVisual visual={{ kind: 'python', label: 'Код', code: source, explanation: 'Пояснення.' }} />);
    await user.click(screen.getByRole('button', { name: 'Копіювати код' }));
    expect(screen.getByRole('status')).toHaveTextContent('Не вдалося скопіювати');
    expect(screen.getByRole('button', { name: 'Копіювати код' })).toBeEnabled();
  });

  it('puts blocks before Python in a comparison', () => {
    render(<StepVisual visual={{ kind: 'comparison', blocks, python: { label: 'Той самий код', code: source }, explanation: 'Два способи змінити гру.' }} />);
    const first = screen.getByRole('heading', { name: 'Блоки' });
    const second = screen.getByRole('heading', { name: 'Python' });
    expect(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText('Два способи змінити гру.')).toBeVisible();
  });

  it('renders a guide as an ordered list', () => {
    render(<StepVisual visual={{ kind: 'guide', title: 'Перевір гру', items: ['Запусти гру', 'Перевір тло'] }} />);
    const list = screen.getByRole('list');
    expect(list.tagName).toBe('OL');
    expect(within(list).getAllByRole('listitem').map((item) => item.textContent)).toEqual(['Запусти гру', 'Перевір тло']);
  });

  it('falls back to alt and explanation without removing instructions', () => {
    render(<><p>Зміни колір тла.</p><StepVisual visual={blocks} /></>);
    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByText(blocks.alt)).toBeVisible();
    expect(screen.getByText(blocks.explanation)).toBeVisible();
    expect(screen.getByText('Зміни колір тла.')).toBeVisible();
  });

  it('does not use unknown asset IDs as image URLs', () => {
    render(<StepVisual visual={{ ...blocks, assetId: 'https://example.org/unsafe.svg' }} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText(blocks.alt)).toBeVisible();
  });

  it('opens a modal, traps keyboard focus, closes on Escape and restores focus and scrolling', async () => {
    const user = userEvent.setup();
    document.body.style.overflow = 'auto';
    render(<StepVisual visual={blocks} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const opener = screen.getByRole('button', { name: 'Відкрити крупніше' });
    await user.click(opener);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    const close = within(dialog).getByRole('button', { name: 'Закрити' });
    expect(close).toHaveFocus();
    expect(document.body.style.overflow).toBe('hidden');
    await user.tab({ shift: true });
    expect(dialog.contains(document.activeElement)).toBe(true);
    await user.tab();
    expect(close).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
    expect(document.body.style.overflow).toBe('auto');
    await user.click(opener);
    await user.click(screen.getByRole('button', { name: 'Закрити' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});
