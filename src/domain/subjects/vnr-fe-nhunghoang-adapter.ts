import { z } from "zod";
import { subjectSchema } from "./schemas";
import type { Subject } from "./types";

const typeMap = { single_choice: "single-choice", multiple_choice: "multiple-choice" } as const;
const sourceNotesSchema = z.union([z.string(), z.array(z.string())]);

const rawQuestionSchema = z.object({
  id: z.string().min(1),
  number: z.number().int().positive(),
  type: z.enum(["single_choice", "multiple_choice"]),
  status: z.literal("active"),
  question: z.string().min(1),
  options: z.array(z.object({ key: z.string().min(1), text: z.string().min(1), sourceLabel: z.string().optional() }).passthrough()).min(2),
  correctAnswers: z.array(z.string().min(1)).min(1),
  answerTextFromSource: z.string(),
  explanation: z.string(),
  sourcePages: z.array(z.number().int().positive()),
  sourceNotes: sourceNotesSchema.optional(),
  needsReview: z.boolean(),
  reviewNotes: z.array(z.string()),
  source: z.object({
    file: z.string().min(1),
    sourceQuestionNumber: z.number().int().positive(),
    lines: z.array(z.number().int().positive()),
    basis: z.string().min(1).optional()
  }).passthrough()
}).passthrough().superRefine((question, ctx) => {
  const keys = new Set(question.options.map((option) => option.key));
  if (keys.size !== question.options.length) ctx.addIssue({ code: "custom", path: ["options"], message: "Option keys must be unique" });
  if (new Set(question.correctAnswers).size !== question.correctAnswers.length) ctx.addIssue({ code: "custom", path: ["correctAnswers"], message: "correctAnswers must be unique" });
  if (question.correctAnswers.some((answer) => !keys.has(answer))) ctx.addIssue({ code: "custom", path: ["correctAnswers"], message: "correctAnswers must reference canonical option keys" });
  if (question.type === "single_choice" && question.correctAnswers.length !== 1) ctx.addIssue({ code: "custom", path: ["correctAnswers"], message: "Single-choice questions require exactly one answer" });
  if (question.type === "multiple_choice" && question.correctAnswers.length < 2) ctx.addIssue({ code: "custom", path: ["correctAnswers"], message: "Multiple-choice questions require at least two answers" });
});

const rawSchema = z.object({
  schemaVersion: z.literal("1.0"),
  subject: z.object({ code: z.literal("VNR"), title: z.string().min(1), assessment: z.literal("Final Exam"), collection: z.literal("Nhung Hoang"), language: z.literal("vi") }).passthrough(),
  source: z.object({ files: z.array(z.string().min(1)).min(1), parts: z.number().int().positive(), preserveSourceAnswers: z.literal(true), ignoredEmptyQuestionPlaceholders: z.literal(13), note: z.string() }).passthrough(),
  statistics: z.record(z.string(), z.unknown()),
  dataQuality: z.object({ duplicatePromptGroups: z.array(z.array(z.number().int().positive()).min(2)).optional(), reviewBasis: z.string().optional() }).passthrough(),
  extractionWarnings: z.array(z.unknown()).optional(),
  questions: z.array(rawQuestionSchema)
}).passthrough().superRefine((raw, ctx) => {
  if (!raw.questions.every((question, index) => question.number === index + 1 && question.id === `VNR-FE-NHUNGHOANG-${String(index + 1).padStart(3, "0")}`)) ctx.addIssue({ code: "custom", path: ["questions"], message: "Question numbers and IDs must follow source order" });
});

export const vnrFeNhunghoangRawSchema = rawSchema;

export function adaptVnrFeNhunghoang(value: unknown): Subject {
  const raw = vnrFeNhunghoangRawSchema.parse(value);
  const questions = raw.questions.map((question) => ({
    id: question.id,
    number: question.number,
    type: typeMap[question.type],
    question: question.question,
    options: question.options.map((option) => ({ id: option.key, text: option.text, ...(option.sourceLabel === undefined ? {} : { sourceLabel: option.sourceLabel }) })),
    correctAnswers: question.correctAnswers,
    explanation: question.explanation.trim() ? question.explanation : null,
    source: { ...question.source, pages: question.sourcePages },
    sourcePages: question.sourcePages,
    answerTextFromSource: question.answerTextFromSource,
    ...(question.sourceNotes === undefined ? {} : { sourceNotes: question.sourceNotes }),
    needsReview: question.needsReview,
    reviewNotes: question.reviewNotes
  }));

  return subjectSchema.parse({
    schemaVersion: 1,
    contentVersion: 1,
    id: "vnr-fe-nhunghoang",
    slug: "vnr-fe-nhunghoang",
    code: "VNR",
    name: "VNR - Final Exam - Nhung Hoang",
    description: `Bộ ${questions.length} câu hỏi có đáp án Final Exam môn VNR - Nhung Hoang.`,
    assessment: "Final Exam",
    language: "vi",
    questionCount: questions.length,
    source: { ...raw.source, file: raw.source.files.join(", "), pageCount: 0, note: raw.source.note, collection: raw.subject.collection, totalEntries: raw.questions.length },
    dataQuality: {
      needsReviewCount: questions.filter((question) => question.needsReview).length,
      duplicatePromptGroups: raw.dataQuality.duplicatePromptGroups ?? [],
      ...(raw.dataQuality.reviewBasis === undefined ? {} : { reviewBasis: raw.dataQuality.reviewBasis })
    },
    questions
  });
}
