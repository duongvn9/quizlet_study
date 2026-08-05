import { readFileSync } from "node:fs";
import { join } from "node:path";
import { adaptFeSwd392, feSwd392RawSchema } from "../src/domain/subjects/fe-swd392-adapter";
import { adaptMln122, mln122RawSchema } from "../src/domain/subjects/mln122-adapter";
import { adaptMma301, mma301RawSchema } from "../src/domain/subjects/mma301-adapter";
import { adaptPmg201c, pmg201cRawSchema } from "../src/domain/subjects/pmg201c-adapter";
import { subjectSchema } from "../src/domain/subjects/schemas";

const dir = join(process.cwd(), "src/data/subjects");
const adapters = { "fe-swd392.json": adaptFeSwd392, "mln122.json": adaptMln122, "mma301.json": adaptMma301, "pmg201c.json": adaptPmg201c, "swd392.json": subjectSchema.parse } as const;
let failed = false;
for (const file of Object.keys(adapters).sort() as (keyof typeof adapters)[]) {
  try {
    const value = JSON.parse(readFileSync(join(dir, file), "utf8"));
    const subject = adapters[file](value);
    if (subject.slug === "fe-swd392") {
      const raw = feSwd392RawSchema.parse(value);
      if (raw.schemaVersion !== "1.0" || raw.subject.code !== "FE_SWD" || raw.subject.language !== "en" || raw.totalQuestions !== 263 || raw.questions.length !== 263) throw new Error("FE SWD392 source metadata or total mismatch");
      if (!subject.questions.every((question, index) => question.number === index + 1 && question.id === `fe-swd392-${String(index + 1).padStart(3, "0")}`)) throw new Error("FE SWD392 order or ID mismatch");
      if (subject.questions.filter((question) => question.type === "single-choice").length !== 261 || subject.questions.filter((question) => question.type === "true-false").length !== 2) throw new Error("FE SWD392 type distribution mismatch");
      const optionCounts = Object.fromEntries([2, 3, 4].map((count) => [count, subject.questions.filter((question) => question.options.length === count).length]));
      if (JSON.stringify(optionCounts) !== JSON.stringify({ 2: 2, 3: 2, 4: 259 })) throw new Error("FE SWD392 option distribution mismatch");
      const answerCounts = Object.fromEntries(["A", "B", "C", "D"].map((answer) => [answer, subject.questions.filter((question) => question.correctAnswer === answer).length]));
      if (JSON.stringify(answerCounts) !== JSON.stringify({ A: 62, B: 74, C: 82, D: 45 })) throw new Error("FE SWD392 answer distribution mismatch");
      if (subject.dataQuality.needsReviewCount !== 8) throw new Error("FE SWD392 review count mismatch");
      if (subject.questions.some((question) => !question.options.some((option) => option.id === question.correctAnswer))) throw new Error("FE SWD392 answer reference mismatch");
    }
    if (subject.slug === "swd392") {
      if (subject.questions.length !== 249) throw new Error("SWD392 must have 249 questions");
      if (subject.questions.filter((question) => question.options.length === 4).length !== 246) throw new Error("SWD392 four-option count mismatch");
      if (![19, 39, 42].every((number) => subject.questions.find((question) => question.number === number)?.options.length === 5)) throw new Error("Questions 19, 39, and 42 must have five options");
      if (subject.questions.filter((question) => question.needsReview).length !== 14) throw new Error("SWD392 review count mismatch");
      if (subject.questions.filter((question) => question.explanation !== null).length !== 22) throw new Error("SWD392 explanation count mismatch");
      if (subject.dataQuality.answerCorrectionCount !== 21) throw new Error("SWD392 answer correction count mismatch");
    }
    if (subject.slug === "mma301") {
      const raw = mma301RawSchema.parse(value);
      if (raw.questions.length !== 184 || subject.questions.length !== 182) throw new Error("MMA301 must have exactly 184 source entries and 182 active questions");
      const excluded = raw.questions.filter((question) => question.status !== "active").map((question) => question.number);
      if (excluded.length !== 2 || ![64, 96].every((number) => excluded.includes(number)) || subject.questions.some((question) => excluded.includes(question.number))) throw new Error("MMA301 inactive entries mismatch");
      if (JSON.stringify(raw.review.correctedAnswerQuestions) !== JSON.stringify([50, 88, 93, 101, 118, 141, 166, 176, 179])) throw new Error("MMA301 corrected answer list mismatch");
      if (JSON.stringify(raw.review.repairedOptionOrQuestionQuestions) !== JSON.stringify([36, 72, 82, 86, 103, 114, 121, 145, 150, 154, 180])) throw new Error("MMA301 repaired content list mismatch");
      if (JSON.stringify(raw.review.unresolvedWarningQuestions) !== JSON.stringify([34, 64, 96, 124])) throw new Error("MMA301 unresolved warning list mismatch");
      if (subject.contentVersion !== 2) throw new Error("MMA301 content version mismatch");
      if (raw.questions.some((question) => question.status === "active" && question.type === "multiple_choice" && question.correctAnswers.length < 1)) throw new Error("MMA301 multiple-choice questions need at least one answer");
      for (const [number, answers] of [[50, ["A", "C"]], [88, ["B"]], [93, ["A", "B"]], [101, ["A", "B", "D"]], [118, ["B"]], [141, ["B"]], [166, ["B"]], [176, ["A", "B"]], [179, ["A"]]] as const) {
        const question = subject.questions.find((item) => item.number === number);
        if (JSON.stringify(question?.correctAnswers) !== JSON.stringify(answers)) throw new Error(`MMA301 question ${number} corrected answers mismatch`);
      }
      if (subject.questions.find((item) => item.number === 88)?.type !== "multiple-choice" || subject.questions.find((item) => item.number === 176)?.type !== "multiple-choice") throw new Error("MMA301 corrected multiple-choice type mismatch");
    }
    if (subject.slug === "pmg201c") {
      const raw = pmg201cRawSchema.parse(value);
      if (subject.questions.length !== 221 || subject.questionCount !== 221) throw new Error("PMG201c must have exactly 221 active questions");
      if (!subject.questions.every((question, index) => question.number === index + 1 && question.id === `pmg201c-${String(index + 1).padStart(3, "0")}`)) throw new Error("PMG201c order or ID mismatch");
      const typeCounts = Object.fromEntries(["single-choice", "multiple-choice", "true-false"].map((type) => [type, subject.questions.filter((question) => question.type === type).length]));
      if (JSON.stringify(typeCounts) !== JSON.stringify({ "single-choice": 150, "multiple-choice": 3, "true-false": 68 })) throw new Error("PMG201c type distribution mismatch");
      const optionCounts = Object.fromEntries([2, 3, 4, 5, 6].map((count) => [count, subject.questions.filter((question) => question.options.length === count).length]));
      if (JSON.stringify(optionCounts) !== JSON.stringify({ 2: 69, 3: 5, 4: 132, 5: 9, 6: 6 })) throw new Error("PMG201c option distribution mismatch");
      if (subject.dataQuality.needsReviewCount !== 77 || subject.dataQuality.duplicatePromptGroups.length !== 35 || raw.dataQuality.conflictingDuplicatePromptGroups.length !== 2) throw new Error("PMG201c review or duplicate metadata mismatch");
      for (const [number, answers] of [[90, ["C", "D"]], [93, ["A", "B"]], [220, ["A", "B"]]] as const) if (JSON.stringify(subject.questions[number - 1].correctAnswers) !== JSON.stringify(answers)) throw new Error(`PMG201c question ${number} answers mismatch`);
    }
    if (subject.slug === "mln122") {
      const raw = mln122RawSchema.parse(value);
      if (raw.totalQuestions !== 478 || raw.questions.length !== 478 || subject.questions.length !== 475 || raw.schemaVersion !== "1.1-final") throw new Error("MLN122 stored or active total mismatch");
      const activeRaw = raw.questions.filter((question) => question.disabled !== true);
      if (!subject.questions.every((question, index) => question.number === activeRaw[index].id && question.id === `mln122-${String(activeRaw[index].id).padStart(3, "0")}`)) throw new Error("MLN122 order or ID mismatch");
      if (raw.questions.filter((question) => question.disabled === true).length !== 3 || raw.questions.filter((question) => question.disabled === true).some((question) => question.correctAnswer !== null)) throw new Error("MLN122 disabled semantics mismatch");
      const optionCounts = Object.fromEntries([3, 4, 5, 6].map((count) => [count, subject.questions.filter((question) => question.options.length === count).length]));
      if (JSON.stringify(optionCounts) !== JSON.stringify({ 3: 125, 4: 335, 5: 14, 6: 1 })) throw new Error("MLN122 option distribution mismatch");
      const answerCounts = Object.fromEntries(["A", "B", "C", "D", "E", "F"].map((answer) => [answer, subject.questions.filter((question) => question.correctAnswer === answer).length]));
      if (JSON.stringify(answerCounts) !== JSON.stringify({ A: 198, B: 100, C: 90, D: 72, E: 14, F: 1 })) throw new Error("MLN122 answer distribution mismatch");
      if (!subject.questions.every((question) => question.correctAnswers.length > 0 && question.options.some((option) => option.id === question.correctAnswer))) throw new Error("MLN122 answer reference mismatch");
    }
    console.log(`PASS ${file}: ${subject.questions.length} questions, ${subject.dataQuality.needsReviewCount} review, v${subject.contentVersion}`);
  } catch (error) {
    failed = true;
    console.error(`FAIL ${file}:`, error);
  }
}
if (failed) process.exit(1);
