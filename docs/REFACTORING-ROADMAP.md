# Refactoring Roadmap

## Delivery principles

Each stage below must be implemented, reviewed, and committed separately. Every stage must preserve the previous stage's passing baseline, keep guest/local behavior available until an explicitly approved migration point, and define a rollback boundary that does not require rewriting question data or discarding user progress.

No future feature flag should be enabled before its complete implementation, authorization, failure handling, migration, and regression suite are ready.

## 1. Baseline and characterization tests

### Objective

Make existing behavior deterministic and sufficiently characterized before moving responsibilities across module boundaries.

### Scope

- Reproduce and isolate the current Playwright static-path/JSON parse failure, especially under parallel development-server access.
- Add focused route tests for subject lookup and question pagination.
- Characterize storage write failures, current-index restoration, retry scheduling/replacement, and “new test” persistence semantics.
- Add production-server smoke coverage without changing runtime behavior.

### Likely files or modules

- `e2e/study-flow.spec.ts`
- `playwright.config.ts`
- `tests/domain/study-engine.test.ts`
- `tests/storage/storage.test.ts`
- `tests/storage/test-storage.test.ts`
- `tests/components/StudyShell.test.tsx`
- `tests/components/TestMode.test.tsx`
- New focused tests for `src/app/api/subjects/[slug]/questions/route.ts`

### Dependencies

None beyond the existing npm toolchain and current static/local implementations.

### Acceptance criteria

- The 8 failing Playwright cases have a reproducible root cause and deterministic pass/fail result on local Node 22 and CI.
- Existing 127 Vitest tests continue to pass.
- Production build is started and smoke-tested in automation.
- Characterization tests explicitly lock current retry, resume, count, content-version, and Learn/Test isolation behavior.
- No production behavior or data format changes.

### Regression risks

Tests may accidentally encode timing or implementation details instead of user-visible contracts. Parallel test isolation and localStorage seeding can create false confidence if browser contexts are shared incorrectly.

### Suggested tests

- Serial versus parallel Learn navigation reproduction.
- Static subject registry read under concurrent requests.
- `/api/subjects/[slug]/questions` unknown slug, malformed offset, page boundary, and total.
- `next start` smoke for `/`, a subject route, each study mode, Summary, and API route.
- Storage quota/security exceptions and malformed snapshots.
- Restore `currentIndex`, answered-current advance, unanswered retry stability, and replacement queue behavior.

### Rollback boundary

Test-only commit(s). Revert without changing production modules or persisted data.

## 2. Domain types and JSON schema validation

### Objective

Define one explicit domain contract for current subjects/questions and make invalid local content failures precise without changing the four existing datasets.

### Scope

- Consolidate canonical domain types and schema entry points.
- Document and test source-adapter versus canonical-schema responsibilities.
- Add validator coverage for root object identity, stable IDs, cross-subject assumptions, duplicate prompts, content versions, and question-count derivation.
- Decide and document whether invalid subjects fail the full registry or can be isolated in a future repository.

### Likely files or modules

- `src/domain/subjects/types.ts`
- `src/domain/subjects/schemas.ts`
- `src/domain/subjects/*-adapter.ts`
- `scripts/generate-subject-registry.ts`
- `scripts/validate-subjects.ts`
- `tests/data/subject-validation.test.ts`
- `src/data/generated/subjects.generated.ts`

### Dependencies

Stage 1 characterization baseline.

### Acceptance criteria

- All current JSON files parse to byte-for-byte equivalent canonical question meaning; no source JSON is normalized or rewritten.
- `questionCount` remains schema-checked against `questions.length`.
- Per-subject ID/number and option/answer integrity is explicit and tested.
- Multiple-answer, explanation, provenance, review, and duplicate metadata survive adapters unchanged according to documented rules.
- Generator and validator failures identify the file and violated invariant.

### Regression risks

Adapter output changes can invalidate persisted progress, alter correct answers, reorder questions, or change generated registry content. Overly strict prompt validation may reject intentional duplicates.

### Suggested tests

