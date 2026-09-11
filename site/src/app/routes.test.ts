import { describe, expect, it } from 'vitest';
import { lessonHref, navigateTo, parseHash } from './routes';

describe('parseHash', () => {
  it.each([
    ['the course root', '#/', { name: 'home' }],
    ['an empty hash', '', { name: 'home' }],
    ['a bare hash', '#', { name: 'home' }],
  ] as const)('parses %s', (_caseName, hash, expected) => {
    expect(parseHash(hash)).toEqual(expected);
  });

  it('parses and decodes a lesson slug', () => {
    expect(parseHash('#/lesson/mii-pershyi-sprait')).toEqual({
      name: 'lesson',
      slug: 'mii-pershyi-sprait',
    });
    expect(parseHash('#/lesson/%D0%BC%D1%96%D0%B9-%D1%81%D0%BF%D1%80%D0%B0%D0%B9%D1%82')).toEqual({
      name: 'lesson',
      slug: 'мій-спрайт',
    });
  });

  it.each([
    ['an unknown path', '#/other'],
    ['a lesson path without a slug', '#/lesson/'],
    ['a lesson path with an extra segment', '#/lesson/lesson-01/extra'],
  ])('returns not-found for %s', (_caseName, hash) => {
    expect(parseHash(hash)).toEqual({ name: 'not-found' });
  });

  it('returns not-found instead of throwing for malformed percent encoding', () => {
    expect(parseHash('#/lesson/%E0%A4%A')).toEqual({ name: 'not-found' });
  });
});

describe('route helpers', () => {
  it('encodes a lesson slug as a single safe hash segment', () => {
    expect(lessonHref('мій спрайт/тест')).toBe(
      '#/lesson/%D0%BC%D1%96%D0%B9%20%D1%81%D0%BF%D1%80%D0%B0%D0%B9%D1%82%2F%D1%82%D0%B5%D1%81%D1%82',
    );
  });

  it('navigates by replacing the current hash value', () => {
    window.location.hash = '#/';

    navigateTo('#/lesson/mii-pershyi-sprait');

    expect(window.location.hash).toBe('#/lesson/mii-pershyi-sprait');
  });
});
