# Project Audit Report

Audit date: 2026-07-22

Repository: `D:\FU_SU_26\quizlet_study`

Audit scope: repository-level engineering review of the current working tree, configuration, data, generated output, tests, documentation, build, and available Git history. This is not a formal penetration test, academic validation of SWD392 answers, Lighthouse audit, or production Vercel deployment test.

## Evidence classification

- **Verified** means directly observed in current repository files or command output.
- **Inferred** means a reasonable reconstruction from current code and uncommitted diffs where Git history does not record the phase.
- **Not verified** means the repository does not contain enough evidence or the activity was not performed.

Git history contains one commit, `d503da9` (`Initial commit from Create Next App`, 2026-07-22). Most current application files are modified or untracked, so history cannot establish a reliable commit-by-commit chronology for the implemented application or corrected-data update. The current working tree is the primary source of evidence.

---

## 1. Executive summary

Study Flow is a local-first Vietnamese multiple-choice study application. It statically serves repository-backed subjects, currently SWD392, and provides subject details, Learn mode, answer feedback, unknown-answer handling, retry scheduling, mastery tracking, history navigation, browser persistence, summary statistics, settings, and optional correct-answer audio. It uses no account, database, backend, analytics service, or required environment variable.

**Overall status: Functional but requires further work.**

The current working tree compiles, validates, passes 29 Vitest tests and 8 Chromium Playwright tests, and produces statically generated subject routes. The strongest areas are clear layer separation, deterministic subject generation, Zod validation of canonical data, subject-specific content-version reset, internal sound handling, strict TypeScript, responsive smoke tests, and a successful production build.

It is not assessed as production-ready for two principal reasons:

1. **Release reproducibility:** Git contains only the Create Next App baseline while much of the application, CI, tests, scripts, canonical data, and public audio are untracked. A deployment from committed `HEAD` would not represent the audited application.
2. **Correctness/reliability gaps:** “Học lại” links do not actually restart an incomplete session; persisted-state validation does not enforce important relational invariants; the domain answer operation trusts a caller-supplied question without confirming it matches the active queue item; and several mastery, completion, recovery, and accessibility cases lack tests.

Additional risks include two high and one moderate production dependency advisories reported by `npm audit --omit=dev`, E2E being absent from CI, incomplete restart/content-version E2E coverage, and documentation that does not fully describe the current corrected SWD392 v2 dataset.

---

## 2. Original project goals

The primary goals are recoverable from `codex-prompt-study-website-en.md`, `README.md`, `package.json`, tests, and implementation:

| Goal | Repository evidence | Verification |
| --- | --- | --- |
| Local-first study application | `README.md`; `src/lib/storage/local-study-storage.ts` | Verified |
| Repository-backed multiple-subject support | `src/data/subjects/`, `scripts/generate-subject-registry.ts` | Verified architecture; only one current subject |
| Integrate SWD392 source data | `src/data/subjects/swd392.json` | Verified |
| One-question-at-a-time Learn mode | `src/components/study/StudyShell.tsx` | Verified |
| Correct/incorrect feedback and “Không biết” | `StudyShell.choose`; option rendering and feedback | Verified |
| Mastery after consecutive correct answers | `src/domain/study/reducer.ts`; constants | Verified in code; second-correct path not directly tested |
| Retry incorrect, unknown, and first-correct questions | `answer` in `reducer.ts` | Verified in code; partial tests |
| Previous/next history without duplicate attempts | `move` and `StudyShell` | Verified in code and tests |
| Browser persistence and session restoration | storage adapter and Learn hydration | Verified |
| No account, backend, or database | no API/backend/auth dependencies or routes found | Verified |
| Data validation and generated registry | scripts and Zod schemas | Verified |
| Unit, component, storage, audio, and E2E tests | `tests/`, `e2e/` | Verified |
| Responsive design | CSS and viewport E2E tests | Verified at smoke-test level |
| Accessibility | semantic buttons, focus styles, dialog, `aria-live` | Partially verified |
| Vercel-ready standard Next.js build | App Router, SSG, successful `next build` | Verified locally; actual Vercel deployment not verified |
| Subject `contentVersion` reset behavior | storage adapter, tests, SWD392 v2 | Verified |
| Correct-answer sound and persisted toggle | audio hook, public asset, tests | Verified |

The intended academic correctness of corrected answer keys cannot be independently verified from application code alone. `src/data/subjects/swd392.json` records its review basis and correction metadata, and `base_pdf/SWD.pdf` exists, but this audit did not perform an academic question-by-question source comparison.

---

## 3. Current architecture

### Technology versions

From `package.json` and lockfile:

- Next.js `16.2.11`
- React and React DOM `19.2.4`
- TypeScript `^5`, strict mode enabled
- Tailwind CSS `^4` through `@tailwindcss/postcss`
- Zod `^3.24.1`
- Vitest declared `^2.1.8`, lockfile/test output `2.1.9`
- React Testing Library `^16.1.0`
- Playwright `^1.49.1`
- ESLint `^9`
- `lucide-react` is declared but no application import was found during the audit

### Important directory tree

