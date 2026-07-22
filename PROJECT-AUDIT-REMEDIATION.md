# Project Audit Remediation

Remediation date: 2026-07-22  
Branch: `fix/pre-production-audit`  
Original audit: `PROJECT-AUDIT-REPORT.md`

## Finding status

| Original audit finding | Status | Files changed | Tests added or updated | Commit | Verification | Remaining limitations |
| --- | --- | --- | --- | --- | --- | --- |
| Audited application was mostly uncommitted and unreproducible | Fixed | Complete audited application tree; `.gitignore` | Existing 29 Vitest and 8 Playwright tests | `99f7bdd` | data generation/validation, lint, typecheck, test, build, E2E | Clean-clone verification remains recommended outside this working directory |
| “Học lại” resumed the incomplete session | Fixed | `StudyShell.tsx`, `Summary.tsx`, `SubjectDetail.tsx` | Continue, restart, cancel, fresh session/queue tests | `4e3035a` | focused StudyShell tests, lint, typecheck | Restart preserves long-lived question progress by design; only explicit progress reset clears it |
| Persisted state lacked relational validation and safe recovery | Fixed | storage schemas/adapter, StudyShell | Bounded indices, identity/version, uniqueness, key and isolation cases | `e04d1cd` | 14 storage tests, lint, typecheck | No persisted-schema migration layer; unsupported schema resets the affected subject |
| Reducer trusted caller-supplied question and option | Fixed | `src/domain/study/reducer.ts` | Mismatch, unknown option, invalid index, missing progress, answered/completed cases | `e41e328`, `837e786` | 13 domain tests, lint, typecheck | API returns the unchanged state rather than a typed error object |
| Mastery, retry, navigation, shuffle and completion coverage was incomplete | Fixed | domain tests | Mastery/demotion, unknown, retry, history/frontier, shuffle permutation, one-time completion | `837e786` | focused domain suite | Retry-near-end behavior is covered by insertion clamping in implementation but not a dedicated named test |
| Available explanations were not displayed | Fixed | StudyShell, CSS | Correct, incorrect, don’t-know, pre-answer and null explanation cases | `a19f6bb` | 17 focused component tests, lint, typecheck | Explanation history uses the same persisted answered-instance rendering path |
| Summary remaining count excluded unseen questions | Fixed | Summary and selectors | Selector behavior exercised by domain/component suites | `abcd3bf` | 30 focused tests, lint, typecheck | No standalone Summary component test file |
| Dialog focus restoration/modal isolation and progress semantics were incomplete | Fixed | StudyShell, CSS | Focus return, Escape, Tab wrap, progressbar ARIA and aria-live | `16a67aa` | 19 focused component tests, lint, typecheck | No axe suite or manual screen-reader/contrast audit was added |
| Registry could silently collide duplicate subject identities | Partially fixed | registry generator | Current output/generation verified | `64ce385` | generation, validation, generated diff, lint, typecheck | Generator rejects duplicates and filename mismatch; dedicated temporary-directory unit tests were not added |
| Content-version browser reset was not covered | Fixed | Playwright spec | Isolated v1→v2 reset, notice once, unrelated key preservation | `2d5d3b0` | focused Chromium Playwright test | The E2E checks current version use; it does not assert a specific corrected option ID |
| CI omitted Playwright and generated-file cleanliness | Fixed | GitHub Actions workflow | Chromium E2E included | `5a29db7` | workflow structure plus local full suite | CI uses mutable official major action tags rather than pinned SHAs |
| Unused `lucide-react` dependency | Fixed | package manifests | Full suite rerun | `477c07f` | npm ci, full checks, build, E2E | None |
| Production dependency advisories | Risk accepted | README | Full suite and production audit rerun | `22364c2` | `npm audit --omit=dev` | Latest stable Next 16.2.11 still brings PostCSS moderate and sharp/libvips high advisories; npm offers only an unacceptable forced Next 9 downgrade |
| README did not describe SWD392 v2 and release behavior | Fixed | README | Documentation validation via lint/typecheck | `22364c2` | lint, typecheck | Academic correctness is not claimed beyond dataset provenance |
| No multi-tab synchronization | Risk accepted | README | None | `22364c2` | Documentation review | Concurrent tabs may overwrite stale snapshots |

## Commit table

| Commit | Purpose | Verification |
| --- | --- | --- |
| `99f7bdd` | Capture audited application baseline | 29 Vitest, 8 Playwright, lint, typecheck, data checks, build |
| `4e3035a` | Create explicit confirmed restart sessions | 13 focused component tests, lint, typecheck |
| `e04d1cd` | Validate persisted semantic invariants | 14 storage tests, lint, typecheck |
| `e41e328` | Reject invalid answer-domain input | Focused domain tests, lint, typecheck |
| `837e786` | Expand mastery/retry/navigation/completion tests | 13 domain tests |
| `a19f6bb` | Render post-answer explanations | 17 component tests, lint, typecheck |
| `abcd3bf` | Correct remaining-question metrics | 30 focused tests, lint, typecheck |
| `16a67aa` | Improve dialog/progress accessibility | 19 component tests, lint, typecheck |
| `64ce385` | Reject duplicate registry identities | generate, validate, generated diff, lint, typecheck |
| `2d5d3b0` | Cover content-version browser reset | 1 focused Chromium test, lint, typecheck |
| `5a29db7` | Add Playwright and generated checks to CI | lint, typecheck |
| `477c07f` | Remove unused icon dependency | 55 Vitest, 9 Playwright, data checks, lint, typecheck, build |
| `22364c2` | Update SWD392 v2/release/security docs | lint, typecheck |

## Final verification commands

```bash
npm ci
npm run data:generate
npm run data:validate
npm run lint
npm run typecheck
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
npm audit --omit=dev
git status --short
git log --oneline --decorate -20
```

## Remaining limitations

- Production dependency audit remains nonzero until a compatible stable Next.js release updates bundled PostCSS and sharp/libvips.
- No multi-tab synchronization, cross-device synchronization, account, backend, or cloud persistence.
- Accessibility automation covers targeted semantics/focus but not full axe, screen-reader, contrast, zoom, or real-device testing.
- Registry duplicate behavior is enforced in production generation but lacks isolated fixture-based generator tests.
- Actual Vercel Preview and production deployments were not performed.

## Final Git state

The remediation report was authored while the tree was otherwise clean. The authoritative final status and command outcomes are recorded after the final sequential verification and report commit.
