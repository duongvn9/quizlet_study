# PMG201c Integration Report

## Result

PMG201c is integrated as runtime subject `pmg201c` with display code `PMG201c`, title `Project Management`, English language, and 221 active questions.

Counts: 150 single-choice, 3 multiple-choice, 68 true-false; option distribution 69 two-option, 5 three-option, 132 four-option, 9 five-option, 6 six-option; 77 review-needed questions; 35 duplicate-prompt groups; 2 conflicting duplicate groups.

## Architecture

The raw source remains unchanged at `src/data/subjects/pmg201c.json`. `src/domain/subjects/pmg201c-adapter.ts` validates the source contract with Zod, maps raw types and option keys into the canonical runtime model, preserves answer arrays and review/source metadata, and converts blank explanations to runtime `null`. Shared subject routes, study/test engines, storage namespaces, and components are reused.

The deterministic generated registry is `src/data/generated/subjects.generated.ts`.

## Files added or changed

- `src/domain/subjects/pmg201c-adapter.ts`
- `src/data/subjects/pmg201c.json`
- `src/data/generated/subjects.generated.ts`
- `scripts/generate-subject-registry.ts`
- `scripts/validate-subjects.ts`
- `src/components/subjects/SubjectDetail.tsx`
- `tests/data/subject-validation.test.ts`
- `tests/domain/pmg201c-study-engine.test.ts`
- `tests/components/Pmg201cStudyShell.test.tsx`
- `tests/components/SubjectDetail.test.tsx`
- `e2e/study-flow.spec.ts`
- `README.md`

## Validation and tests

Commands and results are recorded in the final CLI session. Required gates include generation, data validation, lint, typecheck, unit/component tests, build, Playwright, `git diff --check`, and Git status/diff review.

## Source warnings and limitations

The supplied source answers and extraction warnings are preserved. The source notes that answers were not independently verified. Duplicate prompts remain intact, including conflicting duplicate groups; no questions were reordered, merged, removed, or deduplicated.

## Git

Commit hash: pending until final quality gates.

Push status: pending until final quality gates and remote check.
