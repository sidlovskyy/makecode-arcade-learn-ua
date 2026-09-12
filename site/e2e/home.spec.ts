import { expect, test, type Page } from 'playwright/test';
import { curriculum } from '../src/curriculum';

const allLessons = curriculum.flatMap((campaign) => campaign.lessons);

async function openFreshHome(page: Page) {
  await page.goto('/#/');
  await expect(page.getByRole('heading', { name: /Від першого пікселя/ })).toBeVisible();
}

test('completed course action reveals and focuses map', async ({ page }) => {
  const completedLessons = Object.fromEntries(allLessons.map((lesson) => [
    lesson.id,
    {
      completedStepIds: lesson.steps.map((step) => step.id),
      quizPassed: true,
      completed: true,
    },
  ]));
  await page.addInitScript((lessons) => {
    window.localStorage.setItem('kodkvest.progress.v1', JSON.stringify({
      version: 1,
      lessons,
      totalXp: 5000,
      lastLessonSlug: 'moia-vlasna-hra',
    }));
  }, completedLessons);
  await openFreshHome(page);

  const action = page.getByRole('button', { name: 'Переглянути місії' });
  await action.focus();
  await page.keyboard.press('Enter');

  const mapHeading = page.getByRole('heading', { name: 'Обери наступну місію' });
  await expect(mapHeading).toBeFocused();
  await expect(mapHeading).toBeInViewport();
  await expect(page).toHaveURL(/\/#\/$/);
});

test('keyboard CTA entry and browser Back transfer focus', async ({ page }) => {
  await openFreshHome(page);

  const action = page.getByRole('link', { name: /Почати квест/ });
  await action.focus();
  await page.keyboard.press('Enter');

  await expect(page.getByRole('heading', { name: 'Знайомство з Arcade', level: 1 })).toBeVisible();
  await expect(page.locator('main#main-content')).toBeFocused();

  await page.goBack();
  await expect(page.getByRole('heading', { name: /Від першого пікселя/ })).toBeVisible();
  await expect(page.locator('main#main-content')).toBeFocused();
});

test('keyboard card entry and browser Back transfer focus', async ({ page }) => {
  await openFreshHome(page);

  const card = page.getByRole('link', {
    name: 'Місія 1: Знайомство з Arcade. Не розпочато',
  });
  await card.focus();
  await page.keyboard.press('Enter');

  await expect(page.getByRole('heading', { name: 'Знайомство з Arcade', level: 1 })).toBeVisible();
  await expect(page.locator('main#main-content')).toBeFocused();

  await page.goBack();
  await expect(page.getByRole('heading', { name: /Від першого пікселя/ })).toBeVisible();
  await expect(page.locator('main#main-content')).toBeFocused();
});

test('both filter clear actions restore results and search focus', async ({ page }) => {
  await openFreshHome(page);
  const search = page.getByRole('searchbox', { name: 'Пошук місій' });
  const resultStatus = page.getByRole('status');

  await search.fill('zzzz');
  await expect(resultStatus).toHaveText('Знайдено місій: 0');
  const showAll = page.getByRole('button', { name: 'Показати всі місії' });
  await showAll.focus();
  await page.keyboard.press('Enter');
  await expect(search).toBeFocused();
  await expect(resultStatus).toHaveText('Знайдено місій: 24');
  await expect(page.locator('[data-lesson-link]')).toHaveCount(24);

  await search.fill('zzzz');
  const reset = page.getByRole('button', { name: 'Скинути фільтри' });
  await reset.focus();
  await page.keyboard.press('Enter');
  await expect(search).toBeFocused();
  await expect(resultStatus).toHaveText('Знайдено місій: 24');
  await expect(page.locator('[data-lesson-link]')).toHaveCount(24);
});

test('first lesson card exposes its comparison details', async ({ page }) => {
  await openFreshHome(page);

  const snapshot = await page.getByRole('link', {
    name: 'Місія 1: Знайомство з Arcade. Не розпочато',
  }).ariaSnapshot();

  expect(snapshot).toContain('Місія 1: Знайомство з Arcade. Не розпочато');
  expect(snapshot).toContain('Оглянь редактор і запусти свій перший проєкт.');
  expect(snapshot).toContain('Старт');
  expect(snapshot).toContain('20 хв');
  expect(snapshot).toContain('100 XP');
});
