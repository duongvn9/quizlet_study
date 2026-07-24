import { z } from "zod";
import { subjectSchema } from "./schemas";
import type { Subject } from "./types";

const nonblank = z.string().min(1).refine((value) => value.trim().length > 0, "Must not be blank");
const rawQuestionSchema = z.object({
  id: z.number().int().min(1).max(263),
  type: z.enum(["single_choice", "true_false"]),
  question: nonblank,
  options: z.array(z.object({ key: nonblank, text: nonblank }).strict()).min(2).max(4),
  correctAnswer: z.enum(["A", "B", "C", "D"]),
  source: z.object({ file: z.literal("FE_SWD.pdf"), pages: z.array(z.number().int().positive()).min(1) }).strict(),
  needsReview: z.boolean(),
  reviewNotes: z.array(z.string())
}).strict().superRefine((question, ctx) => {
  const keys = question.options.map((option) => option.key);
  if (new Set(keys).size !== keys.length) ctx.addIssue({ code: "custom", message: `Question ${question.id}: option keys must be unique` });
  if (!keys.includes(question.correctAnswer)) ctx.addIssue({ code: "custom", message: `Question ${question.id}: correctAnswer must reference an option` });
});

export const feSwd392RawSchema = z.object({
  schemaVersion: z.literal("1.0"),
  subject: z.object({
    id: z.literal("fe-swd"),
    slug: z.literal("fe-swd"),
    code: z.literal("FE_SWD"),
    name: z.literal("SWD392 - Final Exam"),
    language: z.literal("en")
  }).strict(),
  description: nonblank,
  totalQuestions: z.literal(263),
  questions: z.array(rawQuestionSchema).length(263)
}).strict().superRefine((raw, ctx) => {
  raw.questions.forEach((question, index) => {
    const expectedId = index + 1;
    if (question.id !== expectedId) ctx.addIssue({ code: "custom", message: `Question ${question.id}: expected ID ${expectedId} at position ${expectedId}` });
  });
});

export function adaptFeSwd392(value: unknown): Subject {
  const raw = feSwd392RawSchema.parse(value);
  const questions = raw.questions.map((question) => ({
    id: `fe-swd392-${String(question.id).padStart(3, "0")}`,
    number: question.id,
    type: question.type === "single_choice" ? "single-choice" as const : "true-false" as const,
    question: question.question,
    options: question.options.map((option) => ({ id: option.key, text: option.text })),
    correctAnswers: [question.correctAnswer],
    explanation: null,
    source: question.source,
    needsReview: question.needsReview,
    reviewNotes: question.reviewNotes
  }));

  return subjectSchema.parse({
    schemaVersion: 1,
    contentVersion: 1,
    id: "fe-swd392",
    slug: "fe-swd392",
    code: "FE SWD392",
    name: "FE SWD392",
    description: "Bộ 263 câu hỏi ôn tập Final Exam môn Software Architecture and Design.",
    language: raw.subject.language,
    questionCount: questions.length,
    source: { file: "FE_SWD.pdf", pageCount: Math.max(...questions.flatMap((question) => question.source.pages)), note: raw.description },
    dataQuality: { needsReviewCount: questions.filter((question) => question.needsReview).length, duplicatePromptGroups: [[21, 162], [100, 239], [170, 180]] },
    questions
  });
}
