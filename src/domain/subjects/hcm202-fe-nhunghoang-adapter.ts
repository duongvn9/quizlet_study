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
  if (question.correctAnswers.some((answer) => !keys.has(answer))) ctx.addIssue({ code: "custom", path: ["correctAnswers"], message: "correctAnswers must reference options" });
  if (question.type === "single_choice" && question.correctAnswers.length !== 1) ctx.addIssue({ code: "custom", path: ["correctAnswers"], message: "Single-choice questions require exactly one answer" });
});

const rawSchema = z.object({
  schemaVersion: z.literal("1.0"),
  subject: z.object({ code: z.literal("HCM202"), title: z.string().min(1), assessment: z.literal("Final Exam"), collection: z.literal("Nhung Hoang"), language: z.literal("vi") }).passthrough(),
  source: z.object({ files: z.array(z.string().min(1)).min(1), parts: z.number().int().positive(), preserveSourceAnswers: z.literal(true), ignoredEmptyQuestionPlaceholders: z.literal(13), note: z.string() }).passthrough(),
  statistics: z.record(z.string(), z.unknown()),
  dataQuality: z.object({ duplicatePromptGroups: z.array(z.array(z.number().int().positive()).min(2)).optional(), reviewBasis: z.string().optional() }).passthrough(),
  extractionWarnings: z.array(z.record(z.string(), z.unknown())).optional(),
  questions: z.array(rawQuestionSchema)
}).passthrough();

export const hcm202FeNhunghoangRawSchema = z.preprocess((value) => {
  if (!value || typeof value !== "object" || !("questions" in value) || !Array.isArray(value.questions)) return value;
  return { ...value, questions: value.questions.filter((question) => question && typeof question === "object" && "status" in question && question.status === "active") };
}, rawSchema);

export function adaptHcm202FeNhunghoang(value: unknown): Subject {
  const raw = hcm202FeNhunghoangRawSchema.parse(value);
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
  const activeNumbers = new Set(questions.map((question) => question.number));
  const duplicatePromptGroups = (raw.dataQuality.duplicatePromptGroups ?? []).filter((group) => group.every((number) => activeNumbers.has(number)));

  return subjectSchema.parse({
    schemaVersion: 1,
    contentVersion: 1,
    id: "hcm202-fe-nhunghoang",
    slug: "hcm202-fe-nhunghoang",
    code: "HCM202",
    name: "HCM202 - Tư tưởng Hồ Chí Minh - Final Exam - Nhung Hoang",
    description: `Bộ ${questions.length} câu hỏi Final Exam môn Tư tưởng Hồ Chí Minh - Nhung Hoang.`,
    assessment: "Final Exam",
    language: "vi",
    questionCount: questions.length,
    source: { ...raw.source, file: raw.source.files.join(", "), pageCount: 0, note: raw.source.note, collection: raw.subject.collection },
    dataQuality: {
      needsReviewCount: questions.filter((question) => question.needsReview).length,
      duplicatePromptGroups,
      ...(raw.dataQuality.reviewBasis === undefined ? {} : { reviewBasis: raw.dataQuality.reviewBasis })
    },
    questions
  });
}
