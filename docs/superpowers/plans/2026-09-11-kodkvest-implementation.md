# KodKvest Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete Ukrainian React learning site that guides children aged 10–12 through 24 self-paced Microsoft MakeCode Arcade missions and stores progress locally.

**Architecture:** A Vite-built React SPA uses hash routes so it works on static hosting without rewrites. Typed curriculum modules are independent from UI components, while a versioned progress service owns all `localStorage` access and exposes immutable state updates through a React hook.

**Tech Stack:** React, TypeScript, Vite, Vitest, React Testing Library, CSS, `localStorage`

---

## File map

```text
index.html                         HTML shell and Ukrainian metadata
package.json                       scripts and dependencies
vite.config.ts                     Vite/Vitest/static-hosting configuration
tsconfig*.json                     strict TypeScript configuration
src/main.tsx                       browser entry point
src/app/App.tsx                    route composition and global state
src/app/routes.ts                  hash parsing and navigation helpers
src/app/routes.test.ts             route unit tests
src/curriculum/types.ts            curriculum domain types
src/curriculum/validate.ts         runtime/content integrity validation
src/curriculum/validate.test.ts    curriculum integrity tests
src/curriculum/campaign-01.ts      missions 1–4
src/curriculum/campaign-02.ts      missions 5–8
src/curriculum/campaign-03.ts      missions 9–12
src/curriculum/campaign-04.ts      missions 13–16
src/curriculum/campaign-05.ts      missions 17–20
src/curriculum/campaign-06.ts      missions 21–24
src/curriculum/index.ts            assembled curriculum export
src/progress/schema.ts             stored progress types/defaults
src/progress/storage.ts            safe versioned localStorage adapter
src/progress/storage.test.ts       storage unit tests
src/progress/useProgress.ts        React progress state/actions
src/progress/useProgress.test.tsx  progress-hook tests
src/components/AppHeader.tsx       brand, XP and navigation
src/components/SiteFooter.tsx      independent-project trademark note
src/components/ProgressSummary.tsx resume card and total progress
src/components/CourseMap.tsx       campaign list and filters
src/components/CampaignCard.tsx    campaign presentation
src/components/LessonCard.tsx      lesson status and link
src/components/LessonScreen.tsx    complete lesson journey
src/components/StepNavigator.tsx   step list and current step
src/components/ChallengePanel.tsx  independent practice prompt
src/components/Quiz.tsx            retryable knowledge check
src/components/AchievementToast.tsx lesson/campaign reward feedback
src/components/StorageNotice.tsx   non-blocking storage warning
src/components/NotFound.tsx        invalid hash/slug recovery
src/components/*.test.tsx          component behavior tests
src/styles/tokens.css               theme variables
src/styles/global.css               responsive global/component styles
src/assets/hero-arcade.webp         original pixel-art hero artwork
src/test/setup.ts                   DOM matcher and cleanup setup
README.md                           development and static deployment guide
```

### Task 1: Bootstrap the React and test toolchain

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `src/main.tsx`
- Create: `src/test/setup.ts`
- Create: `src/app/App.tsx`

- [ ] **Step 1: Add the package scripts**

Create `package.json`:

```json
{
  "name": "kodkvest",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "typecheck": "tsc -b",
    "test": "vitest run",
    "test:watch": "vitest",
    "check": "npm run typecheck && npm run test && npm run build"
  }
}
```

- [ ] **Step 2: Install production and development dependencies**

Run:

```bash
npm install react react-dom
npm install -D vite typescript @vitejs/plugin-react vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/react @types/react-dom @types/node
```

Expected: `package-lock.json` is created and `npm audit` reports no unresolved install failure.

- [ ] **Step 3: Add strict compiler and Vite configuration**

