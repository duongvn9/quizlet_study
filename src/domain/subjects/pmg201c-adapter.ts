import { z } from "zod";
import { subjectSchema } from "./schemas";
import type { Subject } from "./types";

const typeMap = { single_choice: "single-choice", multiple_choice: "multiple-choice", true_false: "true-false" } as const;
const expectedOptionDistribution = { 2: 109, 3: 6, 4: 194, 5: 16, 6: 8 } as const;

const rawQuestionSchema = z.object({
  id: z.string().min(1),
  number: z.number().int().positive(),
  type: z.enum(["single_choice", "multiple_choice", "true_false"]),
  status: z.literal("active"),
  question: z.string().min(1),
  options: z.array(z.object({ key: z.string().min(1), text: z.string().min(1) })).min(2),
  correctAnswers: z.array(z.string().min(1)).min(1),
  answerTextFromSource: z.string(),
  explanation: z.string(),
  sourcePages: z.array(z.number().int().positive()).min(1),
  needsReview: z.boolean(),
  reviewNotes: z.array(z.string()),
  source: z.object({
    file: z.string().min(1),
    part: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    sourceQuestionNumber: z.number().int().positive(),
    pages: z.array(z.number().int().positive()).min(1),
    basis: z.string().min(1)
  })
}).passthrough();

export const pmg201cRawSchema = z.object({
  schemaVersion: z.literal("1.0"),
  subject: z.object({ code: z.literal("PMG201c"), title: z.string().min(1), topic: z.string().min(1), language: z.literal("en") }),
  source: z.object({
    files: z.array(z.string().min(1)).length(3),
    parts: z.literal(3),
    pages: z.literal(83),
    partPageCounts: z.object({ part1: z.literal(29), part2: z.literal(30), part3: z.literal(24) }),
    preserveSourceAnswers: z.literal(true),
    note: z.string().min(1)
  }),
  statistics: z.object({
    totalEntries: z.literal(333),
    activeQuestions: z.literal(333),
    singleChoice: z.literal(222),
    multipleChoice: z.literal(4),
    trueFalse: z.literal(107),
    entriesWithWarnings: z.literal(146),
    duplicatePromptGroups: z.literal(66),
    conflictingDuplicateGroups: z.literal(9),
    optionCountDistribution: z.record(z.string(), z.number().int().nonnegative())
  }),
  dataQuality: z.object({
    needsReviewCount: z.literal(146),
    duplicatePromptGroups: z.array(z.array(z.number().int().positive()).min(2)).length(66),
    conflictingDuplicatePromptGroups: z.array(z.array(z.number().int().positive()).min(2)).length(9),
    reviewBasis: z.string().min(1)
  }),
  extractionWarnings: z.array(z.record(z.string(), z.unknown())),
  questions: z.array(rawQuestionSchema).length(333)
}).superRefine((raw, ctx) => {
  const numbers = new Set<number>();
  const ids = new Set<string>();
  const optionDistribution = Object.fromEntries(Object.keys(expectedOptionDistribution).map((count) => [count, 0])) as Record<string, number>;
  const typeCounts = { single_choice: 0, multiple_choice: 0, true_false: 0 };
  const partNumbers = { 1: new Set<number>(), 2: new Set<number>(), 3: new Set<number>() };

  raw.questions.forEach((question, index) => {
    const expectedNumber = index + 1;
    const expectedId = `PMG201c-${String(expectedNumber).padStart(3, "0")}`;
    if (question.number !== expectedNumber) ctx.addIssue({ code: "custom", path: ["questions", index, "number"], message: `Question ${expectedNumber}: expected number ${expectedNumber}` });
    if (question.id !== expectedId) ctx.addIssue({ code: "custom", path: ["questions", index, "id"], message: `Question ${expectedNumber}: expected ID ${expectedId}` });
    if (numbers.has(question.number)) ctx.addIssue({ code: "custom", path: ["questions", index, "number"], message: `Question ${question.number}: duplicate question number` });
    if (ids.has(question.id)) ctx.addIssue({ code: "custom", path: ["questions", index, "id"], message: `Question ${question.number}: duplicate question ID` });
    numbers.add(question.number);
    ids.add(question.id);
    typeCounts[question.type]++;
    optionDistribution[String(question.options.length)] = (optionDistribution[String(question.options.length)] ?? 0) + 1;

    const optionKeys = new Set(question.options.map((option) => option.key));
    if (optionKeys.size !== question.options.length) ctx.addIssue({ code: "custom", path: ["questions", index, "options"], message: `Question ${question.number}: option keys must be unique` });
    if (new Set(question.correctAnswers).size !== question.correctAnswers.length) ctx.addIssue({ code: "custom", path: ["questions", index, "correctAnswers"], message: `Question ${question.number}: correctAnswers must be unique` });
    if (question.correctAnswers.some((answer) => !optionKeys.has(answer))) ctx.addIssue({ code: "custom", path: ["questions", index, "correctAnswers"], message: `Question ${question.number}: correctAnswers must reference options` });
    if (question.type !== "multiple_choice" && question.correctAnswers.length !== 1) ctx.addIssue({ code: "custom", path: ["questions", index, "correctAnswers"], message: `Question ${question.number}: single-choice and true-false questions require exactly one answer` });
    if (question.type === "multiple_choice" && question.correctAnswers.length < 2) ctx.addIssue({ code: "custom", path: ["questions", index, "correctAnswers"], message: `Question ${question.number}: multiple-choice questions require at least two answers` });
    partNumbers[question.source.part].add(question.source.sourceQuestionNumber);
  });

  if (JSON.stringify(typeCounts) !== JSON.stringify({ single_choice: 222, multiple_choice: 4, true_false: 107 })) ctx.addIssue({ code: "custom", path: ["questions"], message: "PMG201c type distribution mismatch" });
  if (JSON.stringify(optionDistribution) !== JSON.stringify(expectedOptionDistribution)) ctx.addIssue({ code: "custom", path: ["statistics", "optionCountDistribution"], message: "PMG201c option distribution mismatch" });
  if (JSON.stringify(raw.statistics.optionCountDistribution) !== JSON.stringify(expectedOptionDistribution)) ctx.addIssue({ code: "custom", path: ["statistics", "optionCountDistribution"], message: "PMG201c declared option distribution mismatch" });

  for (const [number, answers] of [[90, ["C", "D"]], [93, ["A", "B"]], [220, ["A", "B"]]] as const) {
    const question = raw.questions[number - 1];
    if (JSON.stringify(question?.correctAnswers) !== JSON.stringify(answers)) ctx.addIssue({ code: "custom", path: ["questions", number - 1, "correctAnswers"], message: `Question ${number}: correct answers must be ${answers.join(", ")}` });
  }

  for (const [part, total] of [[1, 110], [2, 111], [3, 112]] as const) {
    const expected = Array.from({ length: total }, (_, index) => index + 1);
    if (JSON.stringify([...partNumbers[part]].sort((a, b) => a - b)) !== JSON.stringify(expected)) ctx.addIssue({ code: "custom", path: ["questions"], message: `Part ${part} source question numbers must cover 1-${total}` });
  }

  const normalize = (text: string) => text.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/g, " ").trim();
  const promptGroups = new Map<string, typeof raw.questions>();
  for (const question of raw.questions) {
    const key = normalize(question.question);
    promptGroups.set(key, [...(promptGroups.get(key) ?? []), question]);
  }
  const duplicateGroups = [...promptGroups.values()].filter((group) => group.length > 1).map((group) => group.map((question) => question.number));
  const conflictingGroups = [...promptGroups.values()].filter((group) => group.length > 1 && new Set(group.map((question) => question.correctAnswers.map((answer) => normalize(question.options.find((option) => option.key === answer)?.text ?? question.answerTextFromSource)).sort().join("|"))).size > 1).map((group) => group.map((question) => question.number));
  if (JSON.stringify(raw.dataQuality.duplicatePromptGroups) !== JSON.stringify(duplicateGroups)) ctx.addIssue({ code: "custom", path: ["dataQuality", "duplicatePromptGroups"], message: "PMG201c duplicate groups mismatch" });
  if (JSON.stringify(raw.dataQuality.conflictingDuplicatePromptGroups) !== JSON.stringify(conflictingGroups)) ctx.addIssue({ code: "custom", path: ["dataQuality", "conflictingDuplicatePromptGroups"], message: "PMG201c conflicting duplicate groups mismatch" });
  if (raw.questions.filter((question) => question.needsReview).length !== raw.dataQuality.needsReviewCount || raw.questions.some((question) => question.needsReview !== (question.reviewNotes.length > 0))) ctx.addIssue({ code: "custom", path: ["dataQuality", "needsReviewCount"], message: "PMG201c review metadata mismatch" });
});