```text
.github/workflows/ci.yml
assets/quizlet-correct.mp3
base_pdf/SWD.pdf
e2e/study-flow.spec.ts
public/assets/correct-answer.mp3
scripts/
  generate-subject-registry.ts
  validate-subjects.ts
src/
  app/
    layout.tsx
    page.tsx
    error.tsx
    not-found.tsx
    subjects/[slug]/
      page.tsx
      loading.tsx
      learn/page.tsx
      learn/loading.tsx
      summary/page.tsx
  components/
    subjects/SubjectCard.tsx
    subjects/SubjectDetail.tsx
    study/StudyShell.tsx
    study/Summary.tsx
  data/
    subjects/swd392.json
    generated/subjects.generated.ts
  domain/
    subjects/schemas.ts
    subjects/types.ts
    study/constants.ts
    study/create-session.ts
    study/reducer.ts
    study/selectors.ts
    study/types.ts
  hooks/useCorrectAnswerSound.ts
  lib/storage/
    keys.ts
    schemas.ts
    local-study-storage.ts
tests/
  setup.ts
  data/subject-validation.test.ts
  domain/study-engine.test.ts
  storage/storage.test.ts
  hooks/correct-answer-sound.test.tsx
  components/StudyShell.test.tsx
```

### App Router and component boundaries

Route files in `src/app` are Server Components by default. Dynamic subject routes use the generated registry and `generateStaticParams`; unknown slugs call `notFound()`. `SubjectCard`, `SubjectDetail`, `StudyShell`, and `Summary` are Client Components because they read browser persistence or handle interactions. This prevents server-side `localStorage` access.

### Data and registry layers

The canonical subject is `src/data/subjects/swd392.json`. `scripts/generate-subject-registry.ts` scans sorted `.json` filenames and deterministically writes `src/data/generated/subjects.generated.ts`, which exports `subjects`, `subjectsBySlug`, `subjectSlugs`, and `getSubject`. Generated imports are static and compatible with SSG.

The generator validates filenames but does not reject duplicate subject IDs or slugs across files. `Object.fromEntries` would silently overwrite a duplicate slug.

### Validation layer

`src/domain/subjects/schemas.ts` validates subject/question shape, positive versions, slug format, option uniqueness, answer-key existence, question count, ID/number uniqueness, review count, duplicate-group references, and optional answer-correction metadata. `scripts/validate-subjects.ts` adds SWD392-specific regression expectations.

### Study domain

`src/domain/study/create-session.ts` creates long-lived progress and sessions. `reducer.ts` processes answers and movement. `selectors.ts` computes stable subject-level metrics. The domain has no DOM or localStorage dependency.

### Persistence and content versions

`src/lib/storage/local-study-storage.ts` validates persisted progress using `progressSchema`, compares `subjectContentVersion`, removes only the affected subject on mismatch, and records a subject-specific update notice. Learn hydration creates fresh progress when data is missing, invalid, incompatible, or version-mismatched.

### Audio and settings

`useCorrectAnswerSound` owns one `HTMLAudioElement`, preloads `/assets/correct-answer.mp3`, resets playback position, safely handles failures, and persists `study-flow:v1:sound`. Learn settings persist shuffle preferences under `study-flow:v1:settings`.

### Testing, CI, deployment

Vitest uses jsdom and Testing Library. Playwright uses Chromium and starts `npm run dev`. CI runs install, registry generation, validation, lint, typecheck, Vitest, and build, but not Playwright. The successful local build generated `/`, 404, and static SWD392 detail/Learn/summary routes. No Vercel-specific config or required environment variables exist.

---

## 4. Implementation chronology

### Phase 1 — Create Next App baseline

**Verified Git commit:** `d503da9`, “Initial commit from Create Next App.”

The commit is the only history available. It does not record the subsequent implementation as commits.

### Phase 2 — Study application implementation

**Inference from current uncommitted working tree.**

Likely additions included:

- App Router subject, Learn, and summary routes under `src/app`.
- Client subject and study components.
- Subject schemas and generated registry scripts.
- Pure study domain and localStorage adapter.
- SWD392 canonical data.
- Tailwind-based application styling.
- Vitest, Playwright, and CI configuration.

The exact sequence, author decisions, and dates cannot be verified because these files are untracked or modified relative to the sole baseline commit.

### Phase 3 — Correct-answer sound integration

**Inference from current files and tests.**

Likely additions were `public/assets/correct-answer.mp3`, `src/hooks/useCorrectAnswerSound.ts`, sound toggle UI in `StudyShell`, README documentation, Audio mocks, and hook/component tests. The original supplied file remains at `assets/quizlet-correct.mp3`; the application-facing path is neutral.

### Phase 4 — Reliability and UI additions

**Inference.**

Current files show later additions such as settings dialog focus cycling, shuffle settings, error/loading routes, storage warning, responsive rules, and broader sound tests. No commits establish ordering.

### Phase 5 — Corrected SWD392 content update

**Verified from current data and working-tree evidence; chronology inferred because uncommitted.**

The canonical file is content version 2 and contains correction metadata. Data-dependent schema, validation, and tests reflect 249 questions, 246 four-option questions, five-option questions 19/39/42, 14 review flags, 22 explanations, and 21 corrected answers. The generated registry points only to the canonical file. Temporary corrected and obsolete source JSON files were removed from `questions/`; the directory is currently empty.

Known resolved issue: old v1 data expectations were replaced with v2 expectations. Known remaining issue: README does not explicitly document the current v2 correction statistics/provenance workflow.

---

## 5. Feature audit

