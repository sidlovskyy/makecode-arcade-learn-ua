import { describe, expect, it } from 'vitest';
import { campaign06 } from './campaign-06';

describe('campaign six accepted learning corrections', () => {
  it('C06-003: the current win block is findable in the Python challenge', () => {
    expect(campaign06.lessons[0]!.challenge.hint).toContain('game.game_over(True)');
  });
  it.each([0, 1])('C06-004: lesson %i launches the project home', (index) => {
    expect(campaign06.lessons[index]!.makeCodeUrl).toBe('https://arcade.makecode.com/');
  });
  it('C06-006: the old wave is moved and replaced by exactly one four-enemy call', () => {
    const { prompt, hint } = campaign06.lessons[1]!.challenge;
    expect(prompt).toMatch(/Перенеси.*for speed in speeds.*start_wave\(speeds\)/);
    expect(prompt).toMatch(/Заміни.*одним викликом start_wave\(\[30, 45, 60, 75\]\)/);
    expect(hint).toMatch(/саме чотири вороги/);
    expect(hint).toContain('def start_wave(speeds: List[number]):');
  });
  it('C06-007: the existing third step teaches the required map before scene wiring', () => {
    const [map, scene] = campaign06.lessons[2]!.steps.slice(2, 4);
    expect(map!.visual).toMatchObject({ kind: 'editor', assetId: 'editor:tilemap-editor', sourcePanel: 1 });
    expect(map!.instruction).toMatch(/Assets.*Tilemap.*wide.*20.*8.*прозор.*нижній ряд/);
    expect(map!.expected).toContain('320×128');
    expect(scene!.instruction).toMatch(/вибір.*wide.*керування.*камер/);
    expect(scene!.visual).toMatchObject({ code: expect.stringContaining('tiles.set_current_tilemap(tilemap("wide"))') });
  });
  it('C06-008: win and loss replay use A or Z, with a separate simulator restart', () => {
    const lesson = campaign06.lessons[3]!;
    expect(JSON.stringify(lesson)).not.toContain('Play Again');
    for (const index of [1, 2, 3]) expect(JSON.stringify(lesson.steps[index])).toMatch(/A у симуляторі або клавішу Z/);
    expect(lesson.steps[3]!.instruction).toMatch(/кругл.*стрілк.*Restart/);
  });
  it('C06-010: Save teaches the visible Python editor', () => {
    expect(campaign06.lessons[3]!.steps[5]!.visual).toMatchObject({ kind: 'editor', assetId: 'editor:tilemap-editor', sourcePanel: 2, alt: expect.stringMatching(/Python.*Save/) });
    expect(JSON.stringify(campaign06.lessons[3]!.steps[5]!.visual)).not.toContain('відкрите подання Blocks');
  });
  it('C06-011: adult approval precedes dialog review, publication and copying the link', () => {
    const visual = campaign06.lessons[3]!.steps[6]!.visual;
    if (visual.kind !== 'guide') throw Error('Expected sharing checklist');
    const text = visual.items.join('\n');
    expect(text).toMatch(/погодження.*Share[\s\S]*діалозі.*назву[\s\S]*Share Project[\s\S]*Скопіюй.*посилання/);
  });
});
