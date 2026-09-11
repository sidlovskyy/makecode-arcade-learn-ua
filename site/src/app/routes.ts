export type AppRoute =
  | { name: 'home' }
  | { name: 'lesson'; slug: string }
  | { name: 'not-found' };

export function parseHash(hash: string): AppRoute {
  if (hash === '' || hash === '#' || hash === '#/') {
    return { name: 'home' };
  }

  const lessonMatch = /^#\/lesson\/([^/]+)$/.exec(hash);

  if (lessonMatch === null) {
    return { name: 'not-found' };
  }

  try {
    const slug = decodeURIComponent(lessonMatch[1]!);

    return slug.length > 0 ? { name: 'lesson', slug } : { name: 'not-found' };
  } catch {
    return { name: 'not-found' };
  }
}

export function lessonHref(slug: string): string {
  return `#/lesson/${encodeURIComponent(slug)}`;
}

export function navigateTo(hash: string): void {
  window.location.hash = hash;
}
