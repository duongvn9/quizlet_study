import { z } from "zod";
import { subjectSchema } from "./schemas";
import type { Subject } from "./types";

// Shared raw format of the PDF-extracted banks (schemaVersion "1.0" with subject/source/statistics/questions).
const typeMap = { single_choice: "single-choice", multiple_choice: "multiple-choice" } as const;
const pagesSchema = z.array(z.number().int().positive());

const rawQuestionSchema = z.object({
  id: z.string().min(1), number: z.number().int().positive(), type: z.enum(["single_choice", "multiple_choice"]), question: z.string().min(1),
  options: z.array(z.object({ key: z.string().min(1), text: z.string().min(1) }).passthrough()).min(2),
  correctAnswers: z.array(z.string().min(1)), answerTextFromSource: z.string(), explanation: z.string(), sourcePages: pagesSchema,
  sourceNotes: z.union([z.string(), z.array(z.string())]).optional(), needsReview: z.boolean(), reviewNotes: z.array(z.string()),
  source: z.object({ file: z.string().min(1), pages: pagesSchema.optional() }).passthrough()
}).passthrough().superRefine((question, ctx) => {
  if (question.correctAnswers.length === 0 && !question.needsReview) ctx.addIssue({ code: "custom", path: ["correctAnswers"], message: `Question ${question.number}: only needsReview questions may have no answer` });
});

const rawSchema = z.object({
  schemaVersion: z.literal("1.0"),
  subject: z.object({ code: z.string().min(1), title: z.string().min(1), assessment: z.string().min(1), language: z.string().min(1), collection: z.string().optional() }).passthrough(),
  source: z.object({ file: z.string().min(1).optional(), files: z.array(z.string().min(1)).min(1).optional(), pages: z.number().int().nonnegative().optional(), note: z.string() }).passthrough(),
  dataQuality: z.object({ duplicatePromptGroups: z.array(z.array(z.number().int().positive()).min(2)).optional(), exactDuplicateGroups: z.array(z.array(z.number().int().positive()).min(2)).optional(), reviewBasis: z.string().optional() }).passthrough(),
  questions: z.array(rawQuestionSchema)
}).passthrough();

export const extractedBankRawSchema = z.preprocess((value) => {
  if (!value || typeof value !== "object" || !("questions" in value) || !Array.isArray(value.questions)) return value;
  return { ...value, questions: value.questions.filter((question) => question && typeof question === "object" && "status" in question && question.status === "active") };
}, rawSchema);

export type ExtractedBankMeta = { id: string; name: string; description: (questionCount: number) => string; contentVersion?: number };

export function adaptExtractedBank(value: unknown, meta: ExtractedBankMeta): Subject {
  const raw = extractedBankRawSchema.parse(value);
  // Questions without an answer stay in the source as review-only and are not gradable.
  const gradable = raw.questions.filter((question) => question.correctAnswers.length > 0);
  const reviewOnlyQuestionNumbers = raw.questions.filter((question) => question.correctAnswers.length === 0).map((question) => question.number);
  const questions = gradable.map((question) => ({
    id: question.id, number: question.number, type: typeMap[question.type], question: question.question,
    // A repeated source key (e.g. two "B" options) gets a unique id and keeps the original label.
    options: question.options.map(({ key, ...option }, index, all) => all.slice(0, index).some((item) => item.key === key) ? { ...option, id: `${key}-${index + 1}`, sourceLabel: key } : { id: key, ...option }),
    correctAnswers: question.correctAnswers, explanation: question.explanation.trim() ? question.explanation : null,
    source: { ...question.source, pages: question.source.pages ?? question.sourcePages }, sourcePages: question.sourcePages,
    answerTextFromSource: question.answerTextFromSource, ...(question.sourceNotes === undefined ? {} : { sourceNotes: question.sourceNotes }),
    needsReview: question.needsReview, reviewNotes: question.reviewNotes
  }));
  const numbers = new Set(questions.map((question) => question.number));
  const duplicateGroups = raw.dataQuality.duplicatePromptGroups ?? raw.dataQuality.exactDuplicateGroups ?? [];
  return subjectSchema.parse({
    schemaVersion: 1, contentVersion: meta.contentVersion ?? 1, id: meta.id, slug: meta.id, code: raw.subject.code, name: meta.name,
    description: meta.description(questions.length), assessment: raw.subject.assessment, language: raw.subject.language, questionCount: questions.length,
    source: {
      ...raw.source, file: raw.source.files?.join(", ") ?? raw.source.file ?? "", pageCount: raw.source.pages ?? 0,
      ...(raw.subject.collection === undefined ? {} : { collection: raw.subject.collection }), totalEntries: raw.questions.length,
      ...(reviewOnlyQuestionNumbers.length ? { reviewOnlyQuestionNumbers } : {})
    },
    dataQuality: {
      needsReviewCount: questions.filter((question) => question.needsReview).length,
      duplicatePromptGroups: duplicateGroups.filter((group) => group.every((number) => numbers.has(number))),
      ...(raw.dataQuality.reviewBasis === undefined ? {} : { reviewBasis: raw.dataQuality.reviewBasis })
    },
    questions
  });
}