| Feature | Status | Evidence | Notes or issues |
| --- | --- | --- | --- |
| Subject library | Complete | `src/app/page.tsx`; `SubjectCard` | Reads generated subjects and client progress |
| Subject details | Complete | `src/app/subjects/[slug]/page.tsx`; `SubjectDetail` | Displays metadata, progress, and data quality |
| Learn page | Complete | `learn/page.tsx`; `StudyShell` | Main flow works and is E2E-tested |
| Dynamic answer-option counts | Complete | `StudyShell` maps `displayOptions`; data tests | Supports five options; component test uses source count |
| Answer feedback | Complete | `StudyShell` lines 180–205 | Text and icons distinguish states |
| “Không biết” | Complete | `StudyShell.choose(null)`; tests | Reveals correct answer and schedules retry |
| Previous navigation | Complete | `move(-1)`; component/E2E tests | Historical item is read-only |
| Next navigation | Complete | `move(1)`; keyboard/button handling | Cannot leave an unanswered current item |
| Mastery streak | Partial | `reducer.answer`; `DEFAULT_MASTERY_STREAK` | Code supports threshold 2; second-correct mastery lacks direct test |
| Retry scheduling | Complete | `reducer.answer`; domain/E2E tests | Gap interpretation is documented only by implementation/test |
| Active-session restoration | Complete | `StudyShell` hydration; component/E2E tests | Relationally corrupt stored states are incompletely rejected |
| Summary page | Partial | `Summary.tsx` | Metrics exist; “Còn đang học” excludes unseen questions |
| Manual progress reset | Complete | `SubjectDetail.reset`; E2E | Uses native confirmation |
| Multiple-subject support | Partial | registry and generic routes | Architecture supports it; only one subject, duplicate slugs not rejected |
| Generated subject registry | Complete | generator and generated file | Deterministic sorted output; no duplicate identity guard |
| Data-quality notices | Complete | `SubjectDetail` | Shows review count and duplicate groups |
| `needsReview` support | Complete | `StudyShell` post-answer details | Warning hidden until answered; React escapes notes |
| Explanations | Partial | schema/data support | 22 explanations exist, but Learn feedback does not render `question.explanation` |
| `contentVersion` | Complete | canonical JSON, schema, storage adapter | SWD392 is v2 |
| Subject-specific content reset | Complete | `storage.load`; storage test | Unrelated subject key/progress preserved |
| Keyboard shortcuts | Complete | `StudyShell` keydown effect; component test | 1–5, Enter, arrows; no visible desktop hint |
| Sound-effects setting | Complete | hook and Learn checkbox | Enabled by default and persisted separately |
| Correct-answer sound | Complete | hook, asset, component/hook tests | No playback for wrong/unknown/history/restore |
| Responsive design | Complete | `globals.css`; five viewport E2E tests | Smoke-level overflow verification only |
| Accessibility | Partial | semantic buttons, focus CSS, dialog, `aria-live` | Missing focus restoration, progress semantics, automated accessibility tests |
| Error states | Complete | `src/app/error.tsx`; storage warning | Incompatible storage reset is silent; subject-detail storage exceptions may escape |
| Loading states | Complete | route loading files; StudyShell hydration text | Basic skeleton/text states |
| 404 handling | Complete | `notFound()` and `not-found.tsx` | Built as static 404 |
| Vercel deployment readiness | Partial | successful standard Next build, no secrets | Current implementation is largely uncommitted; actual Vercel deploy not verified |
| Restart / “Học lại” behavior | Broken | `SubjectDetail` and `Summary` use same Learn URL as continue | Existing incomplete session is retained by `StudyShell` |

---

## 6. SWD392 data audit

### Canonical metadata

- Canonical path: `src/data/subjects/swd392.json`
- `schemaVersion`: 1
- `contentVersion`: 2
- Subject ID: `swd392`
- Slug: `swd392`
- Code: `SWD392`
- Question count: 249
- Four-option questions: 246
- Five-option questions: 19, 39, and 42
- `needsReview: true`: 14
- Non-null explanations: 22
- Duplicate prompt groups: `[1,2]`, `[30,31]`, `[34,35]`, `[55,56]`, `[98,99]`, `[105,107]`, `[147,148]`
- `answerCorrectionCount`: 21
- `correctedAnswerNumbers`: 3, 5, 8, 14, 20, 22, 33, 38, 39, 41, 45, 51, 61, 99, 149, 153, 173, 205, 242, 243, 244
- `reviewBasis`: retained in `dataQuality`

### Integrity results

`subjectSchema`, `scripts/validate-subjects.ts`, and `tests/data/subject-validation.test.ts` verify:

- IDs are unique and exactly `swd392-001` through `swd392-249`.
- Numbers are unique and exactly 1 through 249.
- Every `correctAnswer` references an existing option.
- Correction count matches the corrected-number metadata length.
- Duplicate prompt groups are retained and are not validation errors.

Exactly one active subject JSON exists under the registry-scanned directory: `src/data/subjects/swd392.json`. `src/data/generated/subjects.generated.ts` imports that file once. No stale SWD392 JSON was found elsewhere by the current filename search. The temporary `questions/swd392-questions-corrected.json` and obsolete `questions/swd392-questions.json` were removed during the corrected-data task; the `questions/` directory remains.

The original source audio filename under `assets/` is unrelated to subject registry scanning. `base_pdf/SWD.pdf` remains as supporting material. This audit confirms structural and metadata integrity, not academic correctness of corrected answers.

---

## 7. Study-engine audit

### Initial queue

`createSession` in `src/domain/study/create-session.ts` creates one `initial` queue item per question, each with a generated `instanceId`. Source order is retained unless `shuffleQuestions` is enabled. Fisher–Yates is used with injectable randomness. The source-order 249-item path is tested; shuffled permutation correctness is not directly tested.

### Queue identity and option shuffling

