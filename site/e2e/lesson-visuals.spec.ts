import { test as base, expect, type Page } from 'playwright/test';
import { lessons } from '../src/curriculum';
import type { ProgressState } from '../src/progress/schema';
import { readFile } from 'node:fs/promises';

const origin = 'http://127.0.0.1:4173';
const progressKey = 'kodkvest.progress.v1';

// A remote image, script, fetch or navigation is a runtime regression, even if
// the page still looks correct. Vite's development WebSocket must be local too.
const test = base.extend<{ localRuntime: void }>({
  localRuntime: [async ({ page, context }, use) => {
    const unexpected: string[] = [];
    const errors: string[] = [];
    await context.route('**/*', async (route) => {
      const url = route.request().url();
      if (new URL(url).origin !== origin) {
        unexpected.push(url);
        await route.abort();
      } else {
        await route.continue();
      }
    });
    page.on('websocket', (socket) => {
      if (new URL(socket.url()).origin !== 'ws://127.0.0.1:4173') unexpected.push(socket.url());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await use();
    expect(unexpected, 'Unexpected external runtime requests').toEqual([]);
    expect(errors, 'Browser runtime errors').toEqual([]);
  }, { auto: true }],
});

async function readProgress(page: Page): Promise<ProgressState> {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), progressKey);
}

async function expectNoOverflow(page: Page) {
  expect(await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }))).toEqual({ scroll: page.viewportSize()!.width, client: page.viewportSize()!.width });
}

async function continueStep(page: Page) {
  await page.locator('.lesson-step-actions .button--primary').click();
}

async function expectPhaseFocus(page: Page, selector: string) {
  const heading = page.locator(selector);
  await expect(heading).toBeFocused();
  const box = await heading.boundingBox();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
}

for (const [id, stepIndex] of [['lesson-13', 1], ['lesson-13', 2], ['lesson-14', 0], ['lesson-15', 4], ['lesson-15', 5], ['lesson-16', 0], ['lesson-16', 2]] as const) {
  test(`C04-001: ${id} step ${stepIndex + 1} initially reveals its target and preserves manual panning`, async ({ page }) => {
    const lesson = lessons.find(lesson => lesson.id === id)!;
    await page.goto(`/#/lesson/${lesson.slug}`);
    for (let i = 0; i < stepIndex; i++) await continueStep(page);
    const opener = page.getByRole('button', { name: 'Відкрити крупніше' });
    await opener.click();
    const region = page.locator('.visual-lightbox__scroll');
    await region.locator('img').evaluate((img: HTMLImageElement) => img.decode());
    await expect.poll(() => region.evaluate(element => {
      const target = element.querySelector('.visual-focus')!.getBoundingClientRect();
      const viewport = element.getBoundingClientRect();
      const width = Math.min(target.right, viewport.left + element.clientWidth) - Math.max(target.left, viewport.left);
      const height = Math.min(target.bottom, viewport.top + element.clientHeight) - Math.max(target.top, viewport.top);
      return width >= Math.min(target.width, element.clientWidth) - 3 && height >= Math.min(target.height, element.clientHeight) - 3;
    })).toBe(true);
    await region.focus();
    const before = await region.evaluate(element => ({ x: element.scrollLeft, canPan: element.scrollWidth > element.clientWidth }));
    if (before.canPan) {
      await page.keyboard.press(before.x > 0 ? 'ArrowLeft' : 'ArrowRight');
      await expect.poll(() => region.evaluate(element => element.scrollLeft)).not.toBe(before.x);
      await page.waitForTimeout(300); // Let native keyboard smooth scrolling finish before the independent manual-pan check.
      await region.evaluate(element => { element.scrollLeft = 0; });
      await page.waitForTimeout(200);
      expect(await region.evaluate(element => element.scrollLeft)).toBe(0);
    }
    await page.keyboard.press('Escape');
    await expect(opener).toBeFocused();
  });
}

test('C04-003/C04-004: current editor link disappears from the accessibility tree while enlarged', async ({ page, context }) => {
  await page.goto(`/#/lesson/${lessons.find(lesson => lesson.id === 'lesson-14')!.slug}`);
  const editor = page.getByRole('link', { name: /Відкрити MakeCode/ });
  await expect(editor).toHaveAttribute('href', 'https://arcade.makecode.com/');
  const client = await context.newCDPSession(page);
  const backgroundLinks = async () => (await client.send('Accessibility.getFullAXTree')).nodes.filter(node => !node.ignored && node.role?.value === 'link');
  const before = await backgroundLinks();
  expect(before.length).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Відкрити крупніше' }).click();
  expect(await backgroundLinks()).toEqual([]);
  await page.keyboard.press('Escape');
  expect((await backgroundLinks()).length).toBe(before.length);
});

