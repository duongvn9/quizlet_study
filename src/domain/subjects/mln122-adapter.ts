import { z } from "zod";
import { subjectSchema } from "./schemas";
import type { Subject } from "./types";

const nonblank = z.string().min(1).refine((value) => value.trim().length > 0, "Must not be blank");
const rawQuestionSchema = z.object({
  id: z.number().int().positive(),
  type: z.literal("single_choice"),
  question: nonblank,
  options: z.array(z.object({ key: nonblank, text: nonblank }).strict()).min(2).max(6),
  correctAnswer: nonblank,
  explanation: nonblank.optional()
}).strict().superRefine((question, ctx) => {
  const keys = question.options.map((option) => option.key);
  if (new Set(keys).size !== keys.length) ctx.addIssue({ code: "custom", message: "Option keys must be unique" });
  if (!keys.includes(question.correctAnswer)) ctx.addIssue({ code: "custom", message: "correctAnswer must reference an option" });
});

export const mln122RawSchema = z.object({
  schemaVersion: z.literal("1.0"),
  subject: z.object({ code: z.literal("MLN122"), name: z.string().min(1), language: z.literal("vi") }).strict(),
  totalQuestions: z.literal(478),
  questions: z.array(rawQuestionSchema).length(478)
}).strict().superRefine((raw, ctx) => {
  raw.questions.forEach((question, index) => {
    if (question.id !== index + 1) ctx.addIssue({ code: "custom", message: `Question ID at position ${index + 1} must be ${index + 1}` });
  });
});

export function adaptMln122(value: unknown): Subject {
  const raw = mln122RawSchema.parse(value);
  const questions = raw.questions.map((question) => ({
    id: `mln122-${String(question.id).padStart(3, "0")}`,
    number: question.id,
    type: "single-choice" as const,
    question: question.question,
    options: question.options.map((option) => ({ id: option.key, text: option.text })),
    correctAnswers: [question.correctAnswer],
    explanation: question.explanation ?? null,
    source: { file: "MLN122.json", pages: [] },
    needsReview: false,
    reviewNotes: []
  }));
  return subjectSchema.parse({
    schemaVersion: 1,
    contentVersion: 1,
    id: "mln122",
    slug: "mln122",
    code: raw.subject.code,
    name: raw.subject.name,
    description: `Bộ ${questions.length} câu hỏi ${raw.subject.name}.`,
    language: raw.subject.language,
    questionCount: questions.length,
    source: { file: "MLN122.json", pageCount: 0, note: "Nguồn không cung cấp metadata trang." },
    dataQuality: { needsReviewCount: 0, duplicatePromptGroups: [[51, 307], [158, 288], [187, 296], [283, 450]] },
    questions
  });
}