Queue instances separate repeat appearances of a question. Retry items receive fresh IDs. Option shuffling is presentation-level and deterministic per queue instance through `optionRank(instanceId, optionId)` in `StudyShell`; option IDs remain unchanged and keyboard numbers follow display order.

### Answer submission

`answer(progress, question, selectedOptionId)` refuses absent sessions and already answered current instances. It derives `correct`, `incorrect`, or `dont-know`, creates an attempt, marks the queue instance answered, updates long-lived question progress, and increments lifetime attempts.

Important invariant gap: it does not verify `currentItem.questionId === question.id`, and it does not reject a non-null selected option absent from `question.options`. Current UI normally supplies the right question, but the domain API can create inconsistent queue/attempt/progress state.

### Mastery

Correct answers increment `correctStreak`; incorrect and unknown reset it. At the session threshold (default 2), status becomes `mastered`. Before mastery, status is `learning` and a retry is scheduled. A mastered question answered incorrectly in a later review session becomes `learning` because the streak resets. This behavior is evident in code but is not comprehensively tested.

`masteredAt` is set to the current time on mastery and reset to `null` on a later non-mastering answer. This is consistent with current-state semantics.

### Retry insertion

A retry is inserted only when no later unanswered queue item exists for the question. Insertion uses `currentIndex + retryGap + 1`, producing four intervening items for a configured gap of four. The existing domain test expects index 5 from index 0. The original wording “current position plus retry gap” is ambiguous; the implementation treats the gap as the number of intervening questions.

### History and frontier

`move(-1)` allows earlier history without creating attempts. `move(1)` refuses movement from an unanswered current item. Answered historical items are disabled and cannot be answered twice.

`frontierIndex` is initialized and advanced with `Math.max`, but navigation does not use it as an operative guard. Current immutability of answered queue instances largely preserves intended behavior, but the field’s relational invariants are neither validated nor deeply tested.

### Completion

Moving forward beyond the queue completes the session only when every queue item is answered, stamps `completedAt`, and increments `completedSessionCount`. Completion behavior lacks a direct domain or E2E test.

### Progress selectors

`selectStats` uses stable question progress rather than queue length:

- seen: `totalAttempts > 0`
- mastered: status `mastered`
- learning: status `learning`
- new: total minus seen
- accuracy: correct divided by correct plus incorrect, excluding unknown
- main percentage: mastered divided by subject total

The accuracy exclusion is tested. Summary currently labels only `learningCount` as remaining, excluding new/unseen questions.

### Restoration and content updates

For valid persisted data, StudyShell restores the exact active queue/index/settings and does not reshuffle. On content-version mismatch, only the subject key is removed and fresh v2 progress/session is created. Other subjects remain intact. Invalid relational state can still pass storage schema validation and cause a crash or permanent restoration state, for example an out-of-range `currentIndex` or missing current question-progress entry.

---

## 8. Persistence and migration audit

### localStorage keys

- `study-flow:v1:subject:<subjectId>` — `SubjectProgress`
- `study-flow:v1:notice:<subjectId>` — `pending` or `acknowledged`
- `study-flow:v1:settings` — shuffle question/option preferences
- `study-flow:v1:sound` — string boolean for sound preference

### Stored schemas and versions

`SubjectProgress.schemaVersion` and active `StudySession.schemaVersion` are both literal 1. Subject content version is stored separately as `subjectContentVersion` at both progress and session levels. `progressSchema` validates shape but uses broad numbers rather than integer/nonnegative constraints for many counters and indices.

### Validation and corruption handling

`storage.load` catches storage/JSON errors, validates the Zod schema, checks top-level subject identity, compares content version, and optionally checks for stored question IDs that no longer exist. Invalid subject data is removed only for the affected key.

Missing semantic checks include bounded indices, exact expected question ID sets, progress/session version agreement, session subject agreement, unique queue and attempt IDs, queue-attempt relationships, valid selected option IDs, and counter consistency. Consequently, some malformed but shape-valid data is returned as loaded.

### Quota and blocked storage

StudyShell catches save failures and displays a nonblocking warning while retaining in-memory progress. `storage.save` intentionally throws to its caller. SubjectDetail does not consistently catch `save` or `remove`, so blocked storage can trigger an error boundary outside Learn.

### Reset behavior

Manual reset removes only the current subject key. Content mismatch also removes only that subject and sets a per-subject notice. The storage test constructs unrelated subject progress and confirms it remains loadable after SWD392’s v1-to-v2 mismatch.

### Migrations

No persisted-schema migration functions exist. Unsupported schema versions are treated as invalid and removed. This is acceptable for the current single persisted schema but deviates from the documented migration-layer goal.

### Notices

The update notice is consumed automatically on Learn mount, changing it to acknowledged before explicit user dismissal. It is displayed for that mounted session but has no dismiss button. Incompatible state resets without an equivalent explanatory notice.

### Multi-tab and hydration

No `storage` event synchronization exists; multiple tabs can overwrite each other with stale snapshots. Multi-tab synchronization was optional in the original specification. Hydration is safe because localStorage is accessed only in Client Component effects/functions; initial server/client render uses zero stats or a restoration state.

**Subject-specific reset verdict:** verified. Updating SWD392 to content version 2 resets only `study-flow:v1:subject:swd392`; unrelated subject progress is preserved by implementation and test.

---

## 9. Audio audit

- Original supplied asset: `assets/quizlet-correct.mp3`
- Application asset: `public/assets/correct-answer.mp3`
- Public URL: `/assets/correct-answer.mp3`
- Hook: `src/hooks/useCorrectAnswerSound.ts`
- Setting key: `study-flow:v1:sound`
- Default: enabled unless stored value is exactly `false`