Create the three TypeScript configs using the standard Vite project-reference layout. `tsconfig.app.json` must enable `strict`, `noUncheckedIndexedAccess`, `jsx: "react-jsx"`, and `types: ["vitest/globals"]`. Create `vite.config.ts` with the following behavior:

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
});
```

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: Add the Ukrainian HTML shell and first render**

Create `index.html` with `lang="uk"`, title `КодКвест — вивчай MakeCode Arcade українською`, a concise Ukrainian description, theme color `#17132e`, `#root`, and the Vite module script. Create `src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

Create a temporary `App` that renders `<main><h1>КодКвест</h1></main>`; it will be replaced in Task 6.

- [ ] **Step 5: Verify the baseline build**

Run: `npm run build`

Expected: exit code 0 and static output in `dist/`.

- [ ] **Step 6: Commit the bootstrap**

```bash
git add package.json package-lock.json index.html vite.config.ts tsconfig*.json src
git commit -m "chore: bootstrap React learning site"
```

### Task 2: Define and validate the curriculum model

**Files:**
- Create: `src/curriculum/types.ts`
- Create: `src/curriculum/validate.ts`
- Create: `src/curriculum/validate.test.ts`

- [ ] **Step 1: Write failing integrity tests**

Create tests that construct a two-mission fixture and assert that validation rejects a duplicate mission ID, duplicate slug, missing official MakeCode URL, fewer than five steps, more than eight steps, missing quiz explanation, and a prerequisite that references an unknown mission. Also assert that a valid fixture produces an empty error array.

```ts
import { describe, expect, it } from 'vitest';
import type { Campaign } from './types';
import { validateCurriculum } from './validate';

const validCampaign: Campaign = {
  id: 'novachok',
  order: 1,
  title: 'Новачок',
  description: 'Перші кроки у створенні ігор.',
  color: 'mint',
  reward: 'Перший піксель',
  lessons: [
    {
      id: 'lesson-01',
      slug: 'znaiomstvo-z-arcade',
      order: 1,
      title: 'Знайомство з Arcade',
      summary: 'Відкрий редактор і запусти перший проєкт.',
      durationMinutes: 20,
      difficulty: 'starter',
      concepts: ['редактор', 'симулятор'],
      prerequisites: [],
      objective: 'Навчитися створювати, запускати й зберігати проєкт.',
      steps: Array.from({ length: 5 }, (_, index) => ({
        id: `step-${index + 1}`,
        title: `Крок ${index + 1}`,
        instruction: 'Виконай дію в редакторі.',
        expected: 'Зміна видима у симуляторі.',
      })),
      challenge: { title: 'Самостійний запуск', prompt: 'Запусти гру без підказки.' },
      quiz: {
        question: 'Де запускається гра?',
        options: ['У симуляторі', 'У кошику', 'У пошті'],
        correctIndex: 0,
        explanation: 'Симулятор одразу показує результат програми.',
      },
      xp: 100,
      makeCodeUrl: 'https://arcade.makecode.com/',
    },
  ],
};

describe('validateCurriculum', () => {
  it('accepts a complete curriculum', () => {
    expect(validateCurriculum([validCampaign])).toEqual([]);
  });

  it('rejects malformed curriculum data', () => {
    const broken = structuredClone(validCampaign);
    broken.lessons[0]!.steps = broken.lessons[0]!.steps.slice(0, 4);
    expect(validateCurriculum([broken])).toContain('lesson-01 must have 5–8 steps');
  });
});
```

- [ ] **Step 2: Run the tests to verify failure**

Run: `npm test -- src/curriculum/validate.test.ts`

Expected: FAIL because `types.ts` and `validate.ts` do not exist.

- [ ] **Step 3: Add curriculum types**

Create `types.ts` with these exact public types:

