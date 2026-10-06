import { z } from "zod";
import { subjectSchema } from "./schemas";
import type { Subject } from "./types";

const rawQuestionSchema = z.object({
  id: z.string().min(1), number: z.number().int().positive(),
  type: z.literal("single_choice"), status: z.literal("active"), question: z.string().min(1),
  options: z.array(z.object({ key: z.string().min(1), text: z.string().min(1) }).passthrough()).min(2),
  correctAnswers: z.array(z.string().min(1)).length(1), answerTextFromSource: z.string(),
  explanation: z.string(), sourcePages: z.array(z.number().int().positive()),
  sourceNotes: z.union([z.string(), z.array(z.string())]).optional(),
  needsReview: z.boolean(), reviewNotes: z.array(z.string()),
  source: z.object({ file: z.string().min(1), questionIndex: z.number().int().positive() }).passthrough()
}).passthrough();

const rawSchema = z.object({
  schemaVersion: z.literal("1.0"),
  subject: z.object({ code: z.literal("MLN111"), title: z.string().min(1), assessment: z.literal("Final Exam"), collection: z.string(), language: z.literal("vi") }).passthrough(),
  source: z.object({ file: z.string().min(1), note: z.string() }).passthrough(),
  statistics: z.record(z.string(), z.unknown()),
  dataQuality: z.object({ exactDuplicateGroups: z.array(z.array(z.number().int().positive()).min(2)) }).passthrough(),
  extractionWarnings: z.array(z.string()), questions: z.array(rawQuestionSchema)
}).passthrough();

export const mln111FeRawSchema = z.preprocess((value) => {
  if (!value || typeof value !== "object" || !("questions" in value) || !Array.isArray(value.questions)) return value;
  return { ...value, questions: value.questions.filter((question) => question && typeof question === "object" && "status" in question && question.status === "active") };
}, rawSchema);

export function adaptMln111Fe(value: unknown): Subject {
  const raw = mln111FeRawSchema.parse(value);
  const questions = raw.questions.map((question) => ({
    id: question.id, number: question.number, type: "single-choice" as const, question: question.question,
    options: question.options.map(({ key, ...option }) => ({ id: key, ...option })),
    correctAnswers: question.correctAnswers, explanation: question.explanation === "" ? null : question.explanation,
    source: { ...question.source, pages: question.sourcePages }, sourcePages: question.sourcePages,
    answerTextFromSource: question.answerTextFromSource,
    ...(question.sourceNotes === undefined ? {} : { sourceNotes: question.sourceNotes }),
    needsReview: question.needsReview, reviewNotes: question.reviewNotes
  }));
  const activeNumbers = new Set(questions.map((question) => question.number));
  const canonicalQuestions = questions.map((question) => ({ ...question, options: question.options.map((option, index) => {
    const prior = question.options.slice(0, index).some((item) => item.id === option.id);
    return prior ? { ...option, id: `${option.id}-${index + 1}`, sourceLabel: option.id } : option;
  }) }));
  return subjectSchema.parse({
    schemaVersion: 1, contentVersion: 1, id: "mln111-fe", slug: "mln111-fe", code: raw.subject.code,
    name: "MLN111 - Triết học Mác - Lênin - Final Exam",
    description: `Bộ ${questions.length} câu hỏi Final Exam môn ${raw.subject.title}.`,
    assessment: raw.subject.assessment, language: raw.subject.language, questionCount: questions.length,
    source: { ...raw.source, pageCount: 0, collection: raw.subject.collection, statistics: raw.statistics, dataQuality: raw.dataQuality, extractionWarnings: raw.extractionWarnings },
    dataQuality: { needsReviewCount: questions.filter((question) => question.needsReview).length, duplicatePromptGroups: raw.dataQuality.exactDuplicateGroups.filter((group) => group.every((number) => activeNumbers.has(number))) },
    questions: canonicalQuestions
  });
}