StudyShell calls `play()` only after a new answer where the submitted option ID equals the JSON `correctAnswer`. Already answered instances return before playback. Pointer/touch activation uses answer buttons; keyboard 1–5 invokes the same `choose` function. Incorrect and null/unknown choices do not call playback. History navigation, restoration, rerenders, and summary do not call playback.

The hook creates one Audio object on mount, sets `preload = "auto"`, stores it in a ref, resets `currentTime` before replay, catches synchronous errors and rejected `play()` promises, pauses on unmount, and does not autoplay.

Automated tests cover creation/preload, one requested playback, no mount/restore playback, disabled preference, persisted disabled preference, rejected playback, cleanup, correct click, incorrect answer, unknown answer, history, restore, and keyboard behavior.

Third-party branding remains only in the original input filename `assets/quizlet-correct.mp3`, which is not public and is not referenced in interface copy or the public URL. No “Quizlet” branding was found in application UI or README. The original project prompt mentions Quizlet as a prohibited comparison, not branding.

Minor observations: the Audio object is created and preloaded even when persisted sound is disabled; the sound setting is shown both as a top-level Learn checkbox rather than solely inside the settings dialog.

---

## 10. UI, responsive, and accessibility audit

### Verified from code and automated tests

- Responsive container widths and auto-fit subject/metrics grids are in `globals.css`.
- Answer options support multiline text and use real buttons.
- Buttons use a minimum height of 46px, providing reasonable touch targets.
- Five Playwright viewport tests pass at 360, 390, 768, 1024, and 1440 pixels with no horizontal document overflow on Learn.
- Visible `:focus-visible` outline is defined.
- Feedback uses `aria-live="polite"`.
- Correct and wrong states include text/icons, not only color.
- Settings dialog has `role="dialog"`, `aria-modal`, a labelled heading, Escape handling, initial focus, and Tab wrapping.
- Keyboard shortcuts ignore repeat events and controls/dialogs.
- Reduced motion disables animation/transition behavior.
- Route loading, root error, and 404 files exist.
- Source questions/review notes are rendered as React text, not HTML.

### Partial or requiring manual verification

- Actual visual color contrast was not measured; CSS colors appear deliberate but require tooling/manual verification.
- Dialog focus is not restored to the trigger after close, and background content is not explicitly inert.
- Progress bars are visual `div/i` structures without progressbar ARIA values.
- No automated axe/accessibility suite exists.
- Screen-reader behavior, reading order, zoom at 200–400%, safe-area behavior, and real touch devices were not manually tested.
- Longest source answer rendering was not individually measured, although multiline CSS and overflow smoke tests reduce risk.
- There is no skip link or visible desktop keyboard-hint block.
- CSS is highly compressed, making manual review and maintenance harder.

---

## 11. Testing audit

### Test files

| File | Coverage |
| --- | --- |
| `tests/data/subject-validation.test.ts` | Corrected SWD392 schema, counts, IDs/numbers, options, review/explanation counts, duplicate groups, correction metadata, invalid version/count/key cases |
| `tests/domain/study-engine.test.ts` | 249-item source order, first-correct retry, lock, basic next guard, unknown excluded from accuracy |
| `tests/storage/storage.test.ts` | Matching/missing/corrupt progress, invalid schema isolation, v1-to-v2 subject-specific reset, notice once, identity mismatch, unknown question ID |
| `tests/hooks/correct-answer-sound.test.tsx` | Audio preload, one play, disabled/restore, failure safety, cleanup |
| `tests/components/StudyShell.test.tsx` | Dynamic options, click/keyboard, feedback, wrong/unknown sound suppression, history/restore suppression, disabled sound, settings persistence |
| `e2e/study-flow.spec.ts` | Start/answer/resume, unknown/history read-only, reset confirmation, five viewport overflow checks |

### Results

- 5 Vitest files, 29 tests passed.
- 8 Chromium Playwright tests passed.
- No `.skip`, `.only`, or `.todo` markers were found.
- No coverage provider/script is configured, so no coverage percentage is reported.

### Missing or weak coverage

- Second correct answer reaching mastery.
- Incorrect answer resetting streak and demoting mastered progress.
- Shuffle permutation correctness.
- Retry duplicate prevention and queue-end insertion boundaries.
- Completion conditions and completed-session count.
- Full frontier/history traversal.
- Restart controls creating a new session.
- Reducer question/queue mismatch and invalid selected IDs.
- Relationally corrupt persisted state and index bounds.
- Content-version update notice and corrected-answer behavior in E2E.
- Summary, SubjectCard, SubjectDetail, error, loading, and 404 direct tests.
- Registry determinism/duplicate slug/empty directory tests.
- Automated accessibility and cross-browser/mobile browser tests.
- Production-server E2E; Playwright uses `npm run dev`.

### Brittleness and flake risks

E2E hard-codes current SWD392 labels/counts, inspects internal localStorage shape, and uses `.options button` selectors. `fullyParallel: true` can increase dev-server compilation contention. Page errors are logged rather than failing tests. Playwright traces are configured only on first retry, but no explicit retry policy is configured. A prior audit run demonstrated an output-directory collision when lint and E2E were launched concurrently; sequential execution passed.

The data tests intentionally hard-code corrected metadata as regression protection rather than hard-coding all answer keys. That is appropriate for the authoritative dataset but requires an explicit update on future content-version changes.

---