for (const [id, stepIndex] of [['lesson-15', 1], ['lesson-16', 3], ['lesson-16', 4]] as const) {
  test(`C04-005/C04-007: ${id} step ${stepIndex + 1} exposes both separated additions for enlarged reading`, async ({ page }, testInfo) => {
    await page.goto(`/#/lesson/${lessons.find(lesson => lesson.id === id)!.slug}`);
    for (let i = 0; i < stepIndex; i++) await continueStep(page);
    await expect(page.locator('.visual-focus')).toHaveCount(2);
    await page.locator('.practical-step').screenshot({ path: testInfo.outputPath('separate-additions.png') });
    await page.getByRole('button', { name: 'Відкрити крупніше' }).click();
    const region = page.locator('.visual-lightbox__scroll');
    await region.locator('img').evaluate((image: HTMLImageElement) => image.decode());
    await expect(region.locator('.visual-focus')).toHaveCount(2);
    await expect(region.locator('.visual-callout')).toHaveCount(2);
    for (let i = 0; i < 2; i++) {
      // Manual pan to read each separate native addition at intrinsic size.
      await region.locator('.visual-focus').nth(i).evaluate(element => element.scrollIntoView({ block: 'start', inline: 'start' }));
      await region.screenshot({ path: testInfo.outputPath(`addition-${i + 1}.png`) });
    }
    await expectNoOverflow(page);
    await page.keyboard.press('Escape');
  });
}

for (const [id, stepIndex] of [['lesson-10', 4], ['lesson-11', 5], ['lesson-12', 4]] as const) {
  test(`C03-006/C03-010/C03-012: ${id} focus matches the regenerated native edit geometry`, async ({ page }) => {
    const visual = lessons.find((lesson) => lesson.id === id)!.steps[stepIndex].visual;
    if (visual.kind !== 'blocks') throw new Error('Expected block descriptor');
    const svg = await readFile(new URL(`../src/assets/lesson-visuals/blocks/${id}-step-0${stepIndex + 1}.svg`, import.meta.url), 'utf8');
    await page.goto(`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`);
    const geometry = await page.evaluate(({ id, focus }) => {
      const root = document.querySelector('svg')!;
      const inverse = root.getScreenCTM()!.inverse();
      const bounds = (element: Element) => {
        const rect = element.getBoundingClientRect();
        const a = new DOMPoint(rect.left, rect.top).matrixTransform(inverse);
        const b = new DOMPoint(rect.right, rect.bottom).matrixTransform(inverse);
        return { left: a.x, top: a.y, right: b.x, bottom: b.y };
      };
      const box = { left: focus.x * root.viewBox.baseVal.width, top: focus.y * root.viewBox.baseVal.height,
        right: (focus.x + focus.width) * root.viewBox.baseVal.width, bottom: (focus.y + focus.height) * root.viewBox.baseVal.height };
      const contains = (element: Element) => {
        const target = bounds(element);
        return box.left <= target.left + 1 && box.top <= target.top + 1 && box.right >= target.right - 1 && box.bottom >= target.bottom - 1;
      };
      if (id === 'lesson-10') {
        const wrapper = root.querySelector('g.controls_if > path.blocklyPath')!;
        const body = bounds(wrapper);
        return { contains: contains(wrapper), excludesShell: box.top >= body.top - 1 && box.bottom <= body.bottom + 1 };
      }
      if (id === 'lesson-11') {
        const field = [...root.querySelectorAll('text')].find((text) => text.textContent === '500')!;
        const firstChild = root.querySelector('g.gameinterval g.variables_set > path.blocklyPath')!;
        return { contains: contains(field), excludesShell: box.bottom < bounds(firstChild).top };
      }
      const conditions = root.querySelectorAll('g.controls_if > path.blocklyPath');
      const playerEvent = root.querySelectorAll('g.spritesoverlap > path.blocklyPath')[1];
      if (!conditions[1] || !playerEvent) throw new Error(JSON.stringify({ id, conditions: conditions.length, overlaps: root.querySelectorAll('g.spritesoverlap').length, root: root.outerHTML.slice(0, 200) }));
      return { contains: contains(conditions[1]) && contains(playerEvent), excludesShell: true };
    }, { id, focus: visual.focus });
    expect(geometry).toEqual({ contains: true, excludesShell: true });
  });
}

for (const id of ['lesson-09', 'lesson-10']) {
  test(`C03-002: ${id} active step remains fully visible on normal mobile continuation`, async ({ page }) => {
    test.skip(page.viewportSize()!.width !== 390, 'compact mobile strip');
    const lesson = lessons.find((lesson) => lesson.id === id)!;
    await page.goto(`/#/lesson/${lesson.slug}`);
    for (let i = 1; i < 6; i++) {
      await continueStep(page);
      await expect.poll(() => page.locator('.step-list').evaluate((list) => {
        const active = list.querySelector('[aria-current="step"]')!.getBoundingClientRect();
        const bounds = list.getBoundingClientRect();
        return active.left >= bounds.left - 1 && active.right <= bounds.right + 1;
      })).toBe(true);
    }
  });
}

