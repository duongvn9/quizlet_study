# Baseline Audit

## Audit scope and date

Audit date: 2026-07-28.

This audit documents the repository before any Step 1 production change. No production source, dependency, configuration, question JSON, environment file, or backend resource was intentionally changed. All command outcomes below were captured before these documentation edits and therefore represent the pre-documentation baseline.

## Git state

Initial commands:

| Command | Exit | Result |
| --- | ---: | --- |
| `git status --short` | 0 | No output; working tree was clean and contained no untracked user work |
| `git branch --show-current` | 0 | `main` |
| `git remote -v` | 0 | `origin` fetch/push configured for the repository GitHub remote |
| `git log -5 --oneline` | 0 | `8b272c4 feat: add Vercel Web Analytics`; `ba67824 Merge pull request #3 from duongvn9/feat/backend-foundation`; `40e48eb feat: add backend foundation and import pipeline`; `95a028e fix: update FE SWD392 answer distribution`; `9f90788 fix question 72` |
| `git branch --all` | 0 | Local `main`; remote `origin/main`; no separate backend branch remains on the configured remote |

`main` is the repository primary branch because `origin/HEAD` points to `origin/main`. A dedicated branch was created with `git switch -c chore/project-baseline-audit`. Recent history confirms that backend-foundation and import-pipeline work was already merged before this audit; it is dormant scaffold, not active UI integration.

## Runtime and package-manager versions

| Command | Exit | Result |
| --- | ---: | --- |
| `node --version` | 0 | `v24.14.1` locally; CI and README use/recommend Node 22 |
| `npm --version` | 0 | `11.11.0` |

npm is the repository package manager (`package-lock.json`, npm scripts, and CI `npm ci`). No dependency install or upgrade was performed.

## Baseline command results

| Command | Exit | Pass/fail | Important output |
| --- | ---: | --- | --- |
| `npm run data:generate` | 0 | Pass | Generated registry for 4 subjects. It produced no content diff. |
| `npm run data:validate` | 0 | Pass | FE SWD392 263/8 review/v1; MLN122 478/0/v1; MMA301 182/2/v2; SWD392 249/14/v2. |
| `git diff --exit-code -- src/data/generated` | 0 | Pass | No generated content difference; Git warned that LF may be replaced by CRLF when Git next touches the generated file. |
| `npm run lint` | timeout | Inconclusive first attempt | Initial 120-second invocation timed out after printing `eslint .`, with no lint diagnostic. |
| `npm run lint` | 0 | Pass on retry | Completed with no warning or lint error under a 300-second timeout. |
| `npm run typecheck` | 0 | Pass | `tsc --noEmit` completed without diagnostics. |
| `npm run test` | 0 | Pass | Vitest 2.1.9: 12 files passed, 127 tests passed; duration 75.88 seconds. |
| `npm run build` | 0 | Pass | `next build` completed; captured final output included `Finished TypeScript in 22.8s`. `prebuild` also regenerated and validated subject data. |
| `npm run test:e2e` | 1 | Fail, pre-existing | Playwright: 9 passed and 8 failed of 17 in 1.4 minutes. The dev server repeatedly reported `Failed to generate static paths for /subjects/[slug]: SyntaxError: Unexpected end of JSON input`. Failures then timed out waiting for navigation from `/` or `/subjects/swd392`; Test and responsive checks still passed. |
| `npm run dev` plus HTTP request to `http://localhost:3000` | 0 | Pass | `predev` generated/validated all four datasets; Next.js 16.2.11 Turbopack became ready in 1034 ms; `GET /` returned HTTP 200 in 2.1 seconds; stderr was empty. The process was stopped after verification. |

The existing aggregate `npm run check` was not run because each constituent command (`lint`, `typecheck`, `data:validate`, `test`, and `build`) was run and recorded separately. There is no standalone formatting/check script. `npm run test:e2e` is project-specific and was run separately because it is not included in `check`.

## Lint result

Pass on the completed retry, with no diagnostics. The first lint process exceeded the tool's 120-second timeout and is recorded as an inconclusive execution rather than a lint failure.

