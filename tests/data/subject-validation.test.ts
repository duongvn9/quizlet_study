import { describe, expect, it } from "vitest";
import feSwdData from "@/data/subjects/fe-swd392.json";
import data from "@/data/subjects/swd392.json";
import mmaData from "@/data/subjects/mma301.json";
import mlnData from "@/data/subjects/mln122.json";
import { subjects, subjectsBySlug } from "@/data/generated/subjects.generated";
import { adaptFeSwd392 } from "@/domain/subjects/fe-swd392-adapter";
import { adaptMln122 } from "@/domain/subjects/mln122-adapter";
import { adaptMma301 } from "@/domain/subjects/mma301-adapter";
import { subjectSchema } from "@/domain/subjects/schemas";

const duplicatePromptGroups = [[1, 2], [30, 31], [34, 35], [55, 56], [98, 99], [105, 107], [147, 148]];

describe("subject data", () => {
  it("validates the corrected canonical SWD392 dataset", () => {
    const subject = subjectSchema.parse(data);
    const ids = subject.questions.map((question) => question.id);
    const numbers = subject.questions.map((question) => question.number);
    const fiveOptionNumbers = subject.questions.filter((question) => question.options.length === 5).map((question) => question.number);

    expect(subject.contentVersion).toBe(2);
    expect(subject.questions).toHaveLength(249);
    expect(subject.questions.filter((question) => question.options.length === 4)).toHaveLength(246);
    expect(fiveOptionNumbers).toEqual([19, 39, 42]);
    expect(subject.questions.filter((question) => question.needsReview)).toHaveLength(14);
    expect(subject.questions.filter((question) => question.explanation !== null)).toHaveLength(22);
    expect(new Set(ids).size).toBe(249);
    expect(new Set(numbers).size).toBe(249);
    expect(ids).toEqual(Array.from({ length: 249 }, (_, index) => `swd392-${String(index + 1).padStart(3, "0")}`));
    expect(numbers).toEqual(Array.from({ length: 249 }, (_, index) => index + 1));
    expect(subject.questions.every((question) => question.options.some((option) => option.id === question.correctAnswer))).toBe(true);
    expect(subject.dataQuality.duplicatePromptGroups).toEqual(duplicatePromptGroups);
    expect(subject.dataQuality.answerCorrectionCount).toBe(21);
    expect(subject.dataQuality.correctedAnswerNumbers).toEqual([3, 5, 8, 14, 20, 22, 33, 38, 39, 41, 45, 51, 61, 99, 149, 153, 173, 205, 242, 243, 244]);
  });

  it("strictly adapts FE SWD392 without mutation or loss", () => {
    const before = structuredClone(feSwdData);
    const subject = adaptFeSwd392(feSwdData);
    expect(subject).toMatchObject({ id: "fe-swd392", slug: "fe-swd392", code: "FE SWD392", name: "FE SWD392", language: "en", questionCount: 263 });
    expect(subject.questions).toHaveLength(263);
    expect(subject.questions.map((question) => question.id)).toEqual(Array.from({ length: 263 }, (_, index) => `fe-swd392-${String(index + 1).padStart(3, "0")}`));
    expect(subject.questions.map((question) => question.number)).toEqual(Array.from({ length: 263 }, (_, index) => index + 1));
    expect(Object.fromEntries(["single-choice", "true-false"].map((type) => [type, subject.questions.filter((question) => question.type === type).length]))).toEqual({ "single-choice": 261, "true-false": 2 });
    expect(Object.fromEntries([2, 3, 4].map((count) => [count, subject.questions.filter((question) => question.options.length === count).length]))).toEqual({ 2: 2, 3: 2, 4: 259 });
    expect(Object.fromEntries(["A", "B", "C", "D"].map((answer) => [answer, subject.questions.filter((question) => question.correctAnswer === answer).length]))).toEqual({ A: 61, B: 75, C: 82, D: 45 });
    expect(subject.questions[0]).toMatchObject({ question: "What is inheritance?", correctAnswer: "B" });
    expect(subject.questions[262]).toMatchObject({ question: "Which of the following is NOT a case of event synchronization?", correctAnswer: "D" });
    for (const [first, second] of [[21, 162], [100, 239], [170, 180]]) expect(subject.questions[first - 1].question).toBe(subject.questions[second - 1].question);
    expect(subject.dataQuality).toMatchObject({ needsReviewCount: 8, duplicatePromptGroups: [[21, 162], [100, 239], [170, 180]] });
    for (const number of [133, 257]) expect(subject.questions[number - 1]).toMatchObject({ source: feSwdData.questions[number - 1].source, needsReview: feSwdData.questions[number - 1].needsReview, reviewNotes: feSwdData.questions[number - 1].reviewNotes });
    expect(subject.questions.every((question) => question.options.some((option) => option.id === question.correctAnswer))).toBe(true);
    expect(feSwdData).toEqual(before);
  });

  it("rejects invalid FE SWD392 metadata, IDs, options, and answers", () => {
    expect(() => adaptFeSwd392({ ...feSwdData, totalQuestions: 262 })).toThrow();
    const id = structuredClone(feSwdData); id.questions[1].id = 1;
    const blank = structuredClone(feSwdData); blank.questions[0].question = "   ";
    const duplicate = structuredClone(feSwdData); duplicate.questions[0].options[1].key = duplicate.questions[0].options[0].key;
    const missing = structuredClone(feSwdData); missing.questions[0].correctAnswer = "D"; missing.questions[0].options = missing.questions[0].options.filter((option) => option.key !== "D");
    expect(() => adaptFeSwd392(id)).toThrow(/Question 1: expected ID 2/);
    expect(() => adaptFeSwd392(blank)).toThrow();
    expect(() => adaptFeSwd392(duplicate)).toThrow(/Question 1: option keys must be unique/);
    expect(() => adaptFeSwd392(missing)).toThrow(/Question 1: correctAnswer must reference an option/);
  });

  it("adapts MMA301 without mutating raw source", () => {
    const before = structuredClone(mmaData);
    const mma = adaptMma301(mmaData);
    expect(mma).toMatchObject({ id: "mma301", slug: "mma301", code: "MMA301", questionCount: 182 });
    expect(mma.questions).toHaveLength(182);
    expect(mma.questions.some((question) => [64, 96].includes(question.number))).toBe(false);
    expect(mma.questions.find((question) => question.number === 118)).toMatchObject({ needsReview: true, correctAnswers: ["C"] });
    expect(mma.questions.find((question) => question.number === 150)?.reviewNotes).toHaveLength(1);
    expect(mma.questions.find((question) => question.number === 50)?.type).toBe("multiple-choice");
    expect(new Set(mma.questions.map((question) => question.id)).size).toBe(182);
    expect(mmaData).toEqual(before);
  });

  it("strictly adapts MLN122 without mutation or loss", () => {
    const before = structuredClone(mlnData);
    const subject = adaptMln122(mlnData);
    expect(subject).toMatchObject({ id: "mln122", slug: "mln122", code: "MLN122", name: "Kinh tế chính trị Mác - Lênin", language: "vi", questionCount: 478, description: "Bộ 478 câu hỏi Kinh tế chính trị Mác - Lênin.", source: { file: "MLN122.json", pageCount: 0 } });
    expect(subject.questions.map((question) => question.id)).toEqual(Array.from({ length: 478 }, (_, index) => `mln122-${String(index + 1).padStart(3, "0")}`));
    expect(subject.questions.map((question) => question.number)).toEqual(Array.from({ length: 478 }, (_, index) => index + 1));
    for (const index of [0, 477]) {
      expect(subject.questions[index]).toMatchObject({ question: mlnData.questions[index].question, options: mlnData.questions[index].options.map((option) => ({ id: option.key, text: option.text })), correctAnswers: [mlnData.questions[index].correctAnswer] });
    }
    expect(Object.fromEntries([3, 4, 5, 6].map((count) => [count, subject.questions.filter((question) => question.options.length === count).length]))).toEqual({ 3: 128, 4: 338, 5: 11, 6: 1 });
    expect(Object.fromEntries(["A", "B", "C", "D", "E", "F"].map((answer) => [answer, subject.questions.filter((question) => question.correctAnswer === answer).length]))).toEqual({ A: 196, B: 101, C: 94, D: 75, E: 11, F: 1 });
    expect(subject.questions[41]).toMatchObject({ correctAnswers: ["E"], options: expect.arrayContaining([{ id: "E", text: "ABC" }]) });
    expect(subject.questions[125]).toMatchObject({ correctAnswers: ["F"], options: expect.arrayContaining([{ id: "F", text: "BDE" }]) });
    expect(subject.dataQuality.duplicatePromptGroups).toEqual([[51, 307], [158, 288], [187, 296], [283, 450]]);
    expect(subject.questions.every((question) => question.type === "single-choice" && question.options.some((option) => option.id === question.correctAnswer))).toBe(true);
    expect(mlnData).toEqual(before);
    expect(subjects.map((item) => item.slug)).toEqual(["fe-swd392", "mln122", "mma301", "swd392"]);
    expect(subjectsBySlug.mln122).toEqual(subject);
    expect(subjectsBySlug["fe-swd392"]).toEqual(adaptFeSwd392(feSwdData));
    expect(subjectsBySlug["fe-swd392"].id).not.toBe(subjectsBySlug.swd392.id);
  });

  it("rejects invalid MLN122 count, blank values, duplicate keys, and missing answers", () => {
    expect(() => adaptMln122({ ...mlnData, totalQuestions: 477 })).toThrow();
    const blank = structuredClone(mlnData); blank.questions[0].question = "   ";
    const duplicate = structuredClone(mlnData); duplicate.questions[0].options[1].key = duplicate.questions[0].options[0].key;
    const missing = structuredClone(mlnData); missing.questions[0].correctAnswer = "X";
    expect(() => adaptMln122(blank)).toThrow();
    expect(() => adaptMln122(duplicate)).toThrow();
    expect(() => adaptMln122(missing)).toThrow();
  });

  it("rejects invalid versions, counts, correction metadata, and answer keys", () => {
    expect(subjectSchema.safeParse({ ...data, contentVersion: 0 }).success).toBe(false);
    expect(subjectSchema.safeParse({ ...data, contentVersion: undefined }).success).toBe(false);
    expect(subjectSchema.safeParse({ ...data, questionCount: 1 }).success).toBe(false);
    expect(subjectSchema.safeParse({ ...data, dataQuality: { ...data.dataQuality, answerCorrectionCount: 20 } }).success).toBe(false);
    const copy = structuredClone(data);
    copy.questions[0].correctAnswer = "X";
    expect(subjectSchema.safeParse(copy).success).toBe(false);
  });
});