- Snapshot/hash parity for canonical IDs, numbers, types, option IDs, answer sets, and counts.
- Invalid root object, duplicate ID/number, missing answer option, invalid metadata, filename/slug mismatch, and duplicate subject identity.
- Existing dataset-specific integrity assertions.

### Rollback boundary

Revert schema/generator/test commit while retaining unchanged JSON and the prior generated registry.

## 3. Progress logic extraction

### Objective

Separate browser and React orchestration from progress business rules without changing Learn or Test behavior.

### Scope

- Move remaining progress calculations, transition decisions, and restoration policies into pure functions.
- Define explicit use-case functions for load/normalize/resume, answer, replace, navigate, restart, reset, and Test lifecycle.
- Keep localStorage adapters and UI output unchanged.
- Document the current retry behavior, including the unused persisted `retryGap`, before deciding any later behavior change.

### Likely files or modules

- `src/domain/study/reducer.ts`
- `src/domain/study/resume.ts`
- `src/domain/study/selectors.ts`
- `src/domain/study/create-session.ts`
- `src/domain/test/reducer.ts`
- `src/domain/test/generation.ts`
- `src/domain/test/scoring.ts`
- `src/components/study/StudyShell.tsx`
- `src/components/test/TestShell.tsx`
- Associated domain/component tests

### Dependencies

Stages 1 and 2.

### Acceptance criteria

- Study/Test state transitions are callable without React, Next.js, or browser globals.
- UI components render and dispatch use cases but do not recalculate canonical counts or correctness.
- Resume, retries, historical replacement, mastery, exact-set scoring, and Test/Learn isolation remain unchanged.
- All characterization tests pass.

### Regression risks

Changing update ordering can alter timestamps, auto-advance, retry insertion, completed-session counts, or save timing. “Cleaning up” retry replacement semantics in this stage would be a behavior change and is out of scope.

### Suggested tests

- Table-driven transition tests for every answer type and replacement transition.
- Queue/frontier/canonical counter invariants.
- Complete/resume exactly once.
- Deterministic shuffle and Test retake preservation.
- UI contract tests proving temporary reveal state resets correctly.

### Rollback boundary

Revert the pure-domain extraction commit; persisted schema and keys remain unchanged.

## 4. Local repository abstraction

### Objective

Introduce domain-facing `SubjectRepository`, `QuestionSetRepository`, and `ProgressRepository` contracts backed by current generated JSON and localStorage.

### Scope

- Define narrow interfaces and result/error types.
- Wrap the generated registry in local subject/question repositories.
- Wrap Learn/Test browser storage in a local progress repository with consistent failure behavior.
- Migrate callers incrementally: read-only cards/Summary, detail, Questions API/list, Learn, then Test.
- Do not add remote calls, accounts, or dependencies.

### Likely files or modules

- `src/data/generated/subjects.generated.ts`
- `src/app/page.tsx`
- `src/app/subjects/[slug]/*`
- `src/app/api/subjects/[slug]/questions/route.ts`
- `src/components/subjects/SubjectCard.tsx`
- `src/components/subjects/SubjectDetail.tsx`
- `src/components/study/StudyShell.tsx`
- `src/components/study/Summary.tsx`
- `src/components/test/TestShell.tsx`
- `src/lib/storage/*`
- Existing `src/lib/backend/types.ts`, `local.ts`, and `progress.ts`, after deciding whether to adapt or supersede their dormant contracts

### Dependencies

Stages 1–3.

### Acceptance criteria

- Production UI no longer imports generated registry or browser storage outside composition/adapters.
- Local implementations produce the same subjects, questions, keys, snapshots, notices, and resume behavior.
- Storage access is client-safe and unavailable-storage behavior is consistent across Learn, Test, detail, cards, and Summary.
- No network/backend dependency is introduced.

### Regression risks

Async repository contracts can change server rendering/static params and hydration. A broad “big bang” migration could silently reset progress or alter bundle boundaries. Existing dormant backend types may not match current UI semantics.

### Suggested tests

- Contract suites shared by local repository implementations.
- Generated registry parity and route not-found behavior.
- Storage load/save/remove/mismatch/error contracts.
- Full Learn/Test E2E and production-server smoke after each migrated caller.

### Rollback boundary

