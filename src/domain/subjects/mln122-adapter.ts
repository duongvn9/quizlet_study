import { z } from "zod";
import { subjectSchema } from "./schemas";
import type { Subject } from "./types";

const nonblank = z.string().min(1).refine((value) => value.trim().length > 0, "Must not be blank");
const rawQuestionSchema = z.object({
  id: z.number().int().positive(),
  type: z.literal("single_choice"),
  question: nonblank,
  options: z.array(z.object({ key: nonblank, text: nonblank }).strict()).min(2).max(6),
  correctAnswer: nonblank.nullable(),
  explanation: nonblank.optional(),
  source: z.object({ file: nonblank.optional(), questionBank: nonblank.optional(), textbook: nonblank.optional(), pages: z.array(z.number().int().positive()).optional(), pdfPages: z.array(z.number().int().positive()).optional(), basis: nonblank.optional() }).strict().optional(),
  verificationStatus: nonblank.optional(),
  needsReview: z.boolean().optional(),
  reviewNotes: z.array(z.string()).optional(),
  auditNotes: z.array(z.string()).optional(),
  disabled: z.boolean().optional(),
  legacyCorrectAnswer: nonblank.optional()
}).strict().superRefine((question, ctx) => {
  const keys = question.options.map((option) => option.key);
  if (new Set(keys).size !== keys.length) ctx.addIssue({ code: "custom", message: "Option keys must be unique" });
  if (question.disabled === true && question.correctAnswer !== null) ctx.addIssue({ code: "custom", message: "Disabled questions must have null correctAnswer" });
  if (question.disabled !== true && question.correctAnswer === null) ctx.addIssue({ code: "custom", message: "Enabled questions must have a correctAnswer" });
  if (question.correctAnswer !== null && !keys.includes(question.correctAnswer)) ctx.addIssue({ code: "custom", message: "correctAnswer must reference an option" });
  if (question.disabled === true && (!question.legacyCorrectAnswer || !keys.includes(question.legacyCorrectAnswer))) ctx.addIssue({ code: "custom", message: "Disabled questions require legacyCorrectAnswer referencing an option" });
  if (question.disabled === true && !question.reviewNotes?.some((note) => note.trim().length > 0)) ctx.addIssue({ code: "custom", message: "Disabled questions require a nonblank review reason" });
});

