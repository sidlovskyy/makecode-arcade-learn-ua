# KodKvest Double Page Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the home page and every one of the 24 lesson pages two independent reviews, fix every evidence-backed learning or usability issue, and re-verify the static course.

**Architecture:** The controller runs a read-only review pipeline before any fix: one fresh learning reviewer and one fresh visual/interaction reviewer per page. Findings are consolidated by page and campaign into an audit ledger, then implemented in seven isolated TDD batches. Every page changed by a fix receives two fresh scoped re-reviews before final whole-site verification.

**Tech Stack:** React 19, TypeScript 5.9, Vite 8, Vitest 5, Playwright 1.63, MakeCode Arcade authoring renderer, Markdown audit artifacts, Git.

**Spec:** `docs/superpowers/specs/2026-09-12-kodkvest-double-page-review-design.md`

---

## Global constraints

- Review exactly 25 pages: home plus `lesson-01` through `lesson-24`.
- Dispatch exactly two fresh, independent primary reviewer agents for each page: role A learning/language, role B visual/interaction/accessibility.
- Reviewers may write only their assigned ignored report file. They must not edit tracked files, commit, alter Git state, or spawn subagents.
- Do not expose one reviewer’s report to the other reviewer assigned to the same page.
- Run at most three child agents concurrently.
- Every finding needs reproducible evidence. Style preference alone is not a fix requirement.
- Prioritize factual learning correctness, whether the promised result can occur, natural Ukrainian for ages 10–12, and exact agreement between prose and visuals.
- Keep the application static and local at runtime; no backend, iframe, analytics, or runtime MakeCode renderer.
- Preserve all 24 lesson IDs, 145 step IDs, ID-keyed progress, canonical slugs, and legacy aliases.
- Use current MakeCode Arcade verification for modified block, Python, extension, or game behavior.
- Regenerate only affected SVGs and prove unrelated visual assets byte-identical.
- Do not push, publish, configure MCP, or alter unrelated `.superpowers` workspaces.

## Review inventory