test('C03-004/C03-007: lesson 10 transitions preserve focus and quiz controls distinguish native selection', async ({ page }) => {
  const lesson = lessons.find(({ id }) => id === 'lesson-10')!;
  await page.goto(`/#/lesson/${lesson.slug}`);
  for (let i = 0; i < 6; i++) {
    await continueStep(page);
    await expectPhaseFocus(page, i === 5 ? '#challenge-title' : '#practical-step-title');
  }
  await page.getByRole('button', { name: /Випробування виконано/ }).click();
  await expectPhaseFocus(page, '#quiz-title');
  const radios = page.getByRole('radio');
  await expect(radios).toHaveCount(3);
  await expect(page.locator('input[type="radio"]:checked')).toHaveCount(0);
  expect(await radios.first().evaluate((radio) => getComputedStyle(radio).colorScheme)).toBe('light');
  await page.locator('.quiz-option').first().click();
  await expect(radios.first()).toBeChecked();
  await expect(page.locator('input[type="radio"]:checked')).toHaveCount(1);
  await radios.first().focus();
  await page.keyboard.press('ArrowDown');
  await expect(radios.nth(1)).toBeChecked();
  await expect(page.locator('input[type="radio"]:checked')).toHaveCount(1);
  await page.getByRole('button', { name: 'Перевірити відповідь' }).click();
  await page.getByRole('button', { name: /Завершити місію/ }).click();
  await expectPhaseFocus(page, '#completion-title');
  await page.getByRole('navigation', { name: 'Кроки місії' }).getByRole('button').nth(4).click();
  await expectPhaseFocus(page, '#practical-step-title');
  await page.getByRole('button', { name: 'До підсумку місії' }).click();
  await expectPhaseFocus(page, '#completion-title');
});

for (const [id, stepIndex] of [['lesson-11', 2], ['lesson-11', 5], ['lesson-12', 1], ['lesson-12', 2], ['lesson-12', 4]] as const) {
  test(`C03-009: ${id} step ${stepIndex + 1} enlargement reveals the current change and retains manual control`, async ({ page }) => {
    const lesson = lessons.find((lesson) => lesson.id === id)!;
    await page.goto(`/#/lesson/${lesson.slug}`);
    for (let i = 0; i < stepIndex; i++) await continueStep(page);
    const opener = page.getByRole('button', { name: 'Відкрити крупніше' });
    await opener.click();
    const region = page.locator('.visual-lightbox__scroll');
    await region.locator('img').evaluate((image: HTMLImageElement) => image.decode());
    await expect.poll(() => region.evaluate((element) => {
      const focus = element.querySelector('.visual-focus')!.getBoundingClientRect();
      const bounds = element.getBoundingClientRect();
      return Math.min(focus.right, bounds.right) > Math.max(focus.left, bounds.left)
        && Math.min(focus.bottom, bounds.bottom) > Math.max(focus.top, bounds.top);
    })).toBe(true);
    await region.focus();
    const horizontal = await region.evaluate((element) => ({ before: element.scrollLeft, canPan: element.scrollWidth > element.clientWidth }));
    if (horizontal.canPan) {
      await page.keyboard.press(horizontal.before > 0 ? 'ArrowLeft' : 'ArrowRight');
      await expect.poll(() => region.evaluate((element) => element.scrollLeft)).not.toBe(horizontal.before);
    }
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(opener).toBeFocused();
  });
}

test('C01-004: actual step, Back, review and phase transitions reveal and focus their heading', async ({ page }) => {
  await page.goto('/#/lesson/znaiomstvo-z-arcade');
  await page.locator('.lesson-step-actions .button--primary').focus();
  await page.keyboard.press('Enter');
  await expectPhaseFocus(page, '#practical-step-title');
  await page.getByRole('button', { name: 'Назад', exact: true }).click();
  await expectPhaseFocus(page, '#practical-step-title');
  for (let i = 0; i < 6; i++) {
    await continueStep(page);
    await expectPhaseFocus(page, i === 5 ? '#challenge-title' : '#practical-step-title');
    if (i === 2) {
      const hint = page.getByRole('button', { name: 'Показати підказку до кроку' });
      await hint.click();
      await expect(page.getByRole('button', { name: 'Сховати підказку до кроку' })).toBeFocused();
    }
  }
  await page.getByRole('button', { name: /Випробування виконано/ }).click();
  await expectPhaseFocus(page, '#quiz-title');
  const quiz = lessons[0].quiz;
  await page.getByRole('radio', { name: quiz.options[quiz.correctIndex] }).check();
  await page.getByRole('button', { name: 'Перевірити відповідь' }).click();
  await page.getByRole('button', { name: /Завершити місію/ }).click();
  await expectPhaseFocus(page, '#completion-title');
  await page.getByRole('navigation', { name: 'Кроки місії' }).getByRole('button').nth(1).click();
  await expectPhaseFocus(page, '#practical-step-title');
  await page.getByRole('button', { name: 'Наступний крок' }).click();
  await expectPhaseFocus(page, '#practical-step-title');
  await page.getByRole('button', { name: 'До підсумку місії' }).click();
  await expectPhaseFocus(page, '#completion-title');
});