export const mln122RawSchema = z.object({
  schemaVersion: z.union([z.literal("1.0"), z.literal("1.1-final")]),
  subject: z.object({ code: z.literal("MLN122"), name: z.string().min(1), language: z.literal("vi") }).strict(),
  totalQuestions: z.literal(478),
  questions: z.array(rawQuestionSchema).length(478),
  source: z.object({ questionBank: nonblank.optional(), textbook: nonblank.optional(), reviewReport: nonblank.optional(), note: nonblank.optional() }).strict().optional(),
  dataQuality: z.object({ questionCount: z.literal(478).optional(), activeQuestionCount: z.number().int().nonnegative().optional(), disabledQuestionCount: z.number().int().nonnegative().optional(), disabledQuestionIds: z.array(z.number().int().positive()).optional(), reviewReportIssueCount: z.number().int().nonnegative().optional(), reviewReportIssueIds: z.array(z.number().int().positive()).optional(), answerChangedFromOriginalCount: z.number().int().nonnegative().optional(), answerChangedFromOriginalIds: z.array(z.number().int().positive()).optional(), questionTextChangedFromOriginalCount: z.number().int().nonnegative().optional(), questionTextChangedFromOriginalIds: z.array(z.number().int().positive()).optional(), optionsChangedFromOriginalCount: z.number().int().nonnegative().optional(), optionsChangedFromOriginalIds: z.array(z.number().int().positive()).optional(), needsReviewCount: z.number().int().nonnegative().optional(), needsReviewIds: z.array(z.number().int().positive()).optional(), reviewBasis: nonblank.optional(), finalizationNote: nonblank.optional() }).strict().optional()
}).strict().superRefine((raw, ctx) => {
  raw.questions.forEach((question, index) => {
    if (question.id !== index + 1) ctx.addIssue({ code: "custom", message: `Question ID at position ${index + 1} must be ${index + 1}` });
    if (raw.schemaVersion === "1.1-final" && (!question.source || question.verificationStatus === undefined || question.needsReview === undefined || question.reviewNotes === undefined)) ctx.addIssue({ code: "custom", message: `Question ${question.id} lacks final audit metadata` });
  });
  if (raw.schemaVersion === "1.1-final" && (!raw.source || !raw.dataQuality)) ctx.addIssue({ code: "custom", message: "Final datasets require source and dataQuality metadata" });
  const disabledIds = raw.questions.filter((question) => question.disabled === true).map((question) => question.id);
  const reviewIds = raw.questions.filter((question) => question.needsReview === true).map((question) => question.id);
  const quality = raw.dataQuality;
  if (quality?.questionCount !== undefined && quality.questionCount !== raw.questions.length) ctx.addIssue({ code: "custom", message: "questionCount mismatch" });
  if (quality?.activeQuestionCount !== undefined && quality.activeQuestionCount !== raw.questions.length - disabledIds.length) ctx.addIssue({ code: "custom", message: "activeQuestionCount mismatch" });
  const manifests = [
    ["disabledQuestion", quality?.disabledQuestionCount, quality?.disabledQuestionIds, disabledIds],
    ["reviewReportIssue", quality?.reviewReportIssueCount, quality?.reviewReportIssueIds],
    ["answerChangedFromOriginal", quality?.answerChangedFromOriginalCount, quality?.answerChangedFromOriginalIds],
    ["questionTextChangedFromOriginal", quality?.questionTextChangedFromOriginalCount, quality?.questionTextChangedFromOriginalIds],
    ["optionsChangedFromOriginal", quality?.optionsChangedFromOriginalCount, quality?.optionsChangedFromOriginalIds],
    ["needsReview", quality?.needsReviewCount, quality?.needsReviewIds, reviewIds]
  ] as const;
  for (const [name, count, ids, actual] of manifests) {
    if (count !== undefined && (!ids || ids.length !== count)) ctx.addIssue({ code: "custom", message: `${name}Count mismatch` });
    if (ids && (new Set(ids).size !== ids.length || ids.some((id) => id > raw.questions.length))) ctx.addIssue({ code: "custom", message: `${name}Ids must be unique and in range` });
    if (ids && actual && (ids.length !== actual.length || ids.some((id, index) => id !== actual[index]))) ctx.addIssue({ code: "custom", message: `${name}Ids mismatch` });
  }
});

export function adaptMln122(value: unknown): Subject {
  const raw = mln122RawSchema.parse(value);
  const questions = raw.questions.filter((question) => question.disabled !== true).map((question) => ({
    id: `mln122-${String(question.id).padStart(3, "0")}`,
    number: question.id,
    type: "single-choice" as const,
    question: question.question,
    options: question.options.map((option) => ({ id: option.key, text: option.text })),
    correctAnswers: [question.correctAnswer!],
    explanation: question.explanation ?? null,
    source: { file: question.source?.file ?? raw.source?.questionBank ?? "mln122.json", pages: question.source?.pages ?? [], pdfPages: question.source?.pdfPages, basis: question.source?.basis, questionBank: question.source?.questionBank, textbook: question.source?.textbook },
    needsReview: question.needsReview ?? false,
    reviewNotes: question.reviewNotes ?? [],
    verificationStatus: question.verificationStatus,
    auditNotes: question.auditNotes,
    legacyCorrectAnswer: question.legacyCorrectAnswer
  }));
  return subjectSchema.parse({
    schemaVersion: 1,
    contentVersion: raw.schemaVersion === "1.1-final" ? 2 : 1,
    id: "mln122",
    slug: "mln122",
    code: raw.subject.code,
    name: raw.subject.name,
    description: `Bộ ${questions.length} câu hỏi ${raw.subject.name}.`,
    language: raw.subject.language,
    questionCount: questions.length,
    source: { file: raw.source?.questionBank ?? "MLN122.json", pageCount: 0, note: raw.source?.note ?? "Nguồn không cung cấp metadata trang." },
    dataQuality: { needsReviewCount: questions.filter((question) => question.needsReview).length, duplicatePromptGroups: [[51, 307], [158, 288], [187, 296], [283, 450]], answerCorrectionCount: raw.dataQuality?.answerChangedFromOriginalCount, correctedAnswerNumbers: raw.dataQuality?.answerChangedFromOriginalIds, reviewBasis: raw.dataQuality?.reviewBasis },
    questions
  });
}
