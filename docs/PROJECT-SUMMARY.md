# Project Summary

## Project purpose

Study Flow is a Vietnamese, Quizlet-style, local-first examination study application. It presents repository-owned subject question banks in Learn, Test, Questions, and Summary experiences. The current application works without an account, database, or remote backend; browser storage is the production persistence mechanism.

A provider-neutral backend, synchronization, import, permissions, and Supabase migration foundation already exists in the repository, but it is not connected to the production UI or routes.

## Current features

- Subject library with total, seen, and mastered counts.
- Subject detail with Learn, Test, and Questions entry points.
- Learn sessions with resume, restart, question/option shuffle, exact-set multi-answer scoring, explanations, review notes, keyboard controls, correct-answer sound, mastery streaks, and incorrect-answer retries.
- Test generation from all or unmastered questions, presets/custom counts, stable shuffled snapshots, resume, unanswered confirmation, scoring, retake, and result review.
- Paginated question-bank view with answers and explanations visible.
- Cumulative Learn summary.
- Subject-scoped content-version recovery and one MMA301 v1-to-v2 progress migration.
- Responsive layouts and localized loading, not-found, error, and confirmation UI.
- Vercel page analytics.

## Technology stack

| Area | Current implementation |
| --- | --- |
| Framework | Next.js 16.2.11, App Router, Turbopack in development |
| UI | React 19.2.4 and React DOM 19.2.4 |
| Language | TypeScript 5 with strict mode; `allowJs` is enabled but application code is TypeScript/TSX |
| Node.js | Node 22 in CI and recommended by `README.md`; no `engines` constraint in `package.json` |
| Package manager | npm, identified by `package-lock.json` and CI commands |
| Build | `next build`; `prebuild` generates and validates subject data |
| Routing | Next.js App Router under `src/app` |
| State management | Feature-local React state plus pure Learn/Test reducers; no external state-management package |
| Validation | Zod 3.24 for subjects and persisted snapshots |
| Styling | Tailwind CSS 4/PostCSS is available; most application styling is semantic global CSS in `src/app/globals.css` |
| Unit/component tests | Vitest 2 with jsdom and Testing Library |
| Browser tests | Playwright, desktop Chromium project with responsive viewport coverage |
| Lint | ESLint 9 with Next core-web-vitals and TypeScript presets |
| Formatting | No Prettier dependency or formatting configuration is present |
| Deployment | Standard Vercel-oriented Next.js deployment; no `vercel.json`, custom server, or container setup |
| Analytics | `@vercel/analytics/next`, mounted globally in `src/app/layout.tsx` |

## Main directory structure

| Path | Responsibility |
| --- | --- |
| `src/app` | App Router pages, loading UI, root layout, error/not-found UI, and the question pagination API |
| `src/components/subjects` | Subject cards and subject-detail presentation/persistence orchestration |
| `src/components/study` | Mode workspace, Learn shell, Questions list, and Summary UI |
| `src/components/test` | Test setup, runner, persistence orchestration, and results |
| `src/components/ui` | Shared confirmation dialog |
| `src/domain/subjects` | Canonical subject/question types, Zod schemas, and source-specific adapters |
| `src/domain/study` | Pure Learn session creation, reducer, resume behavior, selectors, and constants |
| `src/domain/test` | Pure Test generation, reducer, scoring, and types |
| `src/data/subjects` | Four source JSON question banks; these are authoritative local content |
| `src/data/generated` | Generated static subject registry used by production routes and components |
| `src/lib/storage` | Active Learn/Test browser-storage keys, schemas, validation, migration, load/save/remove logic |
| `src/lib/backend` | Dormant provider-neutral auth/repository/progress/import/permission/retry/remote scaffold |
| `src/hooks` | Correct-answer sound hook |
| `scripts` | Subject registry generation and data-quality validation |
| `tests` | Vitest domain, storage, component, hook, data, and backend-scaffold tests |
| `e2e` | Playwright Learn/Test and responsive regression flows |
| `supabase/migrations` | Unapplied future backend foundation schema and RLS migration |
| `.github/workflows` | CI generation, validation, lint, typecheck, unit, build, and browser checks |

## Route and screen map