```ts
export type Difficulty = 'starter' | 'explorer' | 'builder' | 'master';
export type CampaignColor = 'mint' | 'yellow' | 'pink' | 'purple' | 'blue' | 'orange';

export interface LessonStep {
  id: string;
  title: string;
  instruction: string;
  expected: string;
  hint?: string;
}

export interface LessonChallenge {
  title: string;
  prompt: string;
  hint?: string;
}

export interface LessonQuiz {
  question: string;
  options: [string, string, ...string[]];
  correctIndex: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  slug: string;
  order: number;
  title: string;
  summary: string;
  durationMinutes: number;
  difficulty: Difficulty;
  concepts: string[];
  prerequisites: string[];
  objective: string;
  steps: LessonStep[];
  challenge: LessonChallenge;
  quiz: LessonQuiz;
  xp: number;
  makeCodeUrl: `https://arcade.makecode.com${string}`;
}

export interface Campaign {
  id: string;
  order: number;
  title: string;
  description: string;
  color: CampaignColor;
  reward: string;
  lessons: Lesson[];
}
```

- [ ] **Step 4: Implement validation**

Create `validateCurriculum(campaigns: Campaign[]): string[]`. Iterate campaigns and lessons once, collect all IDs/slugs, then validate uniqueness, 5–8 steps, non-empty challenge/quiz explanation, exactly three quiz options, `correctIndex` bounds, official HTTPS hostname/path, and known prerequisites. Return deterministic human-readable strings; do not throw so tests can report all content problems at once.

- [ ] **Step 5: Run and expand the tests**

Run: `npm test -- src/curriculum/validate.test.ts`

Expected: PASS for all valid and invalid cases described in Step 1.

- [ ] **Step 6: Commit the domain model**

```bash
git add src/curriculum
git commit -m "feat: define curriculum content model"
```

### Task 3: Author all six campaigns

**Files:**
- Create: `src/curriculum/campaign-01.ts`
- Create: `src/curriculum/campaign-02.ts`
- Create: `src/curriculum/campaign-03.ts`
- Create: `src/curriculum/campaign-04.ts`
- Create: `src/curriculum/campaign-05.ts`
- Create: `src/curriculum/campaign-06.ts`
- Create: `src/curriculum/index.ts`
- Modify: `src/curriculum/validate.test.ts`

- [ ] **Step 1: Add a failing full-curriculum test**

```ts
import { curriculum, lessons } from './index';

it('contains six valid campaigns and twenty-four ordered lessons', () => {
  expect(curriculum).toHaveLength(6);
  expect(lessons).toHaveLength(24);
  expect(lessons.map((lesson) => lesson.order)).toEqual(
    Array.from({ length: 24 }, (_, index) => index + 1),
  );
  expect(validateCurriculum(curriculum)).toEqual([]);
});
```

- [ ] **Step 2: Run the test to verify failure**

Run: `npm test -- src/curriculum/validate.test.ts`

Expected: FAIL because `src/curriculum/index.ts` does not exist.

- [ ] **Step 3: Author campaigns 1–3**

Create typed `Campaign` exports using these exact lesson identities and outcomes:

| Order | ID / slug | Ukrainian title | Required outcome |
|---|---|---|---|
| 1 | `lesson-01` / `znaiomstvo-z-arcade` | Знайомство з Arcade | Create, name, run and save a project; identify toolbox, workspace and simulator. |
| 2 | `lesson-02` / `mii-pershyi-sprait` | Мій перший спрайт | Create a Player sprite and draw a readable 16×16 character. |
| 3 | `lesson-03` / `heroi-pid-kontrolem` | Герой під контролем | Move a sprite, understand x/y direction and keep it on screen. |
| 4 | `lesson-04` / `pikselni-perehony` | Піксельні перегони | Combine movement, a finish sprite and an overlap event into a playable mini-game. |
| 5 | `lesson-05` / `knopky-i-podii` | Кнопки й події | React to A/B presses and distinguish startup from button events. |
| 6 | `lesson-06` / `koly-spraity-zustrichaiutsia` | Коли спрайти зустрічаються | Use SpriteKind categories and overlap handlers safely. |
| 7 | `lesson-07` / `rakhunok-zhyttia-chas` | Рахунок, життя, час | Add score, life, countdown and win/lose conditions. |
| 8 | `lesson-08` / `lovy-zirky` | Лови зірки | Build a collecting game with random target positions and score. |
| 9 | `lesson-09` / `snariady-i-nebezpeky` | Снаряди й небезпеки | Fire projectiles, create hazards and destroy sprites. |
| 10 | `lesson-10` / `rishennia-hry` | Рішення гри | Use variables, comparisons, conditions and random values. |
| 11 | `lesson-11` / `hra-ne-zupyniaietsia` | Гра не зупиняється | Use loops and timed update events without freezing play. |
| 12 | `lesson-12` / `kosmichnyi-zakhysnyk` | Космічний захисник | Build waves of enemies with shooting, lives and scoring. |

Each lesson must contain 5–8 concrete Ukrainian imperative steps, an observable expected result, a hidden-on-load hint for the difficult step, one independent challenge, and a three-option quiz with an explanatory answer. Use only URLs under `https://arcade.makecode.com/`.

