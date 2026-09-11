import { validateSvg } from './render-blocks-lib.mjs';

// Use Chromium's own CSS parser/selector engine. Keep original matching rules
// (including their specificity/order) instead of approximating computed styles.
// The caller supplies an offline page separate from the MakeCode renderer.
export async function optimizeRendererSvg(page, svg, id) {
  const { width, height } = validateSvg(svg, id);
  try {
    // Media queries inside an SVG image use its intrinsic viewport, which can
    // differ from the authoring page and select a different embedded font.
    await page.setViewportSize({ width: Math.ceil(width), height: Math.ceil(height) });
    await page.goto(`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`);
    const optimized = await page.evaluate(() => {
      const root = document.documentElement;
      const elements = [root, ...root.querySelectorAll('*')];
      const normalizeFamily = (family) => family.replace(/["'\\]/g, '').trim().toLowerCase();
      const fonts = new Set();
      const animations = new Set();
      for (const element of elements) {
        const style = getComputedStyle(element);
        if (['text', 'tspan', 'textPath'].includes(element.localName)) {
          style.fontFamily.split(',').forEach((family) => fonts.add(normalizeFamily(family)));
        }
        style.animationName.split(',').forEach((name) => animations.add(name.trim()));
      }
      function keepRule(rule) {
        if (rule.type === CSSRule.STYLE_RULE) {
          try {
            if (!root.matches(rule.selectorText) && !root.querySelector(rule.selectorText)) return '';
          } catch {
            // Preserve unfamiliar selectors conservatively rather than risking
            // the removal of a rule a newer renderer relies on.
          }
          return rule.cssText;
        }
        if (rule.type === CSSRule.FONT_FACE_RULE) {
          return fonts.has(normalizeFamily(rule.style.getPropertyValue('font-family'))) ? rule.cssText : '';
        }
        if (rule.type === CSSRule.KEYFRAMES_RULE) {
          return animations.has(rule.name) ? rule.cssText : '';
        }
        if ('cssRules' in rule) {
          const children = [...rule.cssRules].map(keepRule).filter(Boolean);
          return children.length ? `${rule.cssText.slice(0, rule.cssText.indexOf('{'))}{${children.join('\n')}}` : '';
        }
        // Small declarations such as @property can affect CSS variables without
        // having selectors. Retain them; remote imports were already rejected.
        return rule.cssText;
      }
      const sheets = [...root.querySelectorAll('style')].map((element) => ({
        element,
        text: [...element.sheet.cssRules].map(keepRule).filter(Boolean).join('\n'),
      }));
      for (const { element, text } of sheets) {
        if (text) element.textContent = text;
        else element.remove();
      }
      return new XMLSerializer().serializeToString(root);
    });
    validateSvg(optimized, id);
    return optimized;
  } catch (error) {
    throw new Error(`${id}: SVG optimization failed: ${error.message}`, { cause: error });
  }
}
