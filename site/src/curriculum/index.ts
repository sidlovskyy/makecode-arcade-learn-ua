import { campaign01 } from './campaign-01';
import { campaign02 } from './campaign-02';
import { campaign03 } from './campaign-03';
import { campaign04 } from './campaign-04';
import { campaign05 } from './campaign-05';
import { campaign06 } from './campaign-06';

export const curriculum = [campaign01, campaign02, campaign03, campaign04, campaign05, campaign06];
export const lessons = curriculum.flatMap((campaign) => campaign.lessons);
export const lessonBySlug = new Map(lessons.map((lesson) => [lesson.slug, lesson]));

const legacyLessonSlugs = new Map([
  ['vid-blokiv-do-kodu', 'vid-blokiv-do-python'],
  ['typescript-u-hri', 'python-u-hri'],
]);

for (const [legacySlug, canonicalSlug] of legacyLessonSlugs) {
  const lesson = lessonBySlug.get(canonicalSlug);
  if (lesson) lessonBySlug.set(legacySlug, lesson);
}

export function resolveLessonSlug(slug: string | undefined): string | undefined {
  return slug === undefined ? undefined : lessonBySlug.get(slug)?.slug ?? slug;
}