## Type-check result

Pass. Strict TypeScript compilation with `tsc --noEmit` returned exit code 0 and no diagnostics.

## Test result

Vitest passed all 127 tests across 12 files.

Playwright failed 8 of 17 tests. The failure existed before documentation changes. All eight failures were Learn-oriented navigation/resume/reset flows and coincided with development-server static-path generation reporting truncated JSON reads. Nine Test, redirect/fallback, and responsive checks passed. The result is not treated as an application-code regression caused by this audit, and no test or framework configuration was changed to conceal it.

## Build result

Pass. The production build exited 0 after its `prebuild` data generation and validation. No build configuration was changed.

## Runtime result

Startup command: `npm run dev`.

- Startup succeeded on the isolated verification run.
- Tested route: `/` via `http://localhost:3000`.
- Result: HTTP 200.
- Startup warnings/errors: none in captured stderr.
- Startup included successful data generation and validation.
- The development process was stopped after the request.
- No browser UI was available for this isolated runtime check, so rendering details and browser console messages were not manually verified.
- Playwright provided the available browser-based evidence, with the partial failure documented above.

## Existing warnings and errors

- Local Node 24 differs from CI's Node 22; results should be confirmed in CI before attributing environment-sensitive failures to code.
- Git emitted an LF-to-CRLF warning for `src/data/generated/subjects.generated.ts`; the file had no content diff.
- The first lint command exceeded 120 seconds but passed when allowed 300 seconds.
- Playwright's fully parallel dev-server run produced repeated `Unexpected end of JSON input` static-path generation failures and 8 navigation timeouts.
- Existing README security notes report transitive Next.js dependency advisories. This audit did not run `npm audit`, change versions, or independently refresh that dated advisory count.

## Manual regression checklist

“Automated pass” means an existing baseline command passed relevant coverage. “Automated fail” records the current Playwright baseline and does not claim production logic is disproven. “Manual not run” means no browser/manual environment was available.

| # | Regression check | Baseline status | Evidence/limitation |
| ---: | --- | --- | --- |
| 1 | Subject list renders | Runtime partial pass; manual not run | `/` returned HTTP 200; Playwright found the SWD392 card before navigation failures, but no manual visual review |
| 2 | Subject can be opened | Automated fail | Learn helper navigation failed intermittently in 8 E2E cases; other tests reached subject/study routes |
| 3 | Study mode can be started | Automated partial | Test and redirect/fallback E2E passed; Learn starts failed in affected parallel cases |
| 4 | A question displays correctly | Automated partial | Vitest StudyShell/Questions tests and 9 E2E flows passed; manual visual review not run |
| 5 | Answers remain hidden before selection | Automated pass | StudyShell and Test component tests characterize reveal behavior |
| 6 | Selecting an answer reveals the result | Automated pass in unit/component; E2E affected | StudyShell component suite passed; corresponding Learn E2E flow failed before reaching answer interaction |
| 7 | Correct answers are counted correctly | Automated pass | Study engine and StudyShell suites passed |
| 8 | Incorrect answers are counted correctly | Automated pass | Study engine and storage suites passed |
| 9 | Next question resets temporary answer UI | Automated pass | StudyShell tests cover reveal reset and retry freshness |
| 10 | Refresh restores saved progress | Automated pass in domain/component; E2E affected | Resume/storage tests passed; affected Playwright refresh flows did not complete |
| 11 | Resume continues from expected question | Automated pass in domain; E2E affected | Resume characterization passed; corresponding Playwright cases failed during navigation |
| 12 | Incorrect questions can be retried | Automated pass in domain/component; E2E affected | Reducer and StudyShell retry tests passed |
| 13 | A test can be generated | Automated pass | Test engine/component and full 10-question Test E2E passed |
| 14 | Test question counts are correct | Automated pass | Test engine/component and 10-question E2E passed |
| 15 | Displayed total does not increase on incorrect answer | Automated pass in selector/domain; E2E affected | Canonical counter tests passed; corresponding retry E2E failed during navigation |
| 16 | Existing subject JSON files still load | Automated pass | Generation, validation, Vitest data suite, build, and isolated runtime passed |
| 17 | Direct navigation to relevant routes works | Automated partial | Invalid-mode/legacy redirect and several mode routes passed; no exhaustive manual direct-route test |
| 18 | Production build succeeds | Automated pass | `npm run build` exited 0 |
| 19 | Analytics does not break rendering | Runtime partial | Analytics mounted in root layout and `/` returned 200; no deployed analytics request validation |
| 20 | Application works without authenticated user | Automated/runtime pass | No active auth requirement; Test E2E and root HTTP request succeeded without a user |

