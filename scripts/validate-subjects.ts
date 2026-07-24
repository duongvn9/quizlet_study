import { readFileSync } from "node:fs";
import { join } from "node:path";
import { adaptFeSwd392, feSwd392RawSchema } from "../src/domain/subjects/fe-swd392-adapter";
import { adaptMln122, mln122RawSchema } from "../src/domain/subjects/mln122-adapter";
import { adaptMma301, mma301RawSchema } from "../src/domain/subjects/mma301-adapter";
import { subjectSchema } from "../src/domain/subjects/schemas";

const dir = join(process.cwd(), "src/data/subjects");
const adapters = { "fe-swd392.json": adaptFeSwd392, "mln122.json": adaptMln122, "mma301.json": adaptMma301, "swd392.json": subjectSchema.parse } as const;
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
      if (JSON.stringify(answerCounts) !== JSON.stringify({ A: 61, B: 75, C: 82, D: 45 })) throw new Error("FE SWD392 answer distribution mismatch");
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
      if (![118, 150].every((number) => subject.questions.find((question) => question.number === number)?.needsReview)) throw new Error("MMA301 source warnings were not retained");
      for (const number of [50, 93, 101]) {
        const question = subject.questions.find((item) => item.number === number);
        if (question?.type === "multiple-choice" && question.correctAnswers.length === 1) console.warn(`WARN mma301.json: question ${number} is multiple-choice with one preserved source answer`);
      }
    }
    if (subject.slug === "mln122") {
      const raw = mln122RawSchema.parse(value);
      if (raw.totalQuestions !== 478 || subject.questions.length !== raw.totalQuestions) throw new Error("MLN122 total mismatch");
      if (!subject.questions.every((question, index) => question.number === index + 1 && question.id === `mln122-${String(index + 1).padStart(3, "0")}`)) throw new Error("MLN122 order mismatch");
      const optionCounts = Object.fromEntries([3, 4, 5, 6].map((count) => [count, subject.questions.filter((question) => question.options.length === count).length]));
      if (JSON.stringify(optionCounts) !== JSON.stringify({ 3: 128, 4: 338, 5: 11, 6: 1 })) throw new Error("MLN122 option distribution mismatch");
      const answerCounts = Object.fromEntries(["A", "B", "C", "D", "E", "F"].map((answer) => [answer, subject.questions.filter((question) => question.correctAnswer === answer).length]));
      if (JSON.stringify(answerCounts) !== JSON.stringify({ A: 196, B: 101, C: 94, D: 75, E: 11, F: 1 })) throw new Error("MLN122 answer distribution mismatch");
      if (!subject.questions.every((question) => question.options.some((option) => option.id === question.correctAnswer))) throw new Error("MLN122 answer reference mismatch");
    }
    console.log(`PASS ${file}: ${subject.questions.length} questions, ${subject.dataQuality.needsReviewCount} review, v${subject.contentVersion}`);
  } catch (error) {
    failed = true;
    console.error(`FAIL ${file}:`, error);
  }
}
if (failed) process.exit(1);