for (const lesson of lessons.slice(0, 4).filter(({ order }) => order === 2 || order === 4)) {
  test(`C01-012: ${lesson.id} active label remains within the compact strip after Continue and Back`, async ({ page }) => {
    test.skip(page.viewportSize()!.width !== 390, 'compact mobile strip');
    await page.goto(`/#/lesson/${lesson.slug}`);
    async function expectActiveVisible() {
      await expect.poll(() => page.locator('.step-list').evaluate(list => {
        const active = list.querySelector('[aria-current="step"]')!.getBoundingClientRect();
        const rect = list.getBoundingClientRect();
        return active.left >= rect.left - 1 && active.right <= rect.right + 1;
      })).toBe(true);
      await expectNoOverflow(page);
    }
    for (let i = 1; i < 6; i++) { await continueStep(page); await expectActiveVisible(); }
    for (let i = 5; i > 0; i--) { await page.getByRole('button', { name: 'Назад', exact: true }).click(); await expectActiveVisible(); }
  });
}

test('C01-007: six completed mobile steps retain their visible numbers in review', async ({ page }) => {
  test.skip(page.viewportSize()!.width !== 390, 'compact mobile strip');
  await page.goto('/#/lesson/mii-pershyi-sprait');
  for (let i = 0; i < 6; i++) await continueStep(page);
  await page.getByRole('navigation', { name: 'Кроки місії' }).getByRole('button').nth(3).click();
  const buttons = page.locator('.step-list button');
  for (let i = 0; i < 6; i++) {
    await expect(buttons.nth(i)).toHaveAccessibleName(/Виконано/);
    await expect(buttons.nth(i).locator('.step-list__marker')).toHaveText(String(i + 1));
    await expect(buttons.nth(i).locator('.step-list__marker')).toBeVisible();
  }
});

test('C02-001: campaign 2 completed mobile steps retain visible ordinals through review and reload', async ({ page }) => {
  test.skip(page.viewportSize()!.width !== 390, 'compact mobile strip');
  const lesson = lessons.find(({ id }) => id === 'lesson-05')!;
  await page.goto(`/#/lesson/${lesson.slug}`);
  for (let i = 0; i < lesson.steps.length; i++) await continueStep(page);
  await page.getByRole('button', { name: /Випробування виконано/ }).click();
  await page.getByRole('radio', { name: lesson.quiz.options[lesson.quiz.correctIndex] }).check();
  await page.getByRole('button', { name: 'Перевірити відповідь' }).click();
  await page.getByRole('button', { name: /Завершити місію/ }).click();
  await expectPhaseFocus(page, '#completion-title');

  const navigator = page.getByRole('navigation', { name: 'Кроки місії' });
  const buttons = navigator.getByRole('button');
  for (let i = 0; i < lesson.steps.length; i++) {
    const button = buttons.nth(i);
    await expect(button.locator('.step-list__marker')).toHaveText(String(i + 1));
    expect((await button.locator('.step-list__marker').boundingBox())!.width).toBeGreaterThan(0);
    expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }

  await buttons.nth(3).click();
  await expect(page.getByRole('heading', { level: 2, name: lesson.steps[3].title })).toBeFocused();
  await page.reload();
  await expect(page.locator('#completion-title')).toBeVisible();
  await page.getByRole('navigation', { name: 'Кроки місії' }).getByRole('button').nth(1).click();
  await expect(page.getByRole('heading', { level: 2, name: lesson.steps[1].title })).toBeFocused();

  const lesson6 = lessons.find(({ id }) => id === 'lesson-06')!;
  await page.goto(`/#/lesson/${lesson6.slug}`);
  for (let i = 0; i < 3; i++) await continueStep(page);
  const lesson6Buttons = page.getByRole('navigation', { name: 'Кроки місії' }).getByRole('button');
  for (let i = 0; i < 3; i++) {
    await expect(lesson6Buttons.nth(i).locator('.step-list__marker')).toHaveText(String(i + 1));
  }
  await lesson6Buttons.nth(0).click();
  await expect(page.getByRole('heading', { level: 2, name: lesson6.steps[0].title })).toBeFocused();
});

test('C02-004: lesson 6 transitions focus and reveal every new panel', async ({ page }) => {
  const lesson = lessons.find(({ id }) => id === 'lesson-06')!;
  await page.goto(`/#/lesson/${lesson.slug}`);
  for (let i = 0; i < lesson.steps.length; i++) {
    await page.locator('.lesson-step-actions .button--primary').scrollIntoViewIfNeeded();
    await continueStep(page);
    await expectPhaseFocus(page, i === lesson.steps.length - 1 ? '#challenge-title' : '#practical-step-title');
  }
  await page.getByRole('button', { name: /Випробування виконано/ }).click();
  await expectPhaseFocus(page, '#quiz-title');
  await page.getByRole('navigation', { name: 'Кроки місії' }).getByRole('button').nth(2).click();
  await expectPhaseFocus(page, '#practical-step-title');
  await page.getByRole('button', { name: 'Назад', exact: true }).click();
  await expectPhaseFocus(page, '#practical-step-title');
});