## 12. Commands and verification results

| Command | Result | Important output | Notes |
| --- | --- | --- | --- |
| `git status --short; git log ...; git diff ...` | Passed | One commit; many modified/untracked implementation files | Establishes incomplete Git chronology and unreleased tree |
| `npm audit --omit=dev` | Failed | 3 production findings: 1 moderate, 2 high | Suggested force fix is a breaking Next downgrade and was not applied |
| `npm run data:generate` | Passed | `Generated registry for 1 subject(s)` | Executed directly and again via prebuild |
| `npm run data:validate` | Passed | `PASS swd392.json: 249 questions, 14 review, v2` | Executed directly and again via prebuild |
| `npm run lint` | Passed | No ESLint errors | Global rule suppression remains documented below |
| `npm run typecheck` | Passed | `tsc --noEmit` | Strict mode enabled |
| `npm run test` | Passed | 5 files, 29 tests | No coverage report configured |
| `npm run build` | Passed | Compiled; 7 static pages generated | Standard Next.js production build |
| `npm run test:e2e` | Passed | 8 Chromium tests | Uses development server |

The required commands were run sequentially in one chain and all application quality commands completed successfully. `npm audit --omit=dev` is reported separately as failed because advisories remain; it was not a required package script and no major upgrade/downgrade was performed.

---

## 13. Dependency and configuration audit

### Package scripts

Scripts are conventional and useful. `predev` and `prebuild` regenerate and validate data. `check` omits E2E and does not explicitly generate before validation, although `build` triggers prebuild later. CI redundantly generates/validates before build, then prebuild repeats both.

### Dependencies

- No missing runtime dependency was observed during build/tests.
- `lucide-react` appears unused and can likely be removed after confirming no hidden import.
- `npm audit --omit=dev` reports high-severity `sharp` and moderate `postcss` advisories through Next.js. The tool’s suggested forced change to Next 9 is inappropriate; remediation requires selecting a compatible patched supported release.
- A separate full audit by the audit agent reported additional dev dependency findings, including Vitest/Vite. This report’s executed production audit intentionally used `--omit=dev`; a future dependency maintenance task should run and triage full `npm audit` as well.

### TypeScript

`strict: true`, `noEmit`, bundler resolution, JSON modules, and aliasing are appropriate. `allowJs: true` is broader than needed for the TypeScript codebase. `skipLibCheck: true` is common in Next projects but reduces dependency declaration checking. No broad application `any`, `@ts-ignore`, or disabled strict mode was found.

### Next and Tailwind

`next.config.ts` is an unchanged placeholder with no required options. Tailwind 4 is loaded through PostCSS and `@import "tailwindcss"`; most styling is custom CSS. No separate Tailwind config is required for this setup.

### ESLint

Next core-web-vitals and TypeScript configurations are enabled. `react-hooks/set-state-in-effect` is disabled globally rather than scoped to specific hydration cases. This can conceal future effect/state problems.

### Vitest and Playwright

Vitest config is valid but compressed and lacks coverage. Playwright is Chromium-only, uses a dev server, has no explicit retries/CI workers, and is absent from CI.

### CI

`.github/workflows/ci.yml` uses Node 22, npm caching, `npm ci`, generation, validation, lint, typecheck, tests, and build. It does not run E2E, audit, coverage, or generated-file cleanliness checks. Action references use mutable major tags rather than pinned commit SHAs. The workflow is currently untracked.

### Generated files

Generation is deterministic because input filenames are sorted and no timestamps are emitted. There is no check-only mode to fail when committed generated output is stale. Duplicate IDs/slugs across subject files are not rejected.

### Environment and release configuration

No required environment variables or secrets were found. There is no `.nvmrc`, `.node-version`, or `engines` entry to align local, CI, and Vercel Node versions. No `vercel.json` is needed for the current standard deployment.

---

## 14. Security and privacy audit

This is a repository-level engineering audit, not a formal penetration test.

### Positive findings

- No account, authentication, database, API persistence, analytics, ads, third-party scripts, or external application network requests were found.
- No secrets or required environment variables were found.
- No `dangerouslySetInnerHTML`, raw `innerHTML`, or HTML rendering of review notes/questions was found.
- Repository content is rendered through React escaping.
- localStorage JSON parsing and Zod validation are wrapped in error handling.
- Subject routes resolve through a generated static map; there are no unsafe dynamic filesystem imports from user input.
- Audio is served locally.

### Risks and hardening opportunities

- Persisted-state semantic validation is incomplete, enabling local corruption to crash or strand the UI.
- Subject generator filename checks reduce path-traversal risk, but duplicate identities and filename/slug mismatch are not rejected.
- No explicit CSP, clickjacking, MIME sniffing, or referrer-policy headers are configured. For a static MVP these are hardening opportunities, not verified exploitable defects.
- localStorage is readable by any future same-origin XSS, an inherent limitation.
- Production dependency advisories remain.
- Git’s untracked implementation state increases supply/release integrity risk because audited files are not represented by a reproducible commit.

---

## 15. Performance audit

No Lighthouse, bundle analyzer, Web Vitals capture, memory profile, or runtime benchmark was run. Findings below are code-review observations.

### Positive observations

- Routes are statically generated.
- No heavy UI framework is used.
- Audio uses one bounded object per mounted Learn component and cleans it up.
- Initial localStorage reads occur after client mount, avoiding hydration mismatch.
- Subject registry output is deterministic.
- At the current scale of 249 questions and one subject, the implementation is likely operationally modest.

### Growth concerns