export function adaptPmg201c(value: unknown): Subject {
  const raw = pmg201cRawSchema.parse(value);
  const questions = raw.questions.map((question) => ({
    id: question.id.toLowerCase(),
    number: question.number,
    type: typeMap[question.type],
    question: question.question,
    options: question.options.map((option) => ({ id: option.key, text: option.text })),
    correctAnswers: question.correctAnswers,
    explanation: question.explanation.trim() ? question.explanation : null,
    source: { file: question.source.file, pages: question.source.pages, basis: `Part ${question.source.part}, source question ${question.source.sourceQuestionNumber}; ${question.source.basis}` },
    needsReview: question.needsReview,
    reviewNotes: question.reviewNotes
  }));

  return subjectSchema.parse({
    schemaVersion: 1,
    contentVersion: 1,
    id: "pmg201c",
    slug: "pmg201c",
    code: raw.subject.code,
    name: raw.subject.title,
    description: `Bộ ${questions.length} câu hỏi ${raw.subject.topic}.`,
    language: raw.subject.language,
    questionCount: questions.length,
    source: { file: raw.source.files.join(", "), pageCount: raw.source.pages, note: raw.source.note },
    dataQuality: {
      needsReviewCount: raw.dataQuality.needsReviewCount,
      duplicatePromptGroups: raw.dataQuality.duplicatePromptGroups,
      reviewBasis: `${raw.dataQuality.reviewBasis} Conflicting duplicate groups: ${raw.dataQuality.conflictingDuplicatePromptGroups.length}.`
    },
    questions
  });
}
