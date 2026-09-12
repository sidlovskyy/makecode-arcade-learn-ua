import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
  it.each([blocks, editor])('C01-003: $kind uses an appropriate action in the figure and enlargement', async (visual) => {
    const user = userEvent.setup();
    render(<StepVisual visual={visual} />);
    const badge = visual.kind === 'editor' ? 'Зроби зараз' : 'Додай зараз';
    expect(screen.getByText(badge)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Відкрити крупніше' }));
    expect(within(screen.getByRole('dialog')).getByText(badge)).toBeVisible();
    expect(within(screen.getByRole('dialog')).getByText(visual.focus.label)).toBeVisible();
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