- The generated registry imports and Zod-parses every full subject JSON at module evaluation.
- Full Subject objects, including all questions, are passed to client components on home/detail/summary routes.
- `StudyShell` linearly searches questions and attempts on renders.
- Each answer maps the full queue and scans future retries.
- Every state change serializes the entire progress record, growing queue, and attempt array to localStorage.
- Full JSON is included in client-side route payloads where metadata-only data could suffice.
- Preloading audio occurs even when sound is disabled.

These are not measured bottlenecks for one 249-question subject. They should be reconsidered if subject count, question count, or retry volume grows materially.

---

## 16. Documentation audit

### Accurate documentation

README correctly documents:

- local-first/no-account/no-database model;
- installation and development commands;
- data/architecture layers at a high level;
- adding a subject;
- preserving IDs and incrementing `contentVersion` for corrections;
- storage keys and subject-specific reset behavior;
- audio path, trigger, disabled behavior, failure tolerance, and setting key;
- standard Vercel import/deploy steps;
- cross-device/browser-storage/account/upload limitations.

### Missing, outdated, or incomplete documentation

- Subject schema fields are not documented in detail, especially v2 correction metadata.
- README does not state current SWD392 `contentVersion: 2`, correction count, explanation count, or five-option distribution.
- It does not explicitly explain how to replace the audio file, beyond naming its path.
- It does not disclose the misleading/broken “Học lại” behavior.
- It does not disclose no multi-tab synchronization.
- It does not mention that E2E uses a dev server and is absent from CI.
- It does not mention dependency advisories or Node version expectations.
- “Adding a subject requires no component changes” is architecturally true, but duplicate subject identities are not guarded and generated output must remain current.
- The exact-increment-by-one workflow is documented but not enforceable from current Git history by validation.
- Current repository state is not committed, so README’s push-to-Vercel instructions would not deploy the audited tree until files are staged and committed.

---

## 17. Deviations from the specification

| Requirement | Implemented behavior | Deviation | Severity | Recommendation |
| --- | --- | --- | --- | --- |
| “Học lại toàn bộ” creates a new session | Link points to the same Learn route as continue | Incomplete session is resumed, not restarted | High | Implement explicit confirmed restart action and test it |
| Render available explanations after answers | Schema/data contain 22 explanations | Learn feedback never displays `question.explanation` | Medium | Render escaped explanation when non-null |
| Robust recovery from incompatible persisted sessions | Basic schema/unknown-ID recovery | Relational corruption can crash or permanently show restoration state | High | Add semantic validation and affected-subject recovery notice |
| Pure engine preserves queue/question integrity | UI passes question object to reducer | Reducer does not verify it matches active queue item or valid option | High | Resolve question from queue ID or enforce invariants |
| Summary shows remaining learning questions | Displays `learningCount` | Excludes unseen/new unmastered questions | Medium | Show `newCount + learningCount` or total minus mastered |
| Persisted schema migration layer | Invalid unsupported versions are deleted | No migration functions exist | Low | Add explicit v1 migration scaffold before schema changes |
| Update notice acknowledged by learner | Notice is consumed on mount | Storage marks acknowledged without explicit dismissal | Low | Add dismiss action and acknowledge then |
| Settings dialog contains sound setting | Sound checkbox is in Learn header | Functional but outside dialog | Low | Move or duplicate setting inside dialog consistently |
| Keyboard hints on desktop | Shortcuts work | No visible hints | Low | Add compact desktop hints |
| Complete dialog focus management | Basic focus trap and Escape | No focus return/inert background | Medium | Use refs, restore trigger focus, and inert/appropriate modal isolation |
| Progress accessibility | Visual bars only | Missing progressbar semantics | Low | Add role/value labels |
| E2E core/content-version flows | 8 Chromium tests | No content-version, retry-gap return, completion, or production-server E2E | Medium | Expand E2E and run selected suite in CI |
| CI includes applicable release checks | CI runs unit/build checks | E2E absent; workflow untracked | High | Commit workflow and add Chromium E2E or smoke job |
| Production-ready repository | Local working tree passes | Most implementation files are untracked | Critical | Commit the intended release tree after review |
| Dependency security | Build/tests pass | Production audit reports 2 high and 1 moderate findings | High | Upgrade to compatible patched releases; do not force downgrade |
| Multiple-subject registry identity safety | Static map is generated | Duplicate IDs/slugs can collide silently | Medium | Validate cross-file uniqueness and filename/slug consistency |
| Empty-subject state | Empty array would render empty grid | No explicit empty-state message | Low | Add simple library empty state |

---

## 18. Technical debt and risks

1. **Uncommitted release tree**
   - Affected: most current `src/`, tests, scripts, CI, data, and audio assets
   - User impact: deployed code may omit the audited application
   - Likelihood: High
   - Severity: Critical
   - Fix: review, stage, and commit the intended complete tree; verify clean checkout
   - Scope: Small

2. **Restart controls do not restart**
   - Affected: `SubjectDetail.tsx`, `Summary.tsx`, `StudyShell.tsx`
   - User impact: users cannot reliably start over from advertised controls
   - Likelihood: High
   - Severity: High
   - Fix: explicit restart intent/action with confirmation and persistence
   - Scope: Medium

3. **Permissive persisted-state invariants**
   - Affected: `lib/storage/schemas.ts`, `local-study-storage.ts`, reducer
   - User impact: corrupt data can crash, strand loading, or distort progress
   - Likelihood: Medium
   - Severity: High
   - Fix: semantic validation and targeted recovery
   - Scope: Medium

