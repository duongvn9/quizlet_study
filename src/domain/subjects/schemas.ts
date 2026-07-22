import { z } from "zod";

export const optionSchema = z.object({ id: z.string().min(1), text: z.string().min(1) });
export const questionSchema = z.object({
  id: z.string().min(1), number: z.number().int().positive(), type: z.literal("multiple-choice"), question: z.string().min(1),
  options: z.array(optionSchema).min(2), correctAnswer: z.string().min(1), explanation: z.string().nullable(),
  source: z.object({ file: z.string().min(1), pages: z.array(z.number().int().positive()).min(1) }),
  needsReview: z.boolean(), reviewNotes: z.array(z.string())
}).superRefine((q, ctx) => {
  if (new Set(q.options.map(o => o.id)).size !== q.options.length) ctx.addIssue({ code: "custom", message: "Option IDs must be unique" });
  if (!q.options.some(o => o.id === q.correctAnswer)) ctx.addIssue({ code: "custom", message: "correctAnswer must reference an option" });
});
export const subjectSchema = z.object({
  schemaVersion: z.literal(1), contentVersion: z.number().int().positive(), id: z.string().min(1), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  code: z.string().min(1), name: z.string().min(1), description: z.string(), language: z.string().min(1), questionCount: z.number().int().nonnegative(),
  source: z.object({ file: z.string(), pageCount: z.number().int().positive(), note: z.string() }),
  dataQuality: z.object({
    needsReviewCount: z.number().int().nonnegative(),
    duplicatePromptGroups: z.array(z.array(z.number().int().positive()).min(2)),
    answerCorrectionCount: z.number().int().nonnegative().optional(),
    correctedAnswerNumbers: z.array(z.number().int().positive()).optional(),
    reviewBasis: z.string().optional(),
  }).superRefine((quality, ctx) => {
    if (quality.answerCorrectionCount !== undefined && quality.correctedAnswerNumbers?.length !== quality.answerCorrectionCount) {
      ctx.addIssue({ code: "custom", message: "answerCorrectionCount mismatch" });
    }
  }),
  questions: z.array(questionSchema)
}).superRefine((s, ctx) => {
  if (s.questionCount !== s.questions.length) ctx.addIssue({ code: "custom", message: "questionCount does not match questions.length" });
  if (new Set(s.questions.map(q => q.id)).size !== s.questions.length) ctx.addIssue({ code: "custom", message: "Question IDs must be unique" });
  if (new Set(s.questions.map(q => q.number)).size !== s.questions.length) ctx.addIssue({ code: "custom", message: "Question numbers must be unique" });
  if (s.dataQuality.needsReviewCount !== s.questions.filter(q => q.needsReview).length) ctx.addIssue({ code: "custom", message: "needsReviewCount mismatch" });
  const numbers = new Set(s.questions.map(q => q.number));
  if (s.dataQuality.duplicatePromptGroups.flat().some(n => !numbers.has(n))) ctx.addIssue({ code: "custom", message: "Duplicate group references missing question" });
});