| Route | Main implementation | Behavior |
| --- | --- | --- |
| `/` | `src/app/page.tsx` → `SubjectCard` | Lists generated subjects; each card hydrates local Learn statistics |
| `/subjects/[slug]` | `src/app/subjects/[slug]/page.tsx` → `SubjectDetail` | Subject overview, local progress initialization/reset, and mode links |
| `/subjects/[slug]/learn` | `src/app/subjects/[slug]/learn/page.tsx` | Compatibility redirect to the canonical Learn URL |
| `/subjects/[slug]/study?mode=learn` | `SubjectStudyWorkspace` → `StudyShell` | Active Learn session and resume/retry flow |
| `/subjects/[slug]/study?mode=test` | `SubjectStudyWorkspace` → `TestShell` | Test setup, active test, and results |
| `/subjects/[slug]/study?mode=questions` | `SubjectStudyWorkspace` → `QuestionList` | Paginated question bank with visible answers |
| `/subjects/[slug]/summary` | `src/app/subjects/[slug]/summary/page.tsx` → `Summary` | Cumulative Learn statistics |
| `/api/subjects/[slug]/questions?offset=N` | `src/app/api/subjects/[slug]/questions/route.ts` | Static-registry question slices of 30, plus `nextOffset` and total |

Dynamic subject pages use `generateStaticParams()` from the generated slug registry and call `notFound()` for an unknown slug. An invalid or absent study `mode` falls back to Learn.

## Current application data flow

```text
Route request
→ App Router server page resolves `getSubject(slug)`
→ generated static subject registry
→ source-specific adapter or canonical Zod parser
→ repository JSON imported at module load
→ server passes normalized `Subject` to a client feature component
→ pure Learn/Test domain functions update state
→ active local-storage adapter validates and persists snapshots
```

The question-list API is a paginated view over the same in-memory static registry. It is not a database or backend question source. Learn and Test receive the complete normalized subject object.

## Current question-loading flow

```text
src/data/subjects/*.json
→ scripts/generate-subject-registry.ts
→ `adaptFeSwd392`, `adaptMln122`, `adaptMma301`, or `subjectSchema.parse`
→ src/data/generated/subjects.generated.ts
→ `subjects`, `subjectSlugs`, and `getSubject(slug)`
→ pages, Learn/Test workspace, and question pagination API
→ question rendering
```

The generator rejects unknown JSON files, malformed JSON, duplicate subject IDs/slugs, filename/slug mismatch, and invalid adapter/schema output. `scripts/validate-subjects.ts` adds dataset-specific counts and integrity assertions. A parse failure occurs during module generation/import and is not recoverable as an individual invalid subject in the UI.

## Current question model

Canonical questions contain stable per-subject `id` and `number`, a type (`single-choice`, `multiple-choice`, or `true-false`), at least two uniquely identified options, `correctAnswers`, a first-answer compatibility field `correctAnswer`, optional explanation, source provenance, and review metadata.

- `questionCount` is declared in subject metadata and the schema requires it to equal `questions.length`.
- Question IDs and numbers are required to be unique within a subject, but global cross-subject uniqueness is not required.
- Queue instance IDs and attempt IDs are separately generated for Learn; canonical progress remains keyed by question ID.
- Multiple answers are represented by `correctAnswers: string[]` and scored with exact set equality.
- Duplicate question IDs/numbers and invalid answer references are rejected.
- Duplicate prompt text is not rejected. Curated `dataQuality.duplicatePromptGroups` metadata references question numbers, while the dormant import service can report normalized duplicate prompts as warnings.
- Explanations and `needsReview`/`reviewNotes` are informational and do not affect scoring.

Current normalized counts are FE SWD392 263, MLN122 478, MMA301 182, and SWD392 249 questions.

## Current study-session flow

```text
Open `mode=learn`
→ `StudyShell` hydrates settings and validated subject progress
→ `resumeProgress` keeps or finds the next unanswered queue item
→ create a new session only when required
→ render current canonical question through its queue instance
→ user selects an answer or “Không biết”
→ `answerCurrent` validates option IDs and calculates exact-set result
→ aggregate `QuestionProgress` and session attempt are updated
→ incorrect/don't-know may insert one unanswered retry instance
→ committed progress is saved to localStorage
→ correct feedback auto-advances after one second
→ completed session links to Summary
```

