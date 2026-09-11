import { test as base, expect, type Page } from 'playwright/test';
import { lessons } from '../src/curriculum';
import type { ProgressState } from '../src/progress/schema';

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
          await expect(visual.locator('.visual-focus')).toHaveCount(1);
          await expect(visual.locator('.visual-callout')).toContainText(imageDescriptor.focus.label);
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