Keep old adapters intact until the final caller migration. Revert one caller/adapter commit at a time without changing storage keys or JSON.

## 5. Authentication foundation

### Objective

Add a server-verified account foundation while retaining the unauthenticated guest application.

### Scope

- Finalize the `AuthService` contract and guest/user session model.
- Select and configure an approved provider in a later implementation task.
- Add server-side session verification, sign-in/sign-out UI, protected admin boundary, and disabled-by-default rollout flag.
- Do not synchronize progress yet.

### Likely files or modules

- `src/lib/backend/types.ts`
- `src/lib/backend/local.ts`
- New server-only auth adapter/composition modules
- `src/app/layout.tsx` and account routes/components
- `.env.example` with placeholders only
- Auth tests and deployment configuration documentation

### Dependencies

Stable Stage 4 repositories and an explicit backend/provider decision.

### Acceptance criteria

- Guest users retain all existing functionality with auth disabled or unsigned-in.
- Authenticated identity and roles are verified server-side; client flags never grant authority.
- Sign-in/out errors and session expiry fail safely.
- No secret is client-exposed or committed.
- Progress remains local and unchanged in this stage.

### Regression risks

Guest lockout, redirect loops, hydration mismatch, session leakage, client-trusted admin role, and accidental progress reassignment.

### Suggested tests

- Disabled, guest, signed-in, signed-out, expired, and unauthorized paths.
- Server authorization tests and browser navigation smoke.
- Secret scanning and environment validation.

### Rollback boundary

Disable the auth feature flag and revert auth composition/UI while preserving local repositories and guest data.

## 6. Backend and database foundation

### Objective

Create tested remote repository implementations and database policies without connecting study progress synchronization.

### Scope

- Review and apply the existing Supabase migration only in disposable/staging environments.
- Implement server-only user/subject/question repository adapters.
- Validate schema constraints, ownership, RLS, transactions, and operational configuration.
- Keep local subject data as the active production source until parity is proven.

### Likely files or modules

- `supabase/migrations/202607260001_backend_foundation.sql`
- `src/lib/backend/types.ts`
- `src/lib/backend/remote.ts`
- New server-only database adapters and integration tests
- `docs/BACKEND-SETUP.md`

### Dependencies

Stages 4 and 5, approved provider/project, and secure deployment configuration.

### Acceptance criteria

- Migrations apply and roll back in a disposable environment.
- RLS/constraints are integration-tested for guest, owner, user, and admin cases.
- Remote subject/question output matches local canonical contracts.
- Production still defaults to local repositories.
- No service credential reaches browser bundles.

### Regression risks

RLS gaps, destructive migrations, divergent local/remote IDs or content versions, connection exhaustion, latency, and accidental remote enablement.

### Suggested tests

- Migration and database constraint tests.
- Repository contract parity against local adapters.
- RLS negative tests and transaction rollback.
- Server-only bundle/secret checks.

### Rollback boundary

Keep remote adapters disabled; roll back disposable/staging migrations through reviewed down/recovery procedures without changing local application behavior.

## 7. Remote progress synchronization

### Objective

Synchronize account-scoped progress while retaining local-first durability and predictable conflict behavior.

### Scope

- Implement remote `ProgressRepository` persistence.
- Define ownership, revisions, idempotency, merge/conflict policy, retry, offline queue, and guest-to-account migration.
- Add visible synchronization status and recovery controls.
- Roll out behind a disabled-by-default flag.

### Likely files or modules

- `src/lib/backend/progress.ts`
- `src/lib/backend/retry.ts`
- Stage 4 progress interfaces/local adapter
- Study/Test orchestration components or dedicated sync coordinator
- Remote progress routes/adapters and integration tests

### Dependencies

Stages 5 and 6 plus stable persisted-domain contracts.

### Acceptance criteria

- Guest progress remains local.
- Signed-in progress is namespaced and server-authorized.
- Reload, offline, retry, concurrent-tab/device, version mismatch, and sign-out behavior are specified and tested.
- Migration is idempotent and never silently discards the only known snapshot.
- Canonical totals/retries and Learn/Test isolation remain correct.

