# KodKvest Double Page Review Design

## Goal

Independently review every learner-facing page of KodKvest twice, prioritize learning-content accuracy, fix every confirmed issue, and prove the corrected course still works as a static Ukrainian React application.

## Scope

The review covers 25 pages:

1. the course home page;
2. lesson pages `lesson-01` through `lesson-24`.

Alias URLs for the renamed lessons are compatibility scenarios of lessons 21 and 22, not additional pages.

Every page receives two fresh, independent reviewer agents. Reviewers do not edit files and do not see the other reviewer’s conclusions before submitting their own report.

## Review roles

### Reviewer A: learning and language

For one assigned page, Reviewer A checks:

- natural, age-appropriate Ukrainian for learners aged 10–12;
- a clear learning goal and logical progression from prior knowledge;
- manageable cognitive load and explicit placement instructions;
- agreement among instruction, visual, expected result, hint, challenge, quiz, and explanation;
- correctness of MakeCode Arcade blocks, current API names, values, event behavior, and game mechanics;
- correctness and selectable formatting of Python where present;
- whether an exercise can actually produce the promised result;
- whether examples distinguish required behavior from optional creative choices;
- privacy and safe-sharing guidance where publishing is taught.

### Reviewer B: visual, interaction, and accessibility

For the same page, Reviewer B checks:

- the visual kind matches the learning action;
- cumulative block diagrams include all prior required state and use native blocks without gray fallbacks;
- focus rectangles enclose the current change and editor callouts point to one visible control;
- Python indentation, copying, scrolling, and Blocks↔Python comparisons remain usable;
- desktop, tablet, and mobile layout, clipping, overflow, and lightbox readability;
- keyboard navigation, focus restoration, labels, alternative text, contrast, and reduced-motion behavior;
- step navigation, hints, challenge, quiz, XP, review mode, restart, and saved progress;
- local-only runtime assets and absence of backend/runtime renderer dependencies.

## Review evidence contract

Each reviewer writes one report for one page with:

- page and reviewer role;
- checks performed;
- findings grouped as Critical, Important, and Minor;
- exact lesson/step and file/line references when known;
- concrete evidence: source mismatch, native MakeCode behavior, browser measurement, screenshot, or test result;
- recommended correction;
- explicit `No findings` when applicable.

An opinion without evidence is recorded as an observation, not automatically changed.

## Execution model

The repository allows three child agents alongside the coordinator. Fifty fresh review agents therefore run in bounded waves, with at most three active at once. A page is not considered reviewed until both role reports exist.

The coordinator maintains a matrix of all 25 pages and the two required reports. Review jobs are read-only. No review agent may commit, modify the working tree, or spawn another agent.

## Finding adjudication

After all reports for a campaign are available, findings are consolidated:

1. Duplicate findings become one issue with both evidence sources.
2. A single-reviewer finding is accepted when its evidence reproduces the problem.
3. Conflicting findings are resolved against current MakeCode Arcade behavior, the existing course design spec, and an explicit browser or compiler reproduction.
4. Content preferences without a correctness, clarity, accessibility, or age-fit impact are not changed.
5. Every accepted issue receives a severity and a regression target before implementation.

The user’s statement that visible issues already exist is treated as a reason for a broad audit, not as evidence for any specific change because no examples were supplied.

## Fix strategy

Confirmed issues are fixed in seven controlled batches:

1. home page;
2. campaign 1, lessons 1–4;
3. campaign 2, lessons 5–8;
4. campaign 3, lessons 9–12;
5. campaign 4, lessons 13–16;
6. campaign 5, lessons 17–20;
7. campaign 6, lessons 21–24.

Each batch:

- begins with failing regression tests for accepted findings;
- changes only the smallest relevant curriculum, component, style, catalog, or asset surface;
- verifies current MakeCode Arcade when block/Python/API behavior changes;
- regenerates only affected block assets and proves unrelated assets byte-identical;
- runs focused tests followed by the full offline check;
- receives two fresh scoped re-reviewers for every page changed by a fix.

If a batch has no accepted findings, it produces a review record but no content commit.

## Verification

Final acceptance requires:

- 50 original page-review reports, two for each of 25 pages;
- two scoped re-reviews for every changed page;
- all accepted Critical and Important findings resolved;
- Minor findings either fixed or explicitly recorded with rationale;
- 24 lessons and 145 stable lesson-step IDs;
- the existing exact visual inventory remains internally consistent;
- current MakeCode verification for modified block/Python/game behavior;
- `npm ci`, `npm run check`, `npm run test:e2e`, and `npm audit --audit-level=high` passing;
- desktop, tablet, and mobile browser verification;
- no external runtime requests, backend, iframe, or runtime renderer;
- working tree containing only pre-existing untracked workflow state.

## Non-goals

- Redesigning the visual identity without a demonstrated usability problem.
- Adding a backend, authentication, analytics, or learner accounts.
- Replacing React, TypeScript, or the existing static-hosting model.
- Expanding beyond the home page and 24 lesson pages.
- Publishing or pushing the repository without separate user authorization.