- [ ] **Step 4: Author campaigns 4–6**

Use the same complete lesson contract and these outcomes:

| Order | ID / slug | Ukrainian title | Required outcome |
|---|---|---|---|
| 13 | `lesson-13` / `zhyvi-personazhi` | Живі персонажі | Create frame animation and extract repeated behavior into functions. |
| 14 | `lesson-14` / `buduiemo-kartu` | Будуємо карту | Draw a tilemap, mark walls and follow the player with the camera. |
| 15 | `lesson-15` / `meshkantsi-svitu` | Мешканці світу | Store sprites in arrays, spawn enemies and give them movement patterns. |
| 16 | `lesson-16` / `zahublenyi-krystal` | Загублений кристал | Build a platformer with a map, obstacles, collectible and finish. |
| 17 | `lesson-17` / `rivni-ta-skladnist` | Рівні та складність | Model game states and increase difficulty between levels. |
| 18 | `lesson-18` / `rozumni-suprotyvnyky` | Розумні супротивники | Implement patrol and chase behaviors using sprite physics. |
| 19 | `lesson-19` / `vid-prototypu-do-hry` | Від прототипу до гри | Add power-ups, sound, feedback, balancing and a debugging pass. |
| 20 | `lesson-20` / `arena-bosiv` | Арена босів | Build a boss with multiple phases and a complete replayable loop. |
| 21 | `lesson-21` / `vid-blokiv-do-kodu` | Від блоків до коду | Switch between Blocks and JavaScript and connect generated code to blocks. |
| 22 | `lesson-22` / `typescript-u-hri` | TypeScript у грі | Edit typed variables, conditions, loops, arrays and functions in code. |
| 23 | `lesson-23` / `hrafika-maistra` | Графіка майстра | Implement image code, layers, parallax and a simple minimap. |
| 24 | `lesson-24` / `moia-vlasna-hra` | Моя власна гра | Design an MVP, test it with another person, improve it and publish safely. |

- [ ] **Step 5: Assemble and validate exports**

Create `index.ts`:

```ts
import { campaign01 } from './campaign-01';
import { campaign02 } from './campaign-02';
import { campaign03 } from './campaign-03';
import { campaign04 } from './campaign-04';
import { campaign05 } from './campaign-05';
import { campaign06 } from './campaign-06';

export const curriculum = [campaign01, campaign02, campaign03, campaign04, campaign05, campaign06];
export const lessons = curriculum.flatMap((campaign) => campaign.lessons);
export const lessonBySlug = new Map(lessons.map((lesson) => [lesson.slug, lesson]));
```

Run: `npm test -- src/curriculum/validate.test.ts`

Expected: PASS, 6 campaigns, 24 lessons, no integrity errors.

- [ ] **Step 6: Commit the course content**