### Regression risks

Lost updates, duplicate attempts, stale queue overwrite, cross-user leakage, conflicting active sessions, timestamp skew, and destructive guest migration.

### Suggested tests

- Two-device conflict matrices and optimistic-concurrency rejection.
- Offline/reconnect and retry idempotency.
- Guest migration replay/rollback.
- Content-version conflict and malformed remote snapshot recovery.
- End-to-end local fallback when remote is unavailable.

### Rollback boundary

Disable remote progress and continue using the unchanged local snapshot; retain remote data for later reconciliation rather than deleting it.

## 8. Secure JSON import pipeline

### Objective

Provide a server-authorized, transactional import path for canonical subject JSON without exposing database credentials or trusting browser validation.

### Scope

- Finalize `ImportService` around the existing validator.
- Add authenticated admin-only server endpoint/job, limits, audit records, dry-run, idempotency, and transaction boundaries.
- Store immutable import artifacts/reports as required by the approved backend design.
- Do not yet expose a general admin UI.

### Likely files or modules

- `src/lib/backend/import.ts`
- `src/lib/backend/permissions.ts`
- Subject/question repositories
- New server route/job and database integration tests
- `docs/JSON-IMPORT.md`

### Dependencies

Stages 2, 5, 6, and approved content-version policy.

### Acceptance criteria

- Only server-verified admins can import.
- Size, content type, JSON parsing, unsafe keys, schema, duplicate identity, and content version are validated server-side.
- Dry-run returns deterministic diagnostics without writes.
- Commit is atomic/idempotent and records who imported what hash/version.
- Existing local JSON remains unchanged until an explicit content migration stage.

### Regression risks

Privilege escalation, denial of service, partial writes, duplicate identity, malicious content, answer corruption, and resetting users through incorrect content versions.

### Suggested tests

- Authorization/RLS negatives, byte and rate limits, malformed/prototype-polluting input, duplicate prompts/IDs, rollback, idempotency, and concurrent imports.
- Canonical parity after export/reload.

### Rollback boundary

Disable the import endpoint/worker and leave current subject repositories read-only; roll back only the failed transaction/import version.

## 9. Admin integration

### Objective

Add a minimal, accessible administration workflow over the secured import and repository services.

### Scope

- Admin route protection and navigation.
- File selection, dry-run preview, diagnostics, explicit confirmation, import status/history, and failure recovery.
- No client-side privilege decisions or direct database access.

### Likely files or modules

- New `src/app/admin` routes and components
- Auth/permission composition
- Import service endpoint/client
- Shared dialog/error UI and admin E2E tests

### Dependencies

Stages 5, 6, and 8.

### Acceptance criteria

- Non-admin users cannot discover or invoke privileged mutations successfully.
- Admins see exact validation warnings/errors before commit.
- Upload/import progress, retry, and final version/hash are clear.
- Accessibility and security tests pass.
- Study routes remain unaffected when admin features are disabled.

### Regression risks

Client authorization bypass, accidental publish, double submit, inaccessible dialogs, sensitive diagnostic leakage, and large-file UI instability.

### Suggested tests

- Role-based route and endpoint access.
- Dry-run/confirm/cancel/double-submit/error recovery.
- Keyboard/focus/assistive technology checks.
- Audit history and server log correlation.

### Rollback boundary

Disable/remove admin navigation and route UI while leaving the independently secured import service disabled or available only to controlled server tooling.

## 10. Cleanup and final regression validation

### Objective

Remove superseded scaffolding only after all migrations are proven, then certify local, guest, authenticated, remote, and admin behavior.

### Scope

- Remove dead adapters/flags only when no rollback depends on them.
- Consolidate documentation and environment validation.
- Run full unit, integration, production E2E, cross-browser, accessibility, security, migration, and performance checks.
- Verify data and progress migrations against backups/fixtures.

### Likely files or modules

All migrated repositories/services, `src/lib/backend`, `src/lib/storage`, route composition, CI, deployment docs, and test suites.

### Dependencies

Stages 1–9 completed and separately accepted.

### Acceptance criteria