4. **Reducer trusts mismatched question/option input**
   - Affected: `domain/study/reducer.ts`
   - User impact: future callers or malformed state can corrupt progress
   - Likelihood: Low to Medium
   - Severity: High
   - Fix: resolve from queue ID or reject mismatch/invalid option
   - Scope: Small

5. **Production dependency advisories**
   - Affected: `package.json`, `package-lock.json`
   - User impact: exposure to known transitive vulnerabilities
   - Likelihood: Environment-dependent
   - Severity: High
   - Fix: select compatible patched Next/dependency versions and rerun full suite
   - Scope: Medium

6. **Core engine coverage gaps**
   - Affected: `tests/domain/study-engine.test.ts`
   - User impact: regressions in mastery, retry boundaries, and completion may escape
   - Likelihood: Medium
   - Severity: Medium
   - Fix: add focused pure-domain cases
   - Scope: Medium

7. **Explanations are stored but not displayed**
   - Affected: `StudyShell.tsx`
   - User impact: corrected educational context is unavailable in Learn
   - Likelihood: Certain for 22 questions
   - Severity: Medium
   - Fix: render escaped explanation after answering
   - Scope: Small

8. **Accessibility gaps in dialog and progress**
   - Affected: `StudyShell.tsx`, `globals.css`, subject card/detail
   - User impact: poorer keyboard/screen-reader experience
   - Likelihood: Medium
   - Severity: Medium
   - Fix: focus restoration, inert modal background, progress semantics, axe tests
   - Scope: Medium

9. **Registry permits duplicate subject identities**
   - Affected: generator, validator
   - User impact: wrong subject lookup and storage collision when adding subjects
   - Likelihood: Low now, increasing with subject count
   - Severity: Medium
   - Fix: cross-file ID/slug uniqueness checks
   - Scope: Small

10. **Compressed source formatting**
    - Affected: several routes, components, scripts, tests, storage schemas
    - User impact: maintenance/review difficulty rather than runtime failure
    - Likelihood: High
    - Severity: Low
    - Fix: apply Prettier or readable formatting without semantic refactor
    - Scope: Small

11. **No multi-tab coordination**
    - Affected: persistence/client hooks
    - User impact: stale tab can overwrite newer progress
    - Likelihood: Low to Medium
    - Severity: Low
    - Fix: storage-event reconciliation or document limitation
    - Scope: Medium

12. **Current v2 provenance under-documented**
    - Affected: README/data-maintenance documentation
    - User impact: reviewers cannot easily understand content corrections
    - Likelihood: High
    - Severity: Low
    - Fix: document current version and correction metadata without claiming academic validation
    - Scope: Small

---

## 19. Recommended next actions

### Must fix before production

1. Review and commit the complete intended working tree; verify a fresh clone can run `npm ci`, checks, E2E, and build.
2. Resolve or explicitly risk-accept the two high and one moderate production dependency advisories using compatible patched releases.
3. Fix “Học lại”/restart semantics so the advertised action starts a new session.
4. Strengthen persisted-state semantic validation and recovery for index, identity, question-set, and queue/attempt invariants.
5. Enforce active queue question and selected-option integrity in the study domain.

### Should fix soon

1. Add mastery, demotion, retry-boundary, duplicate-retry, completion, and frontier tests.
2. Display non-null explanations after answering.
3. Add content-version and restart browser tests; run a Chromium smoke suite in CI.
4. Improve dialog focus restoration/modal isolation and progressbar semantics; add automated accessibility checks.
5. Validate duplicate subject IDs/slugs and generated-file freshness.
6. Make storage failure handling consistent on subject detail and reset paths.
7. Correct summary remaining-question semantics.
8. Document current SWD392 v2 metadata and multi-tab limitation.

### Optional improvements

1. Add production-server E2E and additional browser projects.
2. Add coverage tooling and reasonable thresholds.
3. Add metadata-only registry exports to reduce client payload growth.
4. Precompute question/attempt maps if scale increases.
5. Add multi-tab storage synchronization.
6. Add explicit empty-library state and desktop keyboard hints.
7. Remove unused `lucide-react` after confirming it is unnecessary.
8. Reformat compressed files for maintainability.

---

## 20. Final audit verdict

- **Overall project status:** Functional but requires further work.
- **Data integrity verdict:** Strong structural confidence. Corrected SWD392 v2 validates with 249 unique questions, expected option/review/explanation distributions, valid answer references, and one active canonical dataset. Academic correctness was not independently verified.
- **Study-engine verdict:** Core flow is functional and reasonably separated, but important invariants, restart semantics, mastery/completion edge cases, and tests are incomplete.
- **Persistence verdict:** Subject-specific content reset is verified and hydration is generally safe; relational validation and recovery require strengthening.
- **Test-confidence verdict:** Moderate. All 29 unit/component tests and 8 Chromium E2E tests pass, but coverage is narrow for core edge cases and no coverage metric exists.
- **Accessibility verdict:** Partial. Good semantic/button/focus/feedback foundations, with unverified contrast and incomplete modal/progress semantics.
- **Deployment-readiness verdict:** Local production build is ready for standard Vercel mechanics, but release is blocked by the uncommitted working tree and unresolved dependency advisories.

### Five most important next actions

1. Commit and verify the complete release from a clean checkout.
2. Fix restart behavior.
3. Harden persisted-state and reducer invariants.
4. Remediate compatible dependency vulnerabilities.
5. Expand core domain/content-version/accessibility tests and include E2E smoke coverage in CI.