```bash
git add src/curriculum
git commit -m "feat: add complete Ukrainian MakeCode curriculum"
```

### Task 4: Implement safe versioned progress storage

**Files:**
- Create: `src/progress/schema.ts`
- Create: `src/progress/storage.ts`
- Create: `src/progress/storage.test.ts`

- [ ] **Step 1: Write failing storage tests**

Test empty storage, valid round-trip, malformed JSON, wrong schema version, a thrown `getItem`, and a thrown `setItem`.

```ts
it('returns a clean state when stored JSON is corrupt', () => {
  localStorage.setItem(PROGRESS_KEY, '{broken');
  expect(loadProgress(localStorage)).toEqual({ progress: createDefaultProgress(), available: true });
});

it('reports unavailable storage without throwing', () => {
  const blocked = { getItem: () => { throw new Error('blocked'); } } as unknown as Storage;
  expect(loadProgress(blocked)).toEqual({ progress: createDefaultProgress(), available: false });
});
```

- [ ] **Step 2: Run the tests to verify failure**

Run: `npm test -- src/progress/storage.test.ts`

Expected: FAIL because the progress modules do not exist.

- [ ] **Step 3: Add the schema and pure update helpers**

Define:

```ts
export const PROGRESS_VERSION = 1 as const;
export const PROGRESS_KEY = 'kodkvest.progress.v1';

export interface LessonProgress {
  completedStepIds: string[];
  quizPassed: boolean;
  completed: boolean;
}

export interface ProgressState {
  version: typeof PROGRESS_VERSION;
  lessons: Record<string, LessonProgress>;
  totalXp: number;
  lastLessonSlug?: string;
}

export const createDefaultProgress = (): ProgressState => ({
  version: PROGRESS_VERSION,
  lessons: {},
  totalXp: 0,
});
```

Add pure functions `completeStep`, `passQuiz`, `completeLesson`, and `setLastLesson`. They must return new objects, avoid duplicate XP, and preserve unknown valid lesson progress for forward compatibility.

- [ ] **Step 4: Implement the defensive adapter**

Expose:

```ts
export interface ProgressLoadResult {
  progress: ProgressState;
  available: boolean;
}

export function loadProgress(storage: Storage): ProgressLoadResult;
export function saveProgress(storage: Storage, progress: ProgressState): boolean;
```

Use `try/catch`; validate the version, `lessons` object and numeric XP before accepting stored data. Return `false` from save failures rather than throwing.

- [ ] **Step 5: Run the storage tests**

Run: `npm test -- src/progress/storage.test.ts`

Expected: PASS for round-trip and all failure cases.

- [ ] **Step 6: Commit storage support**

```bash
git add src/progress
git commit -m "feat: persist learning progress safely"
```

### Task 5: Add the progress hook and hash routes

**Files:**
- Create: `src/progress/useProgress.ts`
- Create: `src/progress/useProgress.test.tsx`
- Create: `src/app/routes.ts`
- Create: `src/app/routes.test.ts`

- [ ] **Step 1: Write failing hook and route tests**

Test `parseHash('#/')`, `parseHash('#/lesson/mii-pershyi-sprait')`, malformed percent encoding, and an unknown path. For the hook, render it with a memory `Storage` test double and assert completing a step updates state and storage, completing a lesson adds XP once, and save failure changes `storageAvailable` to false.

```ts
expect(parseHash('#/lesson/mii-pershyi-sprait')).toEqual({
  name: 'lesson',
  slug: 'mii-pershyi-sprait',
});
expect(parseHash('#/other')).toEqual({ name: 'not-found' });
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- src/app/routes.test.ts src/progress/useProgress.test.tsx`

Expected: FAIL because route and hook modules do not exist.

- [ ] **Step 3: Implement routes**

Expose this union and helpers:

