import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { createElement } from 'react';
import { campaign05 } from './campaign-05';
import { GuideVisual } from '../components/GuideVisual';

describe('campaign 05 accepted learning corrections', () => {
  it('C05-004: quantity experiments synchronize the repeat and score target', () => {
    const challenge = campaign05.lessons[0]!.challenge;
    expect(challenge.prompt + challenge.hint).toMatch(/repeat.*score.*level \* 2/);
    expect(challenge.hint).toMatch(/ворог.*не залиш/);
  });
  it('C05-005: the arena starts in a named new project and preserves the earlier game', () => {
    expect(campaign05.lessons[1]!.steps[0]!.instruction).toMatch(/^Створи новий проєкт «Розумні супротивники».*попередн.*Створи tilemap/);
  });
  it('C05-010: seven separate checks precede a distinct record-and-retest note', () => {
    const visual = campaign05.lessons[2]!.steps[5]!.visual;
    if (visual.kind !== 'guide') throw Error('Expected guide');
    render(createElement(GuideVisual, { visual }));
    const list = screen.getByRole('list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(7);
    for (const item of within(list).getAllByRole('listitem')) expect(item.textContent).not.toMatch(/^\d+[.]/);
    const note = screen.getByText(/Запиши неточність/);
    expect(list).not.toContainElement(note);
  });
  it('C05-013: replay follows the visible A prompt after both outcomes', () => {
    const step = campaign05.lessons[3]!.steps[5]!;
    const text = JSON.stringify(step);
    expect(text).not.toContain('Play Again');
    expect(step.instruction).toMatch(/підказ.*A/);
    expect(step.visual).toMatchObject({ items: expect.arrayContaining([expect.stringMatching(/поразку.*підказ.*A/)]) });
  });
});