## Untested or incompletely tested areas

- Manual visual behavior, browser console, and assistive-technology behavior were not inspected because no interactive browser tool was available.
- Production `next start` was not exercised; Playwright uses `next dev`.
- Firefox, WebKit, real mobile devices, multi-tab conflicts, storage quota denial, clipboard denial, and offline behavior were not tested.
- The question API has no direct automated route-handler coverage for offset normalization or 404 behavior.
- Root error/not-found pages and Vercel Analytics behavior have no direct tests.
- The Supabase migration, RLS policies, dormant remote adapter, authentication, synchronization, and import pipeline were not integrated or run against real backend resources, as required by this step.

## Security observations

- No secrets or real environment values were found or copied. `.env.example` contains only disabled public booleans.
- No `.env` file was added or committed.
- Active progress is browser-local, unencrypted, account-less, and shared by users of the same browser profile. It should not contain sensitive personal data in the current design.
- Correct answers are statically delivered to the client and exposed by the read-only question API; the app must not be treated as a secure examination platform.
- The question API has no auth, authorization, rate limiting, explicit cache policy, or telemetry.
- The dormant import service rejects oversized input, unsafe object keys, malformed canonical data, and unauthorized content management, but it has no active route/UI and has not been validated against a real deployment.
- No CSP or custom security headers are configured.
- Existing dependency advisories remain unresolved; no dependency changes were permitted in this step.

## Data-quality observations

- Four JSON sources are statically registered and validated; arbitrary new JSON files are rejected until intentionally registered.
- FE SWD392, MLN122, and MMA301 require adapters; SWD392 is canonical and parsed directly.
- The canonical schema enforces subject question count equality, per-subject unique question IDs/numbers, option/correct-answer referential integrity, and metadata consistency.
- IDs are stable per subject and are not required to be globally unique. Persistence depends on stable subject IDs and question IDs across content versions.
- Multiple-answer questions use `correctAnswers[]` and exact-set scoring.
- Duplicate prompt text is documented/reported but not universally rejected.
- Invalid static JSON can stop generation/build/module loading; the runtime does not isolate one malformed subject from all routes.
- Dataset validation has hard-coded counts/distributions. Intentional content changes require coordinated validator/test updates and a deliberate content-version decision.
- Existing JSON files were not modified by this audit.

## Refactoring boundaries

### `SubjectRepository`

- Current implementation: generated `subjects`, `subjectsBySlug`, and `getSubject` in `src/data/generated/subjects.generated.ts`.
- Current callers: root/subject/study/summary pages and the question API.
- Data: normalized subject metadata and complete canonical question arrays.
- Extraction reason: decouple routes from generated static imports before introducing remote subjects; permit local and future remote implementations without changing screens.
- Interface responsibilities: list subjects, get by stable slug/ID, expose content version and metadata, define not-found/error behavior.
- Main risks: static generation, server/client boundaries, preserving synchronous build behavior, invalid-data failure semantics, bundle size, and stable IDs.
- Suggested order: characterize registry/routes first; add domain-facing repository contract; wrap current generated registry; migrate one read path at a time.
- Required tests: list/get/not-found, generated registry parity, static params, malformed local content behavior, no client-side backend leakage.

### `QuestionSetRepository`