- No unused or contradictory active implementation remains.
- All local JSON and imported remote data pass canonical validation.
- Guest/local fallback and authenticated synchronization pass documented scenarios.
- Production build/runtime, analytics, error handling, permissions, and migrations are verified.
- Rollback/runbook and monitoring ownership are documented.

### Regression risks

Premature deletion of fallback paths, inability to read legacy snapshots, hidden environment coupling, and migration-only defects not represented by fresh test data.

### Suggested tests

- Full CI on Node 22 from a clean install.
- Production-server E2E in Chromium, Firefox, and WebKit plus responsive/mobile coverage.
- Accessibility/security scans and RLS integration suite.
- Legacy local snapshot and guest migration fixtures.
- Load/performance tests for largest subject and concurrent sync/import.

### Rollback boundary

Tag the last fully verified release before cleanup; preserve reversible data migrations and keep the prior deployment artifact/configuration available until post-release monitoring is complete.

# Ordered TODOs

## Now

- [ ] Reproduce the 8 failing Learn Playwright cases on Node 22 with serial and fully parallel workers and record whether concurrent subject-registry reads trigger the JSON parse error.
- [ ] Add direct tests for unknown slug, invalid offset, page boundary, and total in `src/app/api/subjects/[slug]/questions/route.ts`.
- [ ] Add a production `next start` smoke test for `/`, `/subjects/swd392`, all three study modes, Summary, and the question API.
- [ ] Add regression coverage for restoring `currentIndex` when the persisted current queue item is answered.
- [ ] Add regression coverage for preserving an unanswered retry queue instance across two reloads.
- [ ] Add regression coverage for localStorage write failure in Test mode and Subject Detail.
- [ ] Characterize and document whether “New test” must delete or retain the submitted Test snapshot before changing behavior.
- [ ] Add a schema-validator test for every current subject JSON root object and filename/slug pair.
- [ ] Add canonical parity assertions for question IDs, numbers, types, option IDs, answer sets, and counts for all four subjects.

## Next

- [ ] Extract remaining Learn restore/answer/replace/navigation decisions into pure use-case functions without changing queue behavior.
- [ ] Extract remaining Test create/respond/submit/retake decisions into pure use-case functions without changing persistence semantics.
- [ ] Define a `SubjectRepository` contract with list and get-by-slug operations plus explicit not-found/error results.
- [ ] Implement a local `SubjectRepository` adapter over `subjects.generated.ts` and prove registry parity.
- [ ] Define a `QuestionSetRepository` contract with complete-set and paginated query operations.
- [ ] Implement a local `QuestionSetRepository` adapter preserving canonical order, totals, answers, and content version.
- [ ] Define a `ProgressRepository` contract that preserves current Learn/Test keys and distinguishes missing, invalid, incompatible, and unavailable storage.
- [ ] Extract browser-storage access from `StudyShell`, `TestShell`, `SubjectDetail`, `SubjectCard`, and `Summary` one caller at a time.
- [ ] Standardize unavailable-storage handling so Test and Subject Detail degrade as safely as Learn.
- [ ] Add shared repository contract tests for all local adapters.

## Later

- [ ] Finalize an `AuthService` contract that keeps guest mode functional when authentication is disabled.
- [ ] Select an authentication/database provider and document server-only environment requirements without adding real values.
- [ ] Add server-verified sign-in/sign-out/session handling and admin authorization behind a disabled flag.
- [ ] Apply the backend migration only to a disposable environment and add database/RLS integration tests.
- [ ] Implement remote subject and question repositories and verify parity with local canonical data.
- [ ] Define revision, conflict, retry, and idempotency rules for remote progress before enabling synchronization.
- [ ] Implement reversible guest-progress migration with duplicate-replay tests.
- [ ] Add visible offline/synchronization/conflict status before enabling remote progress.
- [ ] Complete server-side `ImportService` authorization, limits, transaction, hash, and audit behavior.
- [ ] Add an admin-only dry-run import endpoint with rate limiting and no client database credential.
- [ ] Add an accessible admin import UI only after endpoint authorization and transaction tests pass.
- [ ] Run full production, cross-browser, accessibility, security, migration, and performance regression validation before cleanup.