| Page key | Route | Primary source | Learning report | Visual report |
|---|---|---|---|---|
| `home` | `#/` | `site/src/app/App.tsx`, `site/src/components/CourseMap.tsx` | `reports/home-learning.md` | `reports/home-visual.md` |
| `lesson-01` | `#/lesson/znaiomstvo-z-arcade` | `site/src/curriculum/campaign-01.ts` | `reports/lesson-01-learning.md` | `reports/lesson-01-visual.md` |
| `lesson-02` | `#/lesson/mii-pershyi-sprait` | `site/src/curriculum/campaign-01.ts` | `reports/lesson-02-learning.md` | `reports/lesson-02-visual.md` |
| `lesson-03` | `#/lesson/heroi-pid-kontrolem` | `site/src/curriculum/campaign-01.ts` | `reports/lesson-03-learning.md` | `reports/lesson-03-visual.md` |
| `lesson-04` | `#/lesson/pikselni-perehony` | `site/src/curriculum/campaign-01.ts` | `reports/lesson-04-learning.md` | `reports/lesson-04-visual.md` |
| `lesson-05` | `#/lesson/knopky-i-podii` | `site/src/curriculum/campaign-02.ts` | `reports/lesson-05-learning.md` | `reports/lesson-05-visual.md` |
| `lesson-06` | `#/lesson/koly-spraity-zustrichaiutsia` | `site/src/curriculum/campaign-02.ts` | `reports/lesson-06-learning.md` | `reports/lesson-06-visual.md` |
| `lesson-07` | `#/lesson/rakhunok-zhyttia-chas` | `site/src/curriculum/campaign-02.ts` | `reports/lesson-07-learning.md` | `reports/lesson-07-visual.md` |
| `lesson-08` | `#/lesson/lovy-zirky` | `site/src/curriculum/campaign-02.ts` | `reports/lesson-08-learning.md` | `reports/lesson-08-visual.md` |
| `lesson-09` | `#/lesson/snariady-i-nebezpeky` | `site/src/curriculum/campaign-03.ts` | `reports/lesson-09-learning.md` | `reports/lesson-09-visual.md` |
| `lesson-10` | `#/lesson/rishennia-hry` | `site/src/curriculum/campaign-03.ts` | `reports/lesson-10-learning.md` | `reports/lesson-10-visual.md` |
| `lesson-11` | `#/lesson/hra-ne-zupyniaietsia` | `site/src/curriculum/campaign-03.ts` | `reports/lesson-11-learning.md` | `reports/lesson-11-visual.md` |
| `lesson-12` | `#/lesson/kosmichnyi-zakhysnyk` | `site/src/curriculum/campaign-03.ts` | `reports/lesson-12-learning.md` | `reports/lesson-12-visual.md` |
| `lesson-13` | `#/lesson/zhyvi-personazhi` | `site/src/curriculum/campaign-04.ts` | `reports/lesson-13-learning.md` | `reports/lesson-13-visual.md` |
| `lesson-14` | `#/lesson/buduiemo-kartu` | `site/src/curriculum/campaign-04.ts` | `reports/lesson-14-learning.md` | `reports/lesson-14-visual.md` |
| `lesson-15` | `#/lesson/meshkantsi-svitu` | `site/src/curriculum/campaign-04.ts` | `reports/lesson-15-learning.md` | `reports/lesson-15-visual.md` |
| `lesson-16` | `#/lesson/zahublenyi-krystal` | `site/src/curriculum/campaign-04.ts` | `reports/lesson-16-learning.md` | `reports/lesson-16-visual.md` |
| `lesson-17` | `#/lesson/rivni-ta-skladnist` | `site/src/curriculum/campaign-05.ts` | `reports/lesson-17-learning.md` | `reports/lesson-17-visual.md` |
| `lesson-18` | `#/lesson/rozumni-suprotyvnyky` | `site/src/curriculum/campaign-05.ts` | `reports/lesson-18-learning.md` | `reports/lesson-18-visual.md` |
| `lesson-19` | `#/lesson/vid-prototypu-do-hry` | `site/src/curriculum/campaign-05.ts` | `reports/lesson-19-learning.md` | `reports/lesson-19-visual.md` |
| `lesson-20` | `#/lesson/arena-bosiv` | `site/src/curriculum/campaign-05.ts` | `reports/lesson-20-learning.md` | `reports/lesson-20-visual.md` |
| `lesson-21` | `#/lesson/vid-blokiv-do-python` | `site/src/curriculum/campaign-06.ts` | `reports/lesson-21-learning.md` | `reports/lesson-21-visual.md` |
| `lesson-22` | `#/lesson/python-u-hri` | `site/src/curriculum/campaign-06.ts` | `reports/lesson-22-learning.md` | `reports/lesson-22-visual.md` |
| `lesson-23` | `#/lesson/hrafika-maistra` | `site/src/curriculum/campaign-06.ts` | `reports/lesson-23-learning.md` | `reports/lesson-23-visual.md` |
| `lesson-24` | `#/lesson/moia-vlasna-hra` | `site/src/curriculum/campaign-06.ts` | `reports/lesson-24-learning.md` | `reports/lesson-24-visual.md` |

The controller must verify the routes against `site/src/curriculum/campaign-*.ts` before dispatch; if the table contains a transcription error, the source slug is authoritative and the plan is corrected before reviews begin.

## Standard primary-review briefs

### Role A — learning/language brief

For the assigned page only:

1. Read the complete lesson object, prerequisite lesson ending, visual descriptors, corresponding authoring catalog entries, and existing tests.
2. Open every step of the live local page at desktop width.
3. Check Ukrainian grammar and vocabulary for ages 10–12, cognitive load, prerequisite assumptions, exact action/result agreement, hints, challenge, quiz, and creative-choice wording.
4. Validate every taught MakeCode value/API/behavior. Use current official Arcade in an isolated temporary project when the result is uncertain or behavioral.
5. Write the assigned report with the assigned page key followed by `— learning review` as its title, then use these exact headings:

```markdown
# Assigned page — learning review

## Checks performed
- List the exact source, browser, compiler, or simulator evidence inspected.

## Critical
- None.

## Important
- For each finding, name the exact step ID, problem, reproduction evidence, and correction.

## Minor
- None.

## Verdict
`PASS` or `CHANGES_REQUESTED`
```

### Role B — visual/interaction brief

For the assigned page only:

1. Read the lesson descriptors, resolved visual assets, relevant runtime components/styles, and existing browser tests.
2. Open every step at 1440×900, 820×1180, and 390×844.
3. Check instruction → visual → expected-result order, asset loading, focus geometry, native-block completeness, editor single-control callouts, Python/comparison layout, guide actionability, clipping, overflow, lightbox, keyboard, alternative text, progress, hints, quiz, XP, and review behavior relevant to the page.
4. Record browser dimensions, screenshots, DOM evidence, or source evidence for every issue.
5. Write the assigned report using the same structure, replacing the title with `visual review`.

## Task 1: Create the ignored audit workspace and baseline

**Files:**

- Create ignored: `.superpowers/page-audit/2026-09-12-kodkvest-double-page-review/matrix.md`
- Create ignored: `.superpowers/page-audit/2026-09-12-kodkvest-double-page-review/reports/`
- Create ignored: `.superpowers/page-audit/2026-09-12-kodkvest-double-page-review/consolidated/`
- Modify: `.git/info/exclude`

- [ ] **Step 1:** Add only `.superpowers/page-audit/` to `.git/info/exclude` if the existing ignore rules do not already cover it.
- [ ] **Step 2:** Create a matrix with 25 rows and columns `learning`, `visual`, `findings`, `fix`, and `re-review`; initialize each review cell to `pending`.
- [ ] **Step 3:** Verify all route slugs with a small read-only TypeScript/Node extraction from `campaign-*.ts`; correct any table mismatch in this plan before dispatch.
- [ ] **Step 4:** Run the clean baseline from `site/`:

```bash
npm run check
npm run test:e2e
npm audit --audit-level=high
```

Expected: 175 Vitest, 217 Node authoring tests, 96 E2E tests, 99 valid assets, successful build, zero high vulnerabilities.

- [ ] **Step 5:** Record base commit, commands, counts, and server URL in `matrix.md`. Do not commit ignored audit state.

## Task 2: Dispatch the 50 primary page reviews

**Files:**

- Write ignored: `.superpowers/page-audit/2026-09-12-kodkvest-double-page-review/reports/*.md`
- Modify ignored: `.superpowers/page-audit/2026-09-12-kodkvest-double-page-review/matrix.md`

- [ ] **Step 1:** For each row in the Review inventory, dispatch a fresh Role A agent and a different fresh Role B agent with `fork_turns: none`, the exact page key/route/source/report path, the relevant standard brief above, repository root, current commit, local server URL, and the no-edit/no-subagent constraints.
- [ ] **Step 2:** Keep no more than three reviewers active. Do not send either same-page report to its counterpart.
- [ ] **Step 3:** After each agent completes, read its report and verify the required headings, concrete evidence for findings, and explicit verdict. Re-dispatch the same role with missing report requirements if necessary; do not count an incomplete report.
- [ ] **Step 4:** Mark the corresponding matrix cell `PASS` or `CHANGES_REQUESTED` and link the report.
- [ ] **Step 5:** Verify mechanically that exactly 50 report files exist, each expected filename occurs once, all 25 pages have both roles, and every report contains `Checks performed`, all three severity headings, and `Verdict`.

Expected: two independent completed primary reviews for all 25 pages, with no tracked-file changes.

## Task 3: Consolidate and reproduce findings

**Files:**