- Current implementation: `Subject.questions` from the generated registry and slicing in `src/app/api/subjects/[slug]/questions/route.ts`.
- Current callers: Learn/Test workspace, `QuestionList`, and API route.
- Data: canonical questions, counts, pagination offsets, answers/explanations/review metadata.
- Extraction reason: separate subject metadata from potentially large question sets and provide one pagination/query contract.
- Main risks: exposing answers in inappropriate future contexts, preserving order/shuffle determinism, count consistency, content-version compatibility, and server/client payload size.
- Suggested order: after `SubjectRepository`; first wrap complete local arrays, then migrate Questions pagination, then Learn/Test loaders.
- Required tests: exact registry parity, total/count invariants, stable order, offset behavior, multi-answer fidelity, unknown subject, and content-version changes.

### `ProgressRepository`

- Current implementation: direct `storage`/`testStorage` use in `StudyShell`, `TestShell`, `SubjectDetail`, `SubjectCard`, and `Summary`; dormant `LocalProgressRepository`/`SyncedProgressRepository` exist under `src/lib/backend/progress.ts` but are not UI-compatible production wiring.
- Current callers: subject card/detail, Learn shell, Test shell (including Learn mastery pool), and Summary.
- Data: Learn `SubjectProgress`, Test snapshot, notices/settings, content versions, and save/load status.
- Extraction reason: remove browser APIs from UI, normalize failure handling, create a seam for account-scoped remote synchronization, and preserve local fallback.
- Main risks: changing resume timing, hydration, retry queues, counters, subject isolation, content migration, Test/Learn isolation, and multi-tab writes.
- Suggested order: add characterization tests; extract orchestration-independent storage adapter; migrate read-only consumers; migrate StudyShell; migrate TestShell; only later add remote composition.
- Required tests: load/save/remove, invalid/malformed/mismatch isolation, current index restoration, retries, replacement, failed writes, Test isolation, multi-tab/version conflict characterization, and SSR-safe access.

### `AuthService`

- Current implementation: dormant `LocalAuthService` always yields a guest and rejects sign-in/up; no active caller.
- Current callers: backend tests only.
- Data: user ID, role, session/auth state; future ownership namespace.
- Extraction reason: provide a stable guest/auth boundary before account-specific storage or remote APIs are introduced.
- Main risks: blocking the existing guest experience, hydration/session flashes, redirect loops, privilege trust in client flags, and progress ownership migration.
- Suggested order: after local repository boundaries are stable; preserve guest as default and keep auth disabled behind an inert flag until complete.
- Required tests: guest-first rendering, restore/sign-in/sign-out transitions, server authorization, disabled-feature behavior, and guest progress ownership/migration.

### `ImportService`

- Current implementation: dormant canonical JSON import validation in `src/lib/backend/import.ts`; source JSON is otherwise added through repository files and generation scripts.
- Current callers: backend tests only.
- Data: raw bytes/JSON, canonical subject, hash/idempotency report, duplicate warnings, actor authorization, and transactional persistence.
- Extraction reason: make validation/security independent from a future upload route, database implementation, and admin UI.
- Main risks: untrusted input size/shape, prototype pollution, authorization, partial writes, duplicate identity, content-version semantics, answer exposure, and auditability.
- Suggested order: last of these boundaries, after server auth/authorization and transactional repositories exist.
- Required tests: byte limit, malformed/unsafe input, schema failures, duplicate reporting, authorization, dry-run, idempotency, transaction rollback, rate limits, and real database constraints/RLS.

## Risk summary

Highest-risk future changes are those that touch Learn queue/retry insertion, historical answer replacement, canonical counters, restore/hydration timing, content-version invalidation, and Learn/Test storage isolation. `StudyShell`, `TestShell`, and `SubjectDetail` currently combine UI with persistence and navigation, so repository extraction must proceed behind characterization tests rather than by replacing these components wholesale.

The safest incremental direction is to preserve the generated JSON registry and browser storage as reference implementations, add tests around currently failing/untested boundaries, define narrow domain-facing contracts, and migrate callers one at a time. Authentication, remote resources, synchronization, and uploads must remain separate later stages.