test('campaign 2 corrected challenge, project boundary and condition guidance render on mobile', async ({ page }) => {
  test.skip(page.viewportSize()!.width !== 390, 'mobile content confirmation');
  const lesson5 = lessons.find(({ id }) => id === 'lesson-05')!;
  await page.goto(`/#/lesson/${lesson5.slug}`);
  for (let i = 0; i < lesson5.steps.length; i++) await continueStep(page);
  await page.getByRole('button', { name: 'Показати підказку' }).click();
  const challengeHint = page.locator('.challenge-panel .hint-disclosure__content');
  await expect(challengeHint).toContainText('on A button pressed');
  await expect(challengeHint).toContainText('on B button pressed');
  await expect(challengeHint).toContainText('mySprite say');
  await expectNoOverflow(page);

  const lesson6 = lessons.find(({ id }) => id === 'lesson-06')!;
  await page.goto(`/#/lesson/${lesson6.slug}`);
  for (let i = 0; i < lesson6.steps.length; i++) await continueStep(page);
  await page.getByRole('button', { name: /Випробування виконано/ }).click();
  await page.getByRole('radio', { name: lesson6.quiz.options[lesson6.quiz.correctIndex] }).check();
  await page.getByRole('button', { name: 'Перевірити відповідь' }).click();
  await page.getByRole('button', { name: /Завершити місію/ }).click();
  await page.getByRole('button', { name: /Повернутися до мапи/ }).click();
  await page.getByRole('link', { name: /Місія 7: Рахунок, життя, час/ }).click();
  await expect(page.locator('.practical-step__instruction')).toContainText('Створи новий проєкт «Рахунок, життя, час».');

  for (let i = 0; i < 3; i++) await continueStep(page);
  await page.getByRole('button', { name: 'Показати підказку до кроку' }).click();
  await expect(page.locator('.hint-disclosure__content')).toContainText('0 = 0');
  await expect(page.locator('.hint-disclosure__content')).toContainText('game over WIN з Game');
  await expectNoOverflow(page);
});

for (const stepIndex of [2, 3, 4]) {
  test(`C02-007: lesson 8 step ${stepIndex + 1} enlargement initially reveals the active block`, async ({ page }) => {
    test.skip(page.viewportSize()!.width !== 390, 'mobile active-block reveal');
    const lesson = lessons.find(({ id }) => id === 'lesson-08')!;
    await page.goto(`/#/lesson/${lesson.slug}`);
    for (let i = 0; i < stepIndex; i++) await continueStep(page);
    const opener = page.getByRole('button', { name: 'Відкрити крупніше' });
    await opener.click();
    const region = page.locator('.visual-lightbox__scroll');
    const image = region.locator('img');
    await image.evaluate((element: HTMLImageElement) => element.decode());
    await expect.poll(() => region.evaluate((element) => {
      const focus = element.querySelector('.visual-focus')!.getBoundingClientRect();
      const viewport = element.getBoundingClientRect();
      return {
        leadingEdgeVisible: focus.left >= viewport.left - 3 && focus.left < viewport.right,
        horizontalVisible: Math.min(focus.right, viewport.right) - Math.max(focus.left, viewport.left) > 0,
        verticalVisible: Math.min(focus.bottom, viewport.bottom) - Math.max(focus.top, viewport.top) > 0,
      };
    })).toEqual({ leadingEdgeVisible: true, horizontalVisible: true, verticalVisible: true });
    const dimensions = await image.evaluate((element: HTMLImageElement) => ({
      renderedWidth: element.getBoundingClientRect().width,
      naturalWidth: element.naturalWidth,
    }));
    expect(dimensions.renderedWidth).toBeGreaterThanOrEqual(dimensions.naturalWidth - 1);
    const focusedScroll = await region.evaluate((element) => element.scrollLeft);
    if (stepIndex < 4) expect(focusedScroll).toBeGreaterThan(0);
    else expect(focusedScroll).toBe(0);
    await region.evaluate((element) => { element.scrollLeft = 0; });
    expect(await region.evaluate((element) => element.scrollLeft)).toBe(0);
    await region.focus();
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => region.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(opener).toBeFocused();
  });
}