```ts
export type AppRoute =
  | { name: 'home' }
  | { name: 'lesson'; slug: string }
  | { name: 'not-found' };

export function parseHash(hash: string): AppRoute;
export function lessonHref(slug: string): string;
export function navigateTo(hash: string): void;
```

`parseHash` must catch `decodeURIComponent` failures. `lessonHref` returns `#/lesson/${encodeURIComponent(slug)}`.

- [ ] **Step 4: Implement `useProgress`**

Load once from the injected storage, hold `ProgressState` and `storageAvailable`, persist after each action, and expose:

```ts
interface ProgressActions {
  markStepDone(lessonId: string, stepId: string): void;
  markQuizPassed(lessonId: string): void;
  finishLesson(lessonId: string, slug: string, xp: number): void;
  rememberLesson(slug: string): void;
}
```

Default the storage argument to `window.localStorage`, but keep it injectable for tests.

- [ ] **Step 5: Run focused tests**

Run: `npm test -- src/app/routes.test.ts src/progress/useProgress.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit navigation and state**

```bash
git add src/app/routes* src/progress/useProgress*
git commit -m "feat: add local progress state and hash navigation"
```

### Task 6: Build the Pixel Neon home experience

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/global.css`
- Create: `src/components/AppHeader.tsx`
- Create: `src/components/SiteFooter.tsx`
- Create: `src/components/ProgressSummary.tsx`
- Create: `src/components/CourseMap.tsx`
- Create: `src/components/CampaignCard.tsx`
- Create: `src/components/LessonCard.tsx`
- Create: `src/components/CourseMap.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Write failing home-screen tests**

Render `CourseMap` with real curriculum and clean progress. Assert all six natural Ukrainian campaign titles are present, 24 lesson links exist, search `спрайт` narrows results to relevant lessons, a difficulty filter can be cleared, and advanced lessons remain clickable even when earlier lessons are unfinished.

- [ ] **Step 2: Run the test to verify failure**

Run: `npm test -- src/components/CourseMap.test.tsx`

Expected: FAIL because home components do not exist.

- [ ] **Step 3: Add shared theme tokens**

Define named variables for the selected direction:

```css
:root {
  color-scheme: dark;
  --ink: #17132e;
  --ink-raised: #211b3e;
  --surface: #f8f7fc;
  --text-on-dark: #fffdf7;
  --text-muted-dark: #aaa2c2;
  --text: #241f39;
  --text-muted: #6f687f;
  --purple: #7757f6;
  --pink: #ff68a7;
  --mint: #82f3ce;
  --yellow: #f5dc58;
  --focus: #9beaff;
  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 24px;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
```

Add a reset, dark page background, readable line length, 44px controls, visible `:focus-visible`, and `prefers-reduced-motion` handling.

- [ ] **Step 4: Implement the home components**

`AppHeader` shows the brand, a `Курс` link and total XP. `ProgressSummary` shows a resume button, completed count and percentage. `CourseMap` owns controlled search/difficulty filters and renders every campaign. `LessonCard` uses `lessonHref`, status text (`Не розпочато`, `У процесі`, `Завершено`) and never applies a disabled state based on prerequisites. `SiteFooter` renders: `КодКвест — незалежний навчальний проєкт. Microsoft MakeCode є продуктом Microsoft.`

- [ ] **Step 5: Compose the home route**

Replace the temporary `App` with a component that subscribes to `hashchange`, uses `parseHash`, initializes `useProgress`, and renders the home route. Render `SiteFooter` on home and lesson routes. Import `tokens.css` and `global.css` from `main.tsx`.

- [ ] **Step 6: Run focused and full tests**

Run: `npm test -- src/components/CourseMap.test.tsx`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS with no TypeScript errors.

- [ ] **Step 7: Commit the home experience**

```bash
git add src/app src/components src/styles src/main.tsx
git commit -m "feat: add Pixel Neon course map"
```

### Task 7: Build the complete lesson journey

**Files:**
- Create: `src/components/LessonScreen.tsx`
- Create: `src/components/StepNavigator.tsx`
- Create: `src/components/ChallengePanel.tsx`
- Create: `src/components/Quiz.tsx`
- Create: `src/components/LessonScreen.test.tsx`
- Create: `src/components/NotFound.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/styles/global.css`

- [ ] **Step 1: Write failing lesson interaction tests**

Render a real lesson with a clean state and mocked progress actions. Assert the objective appears first, `Відкрити MakeCode` has `target="_blank"` and `rel="noreferrer noopener"`, the next button advances one step, a hint is hidden until requested, the challenge appears after practical steps, a wrong quiz choice displays the explanation without completing the lesson, and a correct answer enables `Завершити місію`.

- [ ] **Step 2: Run the test to verify failure**

Run: `npm test -- src/components/LessonScreen.test.tsx`

Expected: FAIL because lesson components do not exist.

- [ ] **Step 3: Implement step navigation and challenge**

`StepNavigator` receives the lesson steps, current index and completed IDs; it renders an ordered progress list with `aria-current="step"`. `ChallengePanel` renders the independent prompt and a disclosure button for its optional hint.

- [ ] **Step 4: Implement the retryable quiz**

`Quiz` owns the current selection. On submit it always shows `quiz.explanation`; it calls `onPassed` only for `correctIndex`. A wrong answer keeps all controls available and changes the submit label to `Спробувати ще раз`.

- [ ] **Step 5: Implement `LessonScreen`**

The screen receives a `Lesson`, matching `LessonProgress`, progress actions and a home handler. It renders objective, one current practical step at a time, expected result, optional hint, MakeCode action, challenge, quiz and completion panel. On mount call `rememberLesson(slug)`. On final completion call `finishLesson(id, slug, xp)` exactly once through the idempotent progress service.

- [ ] **Step 6: Add lesson and not-found routing**

In `App`, look up `lessonBySlug`. Render `LessonScreen` for valid lessons and `NotFound` for unknown slugs/routes. `NotFound` contains a clear Ukrainian message and a link to `#/`.

- [ ] **Step 7: Run tests and typecheck**

Run: `npm test -- src/components/LessonScreen.test.tsx src/app/routes.test.ts`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 8: Commit the lesson journey**

```bash
git add src/app src/components src/styles
git commit -m "feat: add guided lesson experience"
```

### Task 8: Integrate rewards and storage failure feedback

**Files:**
- Create: `src/components/AchievementToast.tsx`
- Create: `src/components/StorageNotice.tsx`
- Create: `src/components/App.integration.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/styles/global.css`

- [ ] **Step 1: Write a failing integration test**

Start at `#/lesson/znaiomstvo-z-arcade` with clean storage. Complete all steps, pass the quiz and finish the mission. Assert the reward announces `+100 XP`, the home page shows the lesson as completed, and rerendering from stored state keeps XP at 100. Add a second test with blocked storage and assert `Прогрес не зберігається` appears while lesson content remains usable.

- [ ] **Step 2: Run the integration test to verify failure**

Run: `npm test -- src/components/App.integration.test.tsx`

Expected: FAIL because reward and storage-notice behavior is missing.

- [ ] **Step 3: Implement reward feedback**

`AchievementToast` is a dismissible `role="status"` panel with lesson title, XP gained and campaign reward when the last mission in a campaign is completed. Use local UI state only; do not persist whether the toast was seen.

- [ ] **Step 4: Implement storage feedback**

`StorageNotice` renders only when `storageAvailable` is false. Explain in one sentence that lessons work normally but progress disappears when the page closes. Do not use a modal.

- [ ] **Step 5: Connect both states in `App`**

Render `StorageNotice` beneath the header on every route. Set a short-lived completion result after a successful `finishLesson` action and pass it to `AchievementToast`.

- [ ] **Step 6: Run the full test suite**

Run: `npm test`

Expected: PASS for curriculum, progress, routes, course map, lessons and integration.

- [ ] **Step 7: Commit integrated progress feedback**

```bash
git add src/app src/components src/styles
git commit -m "feat: add rewards and storage feedback"
```

### Task 9: Add final artwork and responsive/accessibility polish

**Files:**
- Create: `src/assets/hero-arcade.webp`
- Modify: `src/components/ProgressSummary.tsx`
- Modify: `src/styles/global.css`
- Modify: `src/components/*.tsx`

- [ ] **Step 1: Create and inspect one hero asset**

Generate one landscape pixel-art image without text: a diverse 10–12-year-old game creator holding a handheld arcade console, surrounded by a few friendly game sprites, dark navy/purple background, mint/pink/yellow highlights, crisp modern pixel art, generous empty area on the left for UI copy, approximately 3:2. Save it as `src/assets/hero-arcade.webp` and inspect it before use.

- [ ] **Step 2: Integrate the artwork semantically**

Import it into `ProgressSummary`. Use descriptive Ukrainian alt text when the character adds meaning; use empty alt only if the final crop is purely decorative. Reserve width/height/aspect-ratio to prevent layout shift.

- [ ] **Step 3: Complete responsive behavior**

At desktop widths, show the resume content and art side by side and the lesson navigation as a left rail. Below 900px, stack the hero and make campaigns two columns. Below 640px, use one column, make lesson navigation a compact progress header, preserve 44px controls and keep the MakeCode action visible without covering content.

- [ ] **Step 4: Run an accessibility code pass**

Confirm one `h1` per route, ordered heading levels, landmark labels, button `type`, form labels, no clickable `div`, meaningful link text, visible focus, `aria-live` only for progress/reward feedback, and no color-only completion signal. Add a test that tabs to the first lesson and activates it with Enter.

- [ ] **Step 5: Run verification**

Run: `npm run check`

Expected: TypeScript, all tests and production build pass.

- [ ] **Step 6: Commit the polished experience**

```bash
git add src
git commit -m "feat: polish responsive accessible experience"
```

### Task 10: Document delivery and perform final verification

**Files:**
- Create: `README.md`
- Modify: `index.html`
- Modify: `vite.config.ts`

- [ ] **Step 1: Add project and deployment documentation**

Document the audience, course structure, commands (`npm install`, `npm run dev`, `npm test`, `npm run build`), the generated `dist/` folder, progress privacy, and deployment to GitHub Pages or any static host. Explicitly state that GitHub Gist stores files but does not directly serve the React site as a normal webpage.

- [ ] **Step 2: Verify metadata and static paths**

Confirm the page title, Ukrainian description, `lang="uk"` and theme color match KodKvest. Add an inline data-URI SVG favicon made from four abstract colored pixel squares; it contains no text or external request. Confirm `base: './'` and that built JS, CSS and artwork URLs are relative.

- [ ] **Step 3: Run the final automated gate from a clean install**

Run:

```bash
npm ci
npm run check
```

Expected: installation succeeds; typecheck, tests and build all exit 0.

- [ ] **Step 4: Inspect the built output**

Run:

```bash
test -f dist/index.html
find dist -maxdepth 2 -type f | sort
```

Expected: `dist/index.html`, hashed JS/CSS assets and the optimized hero artwork are present; no source maps, secrets or server entrypoints are required.

- [ ] **Step 5: Perform the final manual acceptance pass**

Verify at desktop, tablet and mobile widths: new-user start, resume flow, all 24 lessons visible, search/filter reset, one complete lesson, wrong/right quiz feedback, refresh persistence, invalid slug recovery, keyboard-only navigation, reduced motion and blocked-storage fallback. Confirm every MakeCode URL uses the official domain.

- [ ] **Step 6: Commit delivery documentation**

```bash
git add README.md index.html vite.config.ts package-lock.json
git commit -m "docs: add KodKvest development and deployment guide"
```
