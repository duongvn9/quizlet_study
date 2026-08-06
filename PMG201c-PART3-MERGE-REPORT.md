# PMG201c Part 3 Merge Report

## Result

Part 3 was validated and merged into `src/data/subjects/pmg201c.json`. The supplement contained 112 sequential, unique questions numbered 222–333 with source question numbers 1–112. No source question, option, answer, explanation, or provenance text was modified.

The merged dataset contains exactly 333 active questions: 222 single-choice, 4 multiple-choice, and 107 true-false. Option-count distribution is 109 two-option, 6 three-option, 194 four-option, 16 five-option, and 8 six-option questions.

## Duplicate and review metadata

Duplicate prompts were recomputed over all 333 questions using Unicode NFKC normalization, lowercase conversion, replacement of non-letter/non-number runs with spaces, whitespace collapse, and trim. This produces exactly 66 duplicate-prompt groups.

A duplicate group is conflicting when normalized correct-option text differs, including differences caused by answer-to-option mapping. This produces exactly 9 conflicting groups.

Duplicate review notes were rebuilt while preserving unrelated notes and deduplicating identical strings. Every member of a duplicate group is marked `needsReview`; existing independently warned questions remain reviewed. The final review count is exactly 146. Extraction warnings were deterministically rebuilt in duplicate-group order, with one duplicate warning per group and one additional conflict warning per conflicting group.

## Runtime compatibility

The adapter and validation script enforce the 333-question source contract, Part 3 provenance range, distributions, normalized duplicate groups, conflict groups, and review metadata. Runtime `contentVersion` remains 1 because the original 221 IDs and content are unchanged and Part 3 is additive. Existing valid 221-question PMG201c progress therefore remains loadable; a focused storage regression test covers this behavior.

## Files

The standalone `src/data/subjects/pmg201c-bo-sung.json` supplement was removed after successful merge. README and PMG validation/runtime tests were updated for the merged dataset.