for (const [lessonIndex, stepIndex] of [[0, 1], [0, 5], [1, 2], [1, 4], [1, 5], [3, 4]]) {
  const lesson = lessons[lessonIndex];
  test(`C01-005: ${lesson.steps[stepIndex].id} enlargement initially reveals the exact target`, async ({ page }, testInfo) => {
    test.skip(page.viewportSize()!.width === 1440, 'mobile/editor and mobile/tablet blocks');
    await page.goto(`/#/lesson/${lesson.slug}`);
    for (let i = 0; i < stepIndex; i++) await continueStep(page);
    const opener = page.getByRole('button', { name: 'Відкрити крупніше' });
    expect((await opener.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await expect(page.locator('.visual-callout span')).toBeVisible();
    await opener.click();
    const region = page.locator('.visual-lightbox__scroll');
    await region.locator('img').evaluate((img: HTMLImageElement) => img.decode());
    await expect.poll(() => region.evaluate(region => {
      const target = region.querySelector('.visual-focus')!.getBoundingClientRect();
      const rect = region.getBoundingClientRect();
      const width = Math.max(0, Math.min(target.right, rect.left + region.clientWidth) - Math.max(target.left, rect.left));
      const height = Math.max(0, Math.min(target.bottom, rect.top + region.clientHeight) - Math.max(target.top, rect.top));
      return width >= Math.min(target.width, region.clientWidth) - 3 && height >= Math.min(target.height, region.clientHeight) - 3;
    })).toBe(true);
    await region.screenshot({ path: testInfo.outputPath(`${lesson.steps[stepIndex].id}-focused-lightbox.png`) });
    if (lessonIndex === 3) expect(await region.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
    if (lessonIndex === 0 || (lessonIndex === 1 && stepIndex === 2)) expect(await region.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    await region.focus();
    const before = await region.evaluate(el => ({ x: el.scrollLeft, y: el.scrollTop }));
    await page.keyboard.press(before.x > 0 ? 'ArrowLeft' : 'ArrowRight');
    await expect.poll(() => region.evaluate(el => el.scrollLeft)).not.toBe(before.x);
    await expectNoOverflow(page);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(opener).toBeFocused();
    await expectNoOverflow(page);
  });
}

for (const lesson of lessons) {
  test(`${lesson.id}: every step renders its content and visual without clipping`, async ({ page }, testInfo) => {
    await page.goto(`/#/lesson/${lesson.slug}`);
    await expect(page.getByRole('heading', { level: 1, name: lesson.title, exact: true })).toBeVisible();
    for (const [index, step] of lesson.steps.entries()) {
      await test.step(step.id, async () => {
        // Exercise the real navigator as steps become available; do not seed
        // completed progress or bypass the learner's completion action.
        await page.getByRole('navigation', { name: 'Кроки місії' })
          .getByRole('button', { name: `Крок ${index + 1}: ${step.title}`, exact: true }).click();
        const card = page.locator('.practical-step');
        const visual = card.locator('.step-visual');
        await expect(card.getByRole('heading', { level: 2, name: step.title, exact: true })).toBeVisible();
        await expect(card.locator('.practical-step__instruction')).toHaveText(step.instruction);
        await expect(card.locator('.expected-result p')).toHaveText(step.expected);
        await expect(visual).toBeVisible();
        expect(await card.evaluate((element) => {
          const instruction = element.querySelector('.practical-step__instruction')!;
          const visual = element.querySelector('.step-visual')!;
          const expected = element.querySelector('.expected-result')!;
          return Boolean(instruction.compareDocumentPosition(visual) & Node.DOCUMENT_POSITION_FOLLOWING)
            && Boolean(visual.compareDocumentPosition(expected) & Node.DOCUMENT_POSITION_FOLLOWING);
        })).toBe(true);

        const descriptor = step.visual;
        if (descriptor.kind === 'blocks' || descriptor.kind === 'editor' || descriptor.kind === 'comparison') {
          const imageDescriptor = descriptor.kind === 'comparison' ? descriptor.blocks : descriptor;
          const image = visual.getByRole('img', { name: imageDescriptor.alt, exact: true });
          await image.scrollIntoViewIfNeeded();
          await expect.poll(() => image.evaluate((element: HTMLImageElement) =>
            element.complete && element.naturalWidth > 0 && element.naturalHeight > 0)).toBe(true);
          expect(new URL(await image.getAttribute('src') ?? '', origin).origin).toBe(origin);
          expect(await image.evaluate((element: HTMLImageElement) => {
            const rect = element.getBoundingClientRect();
            const parent = element.closest('.step-visual')!.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && rect.left >= parent.left - 1 && rect.right <= parent.right + 1
              && Math.abs(rect.width / rect.height - element.naturalWidth / element.naturalHeight) < 0.03;
          })).toBe(true);
          const additional = 'additionalFocus' in imageDescriptor ? imageDescriptor.additionalFocus ?? [] : [];
          await expect(visual.locator('.visual-focus')).toHaveCount(1 + additional.length);
          await expect(visual.locator('.visual-callout span')).toHaveText([imageDescriptor.focus.label, ...additional.map(region => region.label)]);
        }
        if (descriptor.kind === 'python' || descriptor.kind === 'comparison') {
          const python = descriptor.kind === 'comparison' ? descriptor.python : descriptor;
          expect(await visual.locator('pre code').textContent()).toBe(python.code);
          await expect(visual.getByRole('button', { name: 'Копіювати код' })).toBeVisible();
        }
        if (descriptor.kind === 'comparison') {
          await expect(visual.getByRole('heading', { name: 'Блоки', exact: true })).toBeVisible();
          await expect(visual.getByRole('heading', { name: 'Python', exact: true })).toBeVisible();
        }
        if (descriptor.kind === 'guide') {
          await expect(visual.getByRole('listitem')).toHaveText(descriptor.items);
        } else {
          await expect(visual).toContainText(descriptor.explanation);
        }
        await expectNoOverflow(page);
        // Retain every rendered action/visual/result for repeatable content QA.
        await card.screenshot({ path: testInfo.outputPath(`${step.id}.png`), animations: 'disabled' });
        await continueStep(page);
      });
    }
    await expect(page.locator('.challenge-panel')).toBeVisible();
    if (lesson.id === 'lesson-13') {
      await expect(page.locator('.challenge-panel')).toContainText('Додай ще одну функцію stopWalking');
      await expect(page.locator('.challenge-panel')).not.toContainText('другу функцію');
    }
    if (lesson.id === 'lesson-16') {
      await page.getByRole('button', { name: 'Показати підказку до випробування' }).click();
      await expect(page.locator('.challenge-panel')).toContainText('x ≤ 96 — задай x 96 і vx 20');
      await expect(page.locator('.challenge-panel')).toContainText('x ≥ 128 — задай x 128 і vx -20');
      await page.locator('.challenge-panel').screenshot({ path: testInfo.outputPath('bounded-patrol-challenge.png') });
    }
    expect((await readProgress(page)).lessons[lesson.id].completedStepIds).toEqual(lesson.steps.map((step) => step.id));
    expect((await readProgress(page)).totalXp).toBe(0);
  });
}

test('keyboard opens and closes the block lightbox and restores focus', async ({ page }) => {
  await page.goto('/#/lesson/znaiomstvo-z-arcade');
  for (let index = 0; index < 3; index++) await continueStep(page);
  const opener = page.getByRole('button', { name: 'Відкрити крупніше' });
  await opener.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  const close = dialog.getByRole('button', { name: 'Закрити', exact: true });
  await expect(close).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('region', { name: /Збільшене зображення/ })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await expectNoOverflow(page);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  await page.keyboard.press('Enter');
  await close.press('Enter');
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
});

for (const [lessonId, stepIndex, complex] of [
  ['lesson-20', 4, true],
  ['lesson-01', 3, false],
] as const) {
  test(`${lessonId}: enlarged blocks ${complex ? 'retain intrinsic size and can be panned' : 'fill the available width'}`, async ({ page }, testInfo) => {
    const lesson = lessons.find(({ id }) => id === lessonId)!;
    await page.goto(`/#/lesson/${lesson.slug}`);
    for (let index = 0; index < stepIndex; index++) await continueStep(page);
    const opener = page.getByRole('button', { name: 'Відкрити крупніше' });
    await opener.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog');
    const region = dialog.getByRole('region', { name: /Збільшене зображення/ });
    const image = region.getByRole('img');
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
    const dimensions = await image.evaluate((element: HTMLImageElement) => {
      const scroll = element.closest('.visual-lightbox__scroll')!;
      const style = getComputedStyle(scroll);
      return {
        naturalWidth: element.naturalWidth,
        width: element.getBoundingClientRect().width,
        viewportWidth: scroll.clientWidth,
        viewportHeight: scroll.clientHeight,
        contentWidth: scroll.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
        scrollWidth: scroll.scrollWidth,
        scrollHeight: scroll.scrollHeight,
      };
    });
    expect(dimensions.width).toBeGreaterThanOrEqual(dimensions.naturalWidth);
    expect(dimensions.viewportWidth).toBeGreaterThan(250);
    expect(dimensions.viewportHeight).toBeGreaterThan(300);
    if (complex) {
      expect(dimensions.naturalWidth).toBeGreaterThan(2000);
      expect(dimensions.scrollWidth).toBeGreaterThan(dimensions.viewportWidth);
      expect(dimensions.scrollHeight).toBeGreaterThan(dimensions.viewportHeight);
      await page.keyboard.press('Tab');
      await expect(region).toBeFocused();
      await page.keyboard.press('ArrowRight');
      await expect.poll(() => region.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
      await page.keyboard.press('ArrowDown');
      await expect.poll(() => region.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
    } else {
      expect(dimensions.naturalWidth).toBeLessThan(855);
      expect(dimensions.width).toBeGreaterThanOrEqual(Math.max(855, dimensions.contentWidth) - 1);
    }
    await expectNoOverflow(page);
    await testInfo.attach('lightbox-dimensions', { body: JSON.stringify(dimensions, null, 2), contentType: 'application/json' });
    await dialog.screenshot({ path: testInfo.outputPath(`${lessonId}-lightbox.png`) });
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();
    await expectNoOverflow(page);
  });
}

test('lesson 22 copies exact Python with indentation to the real clipboard', async ({ page }) => {
  await page.goto('/#/lesson/python-u-hri');
  await page.getByRole('button', { name: 'Копіювати код' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('wave = 0\ninfo.set_score(wave)');
  await expect(page.locator('.visual-copy-status')).toHaveText('Скопійовано');
  await expect(page.getByRole('button', { name: 'Копіювати код' })).toBeVisible();
  await continueStep(page);
  await continueStep(page);
  await page.getByRole('button', { name: 'Копіювати код' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('wave = 0\nspeeds = [30, 45, 60]\n\ndef spawn_enemy(speed):\n    enemy = sprites.create(img("""\n        . 2 2 .\n        2 2 2 2\n        2 . . 2\n    """), SpriteKind.enemy)\n    enemy.vy = speed\n\nspawn_enemy(30)');
});

test('lesson 21 advances from blocks to the visible responsive Python comparison', async ({ page }) => {
  await page.goto('/#/lesson/vid-blokiv-do-python');
  await continueStep(page);
  const comparison = page.locator('.visual-comparison');
  const blocks = comparison.getByRole('heading', { name: 'Блоки', exact: true });
  const python = comparison.getByRole('heading', { name: 'Python', exact: true });
  await expect(blocks).toBeVisible();
  await expect(python).toBeVisible();
  const boxes = await comparison.locator(':scope > section').evaluateAll((sections) => sections.map((section) => {
    const { x, y, width, height } = section.getBoundingClientRect();
    return { x, y, width, height };
  }));
  if (page.viewportSize()!.width <= 760) {
    expect(boxes[1].y).toBeGreaterThanOrEqual(boxes[0].y + boxes[0].height);
  } else {
    expect(boxes[1].x).toBeGreaterThanOrEqual(boxes[0].x + boxes[0].width);
  }
  await expectNoOverflow(page);
});

for (const [id, legacy, canonical, title] of [
  ['lesson-21', 'vid-blokiv-do-kodu', 'vid-blokiv-do-python', 'Від блоків до Python'],
  ['lesson-22', 'typescript-u-hri', 'python-u-hri', 'Python у грі'],
]) {
  test(`${legacy}: canonical content and ID-keyed progress survive old bookmarks and home resume`, async ({ page }) => {
    const stored: ProgressState = {
      version: 1, totalXp: 100, lastLessonSlug: legacy,
      lessons: {
        'lesson-01': { completedStepIds: ['lesson-01-step-01'], quizPassed: true, completed: true },
        [id]: { completedStepIds: [`${id}-step-01`], quizPassed: false, completed: false },
      },
    };
    await page.goto('/');
    await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: progressKey, value: stored });
    await page.reload();
    const resume = page.getByRole('link', { name: /Продовжити/ }).first();
    await expect(resume).toHaveAttribute('href', `#/lesson/${canonical}`);
    expect(await readProgress(page)).toEqual(stored);
    await resume.click();
    await expect(page.getByRole('heading', { level: 1, name: title, exact: true })).toBeVisible();
    await expect(page.locator('.step-list [aria-current="step"]')).toHaveAttribute('aria-label', /^Крок 2:/);
    await page.goto(`/#/lesson/${legacy}`);
    await expect(page.getByRole('heading', { level: 1, name: title, exact: true })).toBeVisible();
    // Aliases are readable bookmarks; only future stored writes use canonical slugs.
    await expect(page).toHaveURL(new RegExp(`#/lesson/${legacy}$`));
    expect(await readProgress(page)).toEqual({ ...stored, lastLessonSlug: canonical });
    await continueStep(page);
    await page.goto(`/#/lesson/${canonical}`);
    await expect(page.locator('.step-list [aria-current="step"]')).toHaveAttribute('aria-label', /^Крок 3:/);
    expect((await readProgress(page)).lessons[id].completedStepIds).toEqual([`${id}-step-01`, `${id}-step-02`]);
    expect((await readProgress(page)).totalXp).toBe(100);
  });
}

test('hints, saved progress, quiz retry, one-time XP and completed review stay intact', async ({ page }) => {
  await page.goto('/#/lesson/znaiomstvo-z-arcade');
  for (let index = 0; index < 3; index++) await continueStep(page);
  await page.getByRole('button', { name: 'Показати підказку до кроку' }).click();
  await expect(page.locator('.hint-disclosure__content')).toBeVisible();
  expect((await readProgress(page)).lessons['lesson-01'].completedStepIds).toHaveLength(3);
  await page.getByRole('button', { name: 'Сховати підказку до кроку' }).click();
  await page.reload();
  await expect(page.locator('.step-list [aria-current="step"]')).toHaveAttribute('aria-label', /^Крок 4:/);
  for (let index = 0; index < 3; index++) await continueStep(page);
  await page.getByRole('button', { name: 'Показати підказку до випробування' }).click();
  await expect(page.locator('.hint-disclosure__content')).toBeVisible();
  await page.getByRole('button', { name: /Випробування виконано — до мінітесту/ }).click();
  await expect(page.getByRole('button', { name: 'Перевірити відповідь' })).toBeDisabled();
  const quiz = lessons[0].quiz;
  await page.getByRole('radio', { name: quiz.options[(quiz.correctIndex + 1) % quiz.options.length] }).check();
  await page.getByRole('button', { name: 'Перевірити відповідь' }).click();
  await expect(page.locator('.quiz-feedback')).toContainText('Майже! Спробуй ще раз.');
  expect((await readProgress(page)).totalXp).toBe(0);
  await page.getByRole('radio', { name: quiz.options[quiz.correctIndex] }).check();
  await page.getByRole('button', { name: 'Спробувати ще раз' }).click();
  await page.getByRole('button', { name: /Завершити місію/ }).click();
  await expect(page.locator('.completion-panel')).toBeVisible();
  const completed = await readProgress(page);
  expect(completed.totalXp).toBe(100);
  expect(completed.lessons['lesson-01']).toEqual({
    completedStepIds: Array.from({ length: 6 }, (_, i) => `lesson-01-step-0${i + 1}`), quizPassed: true, completed: true,
  });
  await page.reload();
  await expect(page.locator('.completion-panel')).toBeVisible();
  await page.getByRole('navigation', { name: 'Кроки місії' }).getByRole('button').first().click();
  await expect(page.locator('.review-mode-notice')).toBeVisible();
  for (let index = 0; index < 5; index++) await page.getByRole('button', { name: 'Наступний крок', exact: false }).click();
  await page.getByRole('button', { name: 'Завершити перегляд' }).click();
  await expect(page.locator('.completion-panel')).toBeVisible();
  expect(await readProgress(page)).toEqual(completed);
});