Retry items are separate queue instances but use the same canonical question ID, so retries do not increase the canonical total. Historical answers can be replaced without adding a lifetime attempt; current behavior deliberately does not reconcile already scheduled retry items after replacement.

## Current progress-persistence flow

```text
User action
→ client component calls a pure Learn/Test reducer
→ React state receives the next snapshot
→ active storage module serializes to localStorage
→ reload parses and Zod-validates shape
→ relation checks validate current question/option/queue references
→ invalid or incompatible subject-scoped data is removed
→ resume logic restores the expected unanswered item
```

Active keys are:

- Learn: `study-flow:v1:subject:<subjectId>`
- Test: `study-flow:v1:test:<subjectId>`
- Content update notice: `study-flow:v1:notice:<subjectId>`
- Global Learn shuffle settings: `study-flow:v1:settings`
- Correct-answer sound preference: `study-flow:v1:sound`

Learn progress stores per-question status/counters/streak/last result plus an active queue, attempts, indexes, session settings, cumulative session count, lifetime attempts, and timestamps. Test stores only the latest per-subject test snapshot, selected question and option order, responses, index, status, and score. Test reads Learn mastery to create an unmastered pool but never writes Learn progress.

There is no account namespace, expiration, encryption, cross-tab coordination, or remote synchronization. Concurrent tabs are last-writer-wins. Learn save failures degrade to in-memory state with a warning; some Subject Detail and Test writes do not have equivalent local exception handling.

## Deployment and analytics

The repository is intended for Vercel as a conventional Next.js application. Local-only operation requires no environment values. `.env.example` documents three disabled public feature flags for future auth, remote progress, and admin import; active production UI does not consume them.

`src/app/layout.tsx` mounts Vercel Analytics globally. No custom study/test events, user identity, consent UI, error telemetry, or server instrumentation exists. Correct answers are present in client data and the question API, which is suitable for a study bank but not a secure examination service.

## Existing test infrastructure

- Pure Learn engine characterization, including retries, replacement, counters, completion, and resume.
- Pure Test generation/scoring/reducer behavior, including exact-set multi-answer scoring.
- Learn/Test storage shape and compatibility validation.
- Subject data/schema and curated dataset invariants.
- Study/Test component behavior and answer sound.
- Dormant backend import/progress/utility abstractions.
- Playwright Learn/Test route flows and horizontal-overflow checks in Chromium.

CI uses Node 22 and runs npm install, subject generation/clean-diff verification, data validation, lint, typecheck, Vitest, production build, and Playwright. Playwright starts `npm run dev`, so the built production server is not exercised by E2E.

## Important conventions

- Preserve stable subject IDs/slugs and question IDs/numbers.
- Increment `contentVersion` deliberately when content changes and define migration/reset consequences.
- Never derive Learn total from queue length because retries duplicate canonical questions.
- Keep Learn and Test storage/state isolated.
- Preserve exact-set multi-answer scoring.
- Apply shuffle settings only to newly created sessions and retain persisted queue/order on resume.
- Use generated registry/data validation before build.
- Render question data as text; do not inject raw HTML.
- Keep optional backend flags disabled until their complete stage is implemented and tested.

## Known technical debt

- `StudyShell`, `TestShell`, and `SubjectDetail` combine rendering, orchestration, persistence, and navigation responsibilities.
- Active UI bypasses the existing backend repository abstractions and reads static registry/storage modules directly.
- Static import failure can prevent all subject routes from loading; invalid subjects are not isolated at runtime.
- Learn persisted relation validation does not recompute all semantic counters/results from attempts.
- Historical answer replacement does not reconcile retry scheduling.
- Persisted `retryGap` is not the scheduler used by current reducer behavior.
- Test save failures are less safely handled than Learn save failures; starting a “new test” may leave the old submitted snapshot until overwritten.
- Browser state is not user-isolated and has no multi-tab conflict handling.
- The full subject is passed to the study workspace even when Questions renders pages of 30.
- Question pagination has no explicit load-more fallback when `IntersectionObserver` is unavailable.
- No direct API route tests, production-server E2E, cross-browser suite, accessibility automation, production telemetry, or real database/RLS integration test exists.
- Backend/auth/import/Supabase code is foundation-only and must not be mistaken for an active backend.
