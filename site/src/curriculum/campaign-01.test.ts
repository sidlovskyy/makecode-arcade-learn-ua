import { describe, expect, it } from 'vitest';
import { campaign01 } from './campaign-01';

describe('campaign 01 accepted learning corrections', () => {
  it('C01-002: teaches New Project, a consistent name, then Create', () => {
    expect(campaign01.lessons[0]!.steps[0]!.instruction).toMatch(/New Project.*Моя перша гра.*Create/);
    expect(campaign01.lessons[0]!.steps[1]!.instruction).toMatch(/Перевір.*Моя перша гра/);
  });
  it('C01-008: explains that transparent initial art stays invisible until drawing', () => {
    const step = campaign01.lessons[1]!.steps[1]!;
    expect(step.expected).toMatch(/не видно.*прозор/);
    expect(step.visual).toMatchObject({ alt: expect.stringMatching(/прозор/), explanation: expect.stringMatching(/наступних кроках.*намалюєш/) });
  });
  it('C01-009: distinguishes the stored sprite from its Player kind', () => {
    expect(campaign01.lessons[1]!.steps[1]!.expected).toMatch(/змінна mySprite зберігає спрайт із kind Player.*категор/);
    expect(campaign01.lessons[1]!.steps[1]!.expected).not.toContain('змінна mySprite типу Player');
  });
  it('C01-011: teaches the round plus before the visible velocity fields', () => {
    expect(campaign01.lessons[2]!.steps[1]!.instruction).toMatch(/кругл.*\+.*праворуч.*vx.*vy.*100/);
  });
});
