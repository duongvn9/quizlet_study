import { z } from "zod";
import { subjectSchema } from "./schemas";
import type { Subject } from "./types";

const rawQuestionSchema = z.object({
  id: z.string().min(1), number: z.number().int().positive(), type: z.enum(["single_choice", "multiple_choice", "true_false"]), status: z.enum(["active", "deleted_or_empty"]), question: z.string(),
  options: z.array(z.object({ key: z.string().min(1), text: z.string().min(1) })), correctAnswers: z.array(z.string().min(1)), explanation: z.string(), sourcePages: z.array(z.number().int().positive()), sourceWarnings: z.array(z.string()).optional()
}).passthrough();
export const mma301RawSchema = z.object({
  schemaVersion: z.literal("1.0"),
  subject: z.object({ code: z.literal("MMA301"), title: z.string(), topic: z.string(), language: z.string() }),
  source: z.object({ file: z.string(), pages: z.number().int().positive(), preserveSourceAnswers: z.literal(false), note: z.string() }).passthrough(),
  statistics: z.object({ totalEntries: z.literal(184), activeQuestions: z.literal(182), deletedOrEmptyEntries: z.literal(2), singleChoice: z.literal(91), multipleChoice: z.literal(61), trueFalse: z.literal(30), entriesWithWarnings: z.number(), correctedAnswerEntries: z.literal(9), repairedContentEntries: z.literal(11) }),
  extractionWarnings: z.array(z.object({ number: z.number().int().positive(), warnings: z.array(z.string().min(1)).min(1) })),
  questions: z.array(rawQuestionSchema),
  review: z.object({ reviewedOn: z.string().min(1), correctedAnswerQuestions: z.array(z.number().int().positive()), repairedOptionOrQuestionQuestions: z.array(z.number().int().positive()), unresolvedWarningQuestions: z.array(z.number().int().positive()), correctionLog: z.array(z.unknown()) }).passthrough()
});

export function adaptMma301(value: unknown): Subject {
  const raw = mma301RawSchema.parse(value);
  const questions = raw.questions.filter((question) => question.status === "active").map((question) => ({
    id: question.id.toLowerCase(),
    number: question.number,
    type: question.type.replaceAll("_", "-") as "single-choice" | "multiple-choice" | "true-false",
    question: question.question,
    options: question.options.map((option) => ({ id: option.key, text: option.text })),
    correctAnswers: question.correctAnswers,
    explanation: question.explanation.trim() ? question.explanation : null,
    source: { file: raw.source.file, pages: question.sourcePages },
    needsReview: !!question.sourceWarnings?.length,
    reviewNotes: question.sourceWarnings ?? []
  }));
  return subjectSchema.parse({
    schemaVersion: 1,
    contentVersion: 2,
    id: "mma301",
    slug: "mma301",
    code: raw.subject.code,
    name: "Mobile Application Development",
    description: `Bộ ${questions.length} câu hỏi ${raw.subject.topic}.`,
    language: raw.subject.language,
    questionCount: questions.length,
    source: { file: raw.source.file, pageCount: raw.source.pages, note: raw.source.note },
    dataQuality: { needsReviewCount: questions.filter((question) => question.needsReview).length, duplicatePromptGroups: [], reviewBasis: "Source warnings are preserved without changing source answers." },
    questions
  });
}
