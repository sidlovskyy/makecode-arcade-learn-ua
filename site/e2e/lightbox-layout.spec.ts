import { test, expect, type Locator } from 'playwright/test';
import { lessons } from '../src/curriculum';

async function waitForPanToSettle(region: Locator) {
  // Native keyboard panning animates even with reduced motion. Wait before
  // changing axes or checking that subsequent caption scrolling is isolated.
  await region.evaluate(el => new Promise<void>(resolve => {
    let previous = '', stableSince = performance.now();
    function sample(now: number) {
      const position = `${el.scrollLeft}:${el.scrollTop}`;
      if (position !== previous) { previous = position; stableSince = now; }
      if (now - stableSince >= 200) resolve();
      else requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  }));
}

for (const [id, index] of [['lesson-16', 3], ['lesson-17', 3], ['lesson-19', 1], ['lesson-19', 2]] as const) {
  test(`${id} step ${index + 1}: long lightbox captions leave usable native image space`, async ({ page }, testInfo) => {
    const lesson = lessons.find(lesson => lesson.id === id)!;
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/#/lesson/${lesson.slug}`);
    for (let i = 0; i < index; i++) await page.locator('.lesson-step-actions .button--primary').click();
    const opener = page.getByRole('button', { name: 'Відкрити крупніше' });
    await opener.click();
    const dialog = page.getByRole('dialog');
    const close = dialog.getByRole('button', { name: 'Закрити' });
    const image = dialog.getByRole('region', { name: /Збільшене зображення/ });
    const caption = dialog.locator('.visual-lightbox__caption');
    await image.locator('img').evaluate((img: HTMLImageElement) => img.decode());
    // A native block stack needs a substantial viewing window, even at 320×568.
    // This catches flex allocation starving the image to a ~13px strip.
    expect(await image.evaluate(el => el.clientHeight)).toBeGreaterThanOrEqual(page.viewportSize()!.height * 0.35);
    await expect.poll(() => image.evaluate(el => {
      const viewport = el.getBoundingClientRect();
      const target = el.querySelector('.visual-focus')!.getBoundingClientRect();
      return Math.min(target.bottom, viewport.top + el.clientHeight) - Math.max(target.top, viewport.top)
        >= Math.min(target.height, el.clientHeight) - 3;
    })).toBe(true);
    expect(await image.locator('img').evaluate((img: HTMLImageElement) => img.getBoundingClientRect().width / img.naturalWidth)).toBeGreaterThanOrEqual(1);
    const nativeVisible = await image.evaluate(el => {
      const viewport = el.getBoundingClientRect(), img = el.querySelector('img')!.getBoundingClientRect();
      return Math.min(img.bottom, viewport.bottom) - Math.max(img.top, viewport.top);
    });
    expect(nativeVisible).toBeGreaterThanOrEqual(page.viewportSize()!.height * 0.35 - 16);
    await expect(caption).toHaveRole('region');
    await expect(caption).toHaveAccessibleName('Пояснення до зображення');
    await expect(close).toBeFocused();
    await page.keyboard.press('Tab'); await expect(image).toBeFocused();
    const captionBefore = await caption.boundingBox();
    await image.evaluate(el => { el.scrollLeft = 0; el.scrollTop = 0; });
    await image.press('ArrowRight');
    await expect.poll(() => image.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
    await waitForPanToSettle(image);
    const canPanVertically = await image.evaluate(el => el.scrollHeight > el.clientHeight);
    if (page.viewportSize()!.width === 320) expect(canPanVertically).toBe(true);
    if (canPanVertically) {
      await image.press('ArrowDown');
      await expect.poll(() => image.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    }
    await waitForPanToSettle(image);
    expect(await caption.boundingBox()).toEqual(captionBefore);
    expect(await caption.evaluate(el => el.scrollLeft)).toBe(0);
    await page.keyboard.press('Tab'); await expect(caption).toBeFocused();
    const imageBefore = await image.evaluate(el => [el.scrollLeft, el.scrollTop]);
    if (page.viewportSize()!.width === 320) {
      expect(await caption.evaluate(el => el.scrollHeight - el.clientHeight)).toBeGreaterThan(0);
      await caption.press('End');
      await expect.poll(() => caption.evaluate(el => el.scrollHeight - el.clientHeight - el.scrollTop)).toBeLessThanOrEqual(1);
      const last = await caption.locator(':scope > :last-child').boundingBox();
      expect(last!.y + last!.height).toBeLessThanOrEqual(captionBefore!.y + captionBefore!.height + 1);
      await caption.press('Home');
      await expect.poll(() => caption.evaluate(el => el.scrollTop)).toBe(0);
    }
    expect(await image.evaluate(el => [el.scrollLeft, el.scrollTop])).toEqual(imageBefore);
    await page.keyboard.press('Tab'); await expect(close).toBeFocused();
    await page.keyboard.press('Shift+Tab'); await expect(caption).toBeFocused();
    const bounds = (await dialog.boundingBox())!;
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(page.viewportSize()!.height);
    await page.screenshot({ path: testInfo.outputPath('usable-lightbox.png') });
    await page.keyboard.press('Escape'); await expect(opener).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(page.viewportSize()!.width);
  });
}