- Create ignored: `.superpowers/page-audit/2026-09-12-kodkvest-double-page-review/consolidated/home.md`
- Create ignored: `.superpowers/page-audit/2026-09-12-kodkvest-double-page-review/consolidated/campaign-01.md`
- Create ignored: `.superpowers/page-audit/2026-09-12-kodkvest-double-page-review/consolidated/campaign-02.md`
- Create ignored: `.superpowers/page-audit/2026-09-12-kodkvest-double-page-review/consolidated/campaign-03.md`
- Create ignored: `.superpowers/page-audit/2026-09-12-kodkvest-double-page-review/consolidated/campaign-04.md`
- Create ignored: `.superpowers/page-audit/2026-09-12-kodkvest-double-page-review/consolidated/campaign-05.md`
- Create ignored: `.superpowers/page-audit/2026-09-12-kodkvest-double-page-review/consolidated/campaign-06.md`

- [ ] **Step 1:** Dispatch one fresh adjudicator for home and one per campaign. Each reads only the ten reports for its four lessons, or the two home reports, plus relevant source/tests.
- [ ] **Step 2:** Require each adjudicator to merge duplicates, reproduce single-reviewer findings, resolve conflicts against current Arcade/browser evidence, assign severity, and name a concrete regression test target.
- [ ] **Step 3:** Reject findings that are only preferences and document why. Retain all evidence-backed Minor findings for explicit fix/defer decisions.
- [ ] **Step 4:** Update `matrix.md` with accepted issue IDs in stable page/step order.
- [ ] **Step 5:** Run `git status --short` and verify reviewers/adjudicators changed no tracked files.

## Tasks 4–10: Implement accepted findings in seven batches

Run these batches sequentially:

| Task | Batch | Source scope | Required focused suites | Commit message |
|---|---|---|---|---|
| 4 | home | `site/src/app`, `site/src/components`, `site/src/styles` | `App.integration.test.tsx`, `CourseMap.test.tsx`, affected E2E grep | `fix: improve home page learning review findings` |
| 5 | lessons 1–4 | `campaign-01.ts`, catalog 01, affected assets | curriculum/visual tests, `campaign-01.test.mjs`, affected E2E grep | `fix: improve campaign one learning review findings` |
| 6 | lessons 5–8 | `campaign-02.ts`, catalog 02, affected assets | curriculum/visual tests, `campaign-02.test.mjs`, affected E2E grep | `fix: improve campaign two learning review findings` |
| 7 | lessons 9–12 | `campaign-03.ts`, catalog 03, affected assets | curriculum/visual tests, `campaign-03.test.mjs`, affected E2E grep | `fix: improve campaign three learning review findings` |
| 8 | lessons 13–16 | `campaign-04.ts`, catalog 04, affected assets | curriculum/visual tests, `campaign-04.test.mjs`, affected E2E grep | `fix: improve campaign four learning review findings` |
| 9 | lessons 17–20 | `campaign-05.ts`, catalog 05, affected assets | curriculum/visual tests, `campaign-05.test.mjs`, affected E2E grep | `fix: improve campaign five learning review findings` |
| 10 | lessons 21–24 | `campaign-06.ts`, catalog 06, affected assets | curriculum/visual tests, `campaign-06.test.mjs`, affected E2E grep | `fix: improve campaign six learning review findings` |

For each Task 4–10:

- [ ] **Step 1:** Read the corresponding consolidated report. If it contains no accepted findings, mark the batch `no-change` in the matrix and proceed without a commit.
- [ ] **Step 2:** For every accepted finding, add a regression that fails for the reproduced symptom. Content assertions must name the exact lesson/step. Browser assertions must use the affected route and required viewport. Native behavior assertions must exercise the catalog/API boundary rather than only search prose.
- [ ] **Step 3:** Run the focused test command and record the expected RED failure in the batch report.
- [ ] **Step 4:** Make the smallest source/content/style/catalog correction. When native blocks or Python change, verify the exact program in current MakeCode Arcade before accepting it.
- [ ] **Step 5:** Regenerate only affected SVG entries through the trusted renderer. Compare all 99 assets with the batch base; require every unrelated asset to remain byte-identical.
- [ ] **Step 6:** Run focused GREEN suites, then from `site/`:

```bash
npm run check
```

- [ ] **Step 7:** Commit only the accepted batch fixes and tests with the exact message in the table. Record the commit and resolved issue IDs in `matrix.md`.

## Task 11: Double re-review every changed page

**Files:**

- Write ignored re-review reports by appending `-learning-rereview.md` and `-visual-rereview.md` to each changed page key under `.superpowers/page-audit/2026-09-12-kodkvest-double-page-review/reports/`
- Modify ignored: `.superpowers/page-audit/2026-09-12-kodkvest-double-page-review/matrix.md`

- [ ] **Step 1:** Derive the changed-page list from accepted issue IDs and fix commits, not from reviewer memory.
- [ ] **Step 2:** For each changed page, dispatch two fresh agents: one learning re-reviewer and one visual re-reviewer. Neither may be a primary reviewer or fix implementer for that page.
- [ ] **Step 3:** Give each re-reviewer the original findings, relevant consolidated report, fix commit range, and regression evidence. Do not give it the other re-reviewer’s result.
- [ ] **Step 4:** Require an `ADDRESSED`/`NOT_ADDRESSED` verdict for every original finding and allow new issues only when caused by the fix diff.
- [ ] **Step 5:** If a Critical or Important finding remains, resume the corresponding fix-batch implementer, add/adjust a failing regression, fix, and repeat two fresh scoped re-reviews for that page.
- [ ] **Step 6:** Mark the page complete only after both scoped reports approve it.

## Task 12: Publish the consolidated audit report

**Files:**

- Create: `docs/superpowers/reviews/2026-09-12-kodkvest-double-page-audit.md`

- [ ] **Step 1:** Generate a stable page-order table containing both primary verdicts, accepted findings, fix commit, and both re-review verdicts where applicable.
- [ ] **Step 2:** Summarize every Critical, Important, and Minor finding, including rejected preference-only observations and the evidence-based reason for rejection.
- [ ] **Step 3:** Record exact counts: 25 pages, 50 primary reports, changed pages, accepted/fixed/deferred findings, re-review reports, lesson/step/visual/asset totals.
- [ ] **Step 4:** Link the design, implementation plan, relevant source/tests, and commit hashes. Do not link ignored temporary screenshots as permanent evidence.
- [ ] **Step 5:** Run `git diff --check`, then commit the report as `docs: record double page learning audit`.

## Task 13: Final whole-site verification and review

**Files:**

- Modify only if final regression proves a problem: affected source/test files

- [ ] **Step 1:** Run a clean install and the complete verification sequence:

```bash
npm ci
npm run check
npm run test:e2e
npm audit --audit-level=high
```

- [ ] **Step 2:** Verify mechanically:

```bash
rg -ni 'javascript|typescript' src/curriculum/campaign-06.ts
rg -n -- '--docs\?render=1|renderblocks|<iframe' src dist
```

Expected: no learner-facing campaign-6 JavaScript/TypeScript and no runtime renderer/iframe markers.

- [ ] **Step 3:** Verify 24 lessons, 145 stable unique step IDs, the exact five-kind inventory, 93 SVGs, six editor WebPs, and all legacy aliases/progress behavior.
- [ ] **Step 4:** Dispatch a fresh final whole-branch reviewer on the most capable model. Review the entire range from the plan execution base through HEAD against the design, plan, raw-report matrix, consolidated report, code, tests, and assets.
- [ ] **Step 5:** Fix any Critical or Important final finding in one controlled TDD wave, then obtain one scoped re-review.
- [ ] **Step 6:** Confirm `git status --short` contains only pre-existing ignored/untracked workflow state. Do not push or publish.

## Expected final handoff

- 25 pages each reviewed twice by fresh independent agents;
- every changed page approved twice again;
- evidence-backed learning/content issues fixed with regressions;
- consolidated audit report committed;
- exact current course inventory preserved;
- full offline checks, 3-viewport E2E, security audit, and final review clean;
- local development server may remain running, but no deployment occurs without user authorization.
