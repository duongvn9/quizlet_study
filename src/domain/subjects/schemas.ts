import { z } from "zod";

export const optionSchema = z.object({ id: z.string().min(1), text: z.string().min(1) });
export const questionTypeSchema = z.enum(["single-choice", "multiple-choice", "true-false"]);
const questionBaseSchema = z.object({
  id: z.string().min(1), number: z.number().int().positive(), type: questionTypeSchema, question: z.string().min(1),
  options: z.array(optionSchema).min(2), correctAnswers: z.array(z.string().min(1)).min(1), explanation: z.string().nullable(),
  source: z.object({ file: z.string().min(1), pages: z.array(z.number().int().positive()) }),
  needsReview: z.boolean(), reviewNotes: z.array(z.string())
}).superRefine((q, ctx) => {
  const optionIds = new Set(q.options.map((option) => option.id));
  if (optionIds.size !== q.options.length) ctx.addIssue({ code: "custom", message: "Option IDs must be unique" });
  if (new Set(q.correctAnswers).size !== q.correctAnswers.length) ctx.addIssue({ code: "custom", message: "correctAnswers must be unique" });
  if (q.correctAnswers.some((answer) => !optionIds.has(answer))) ctx.addIssue({ code: "custom", message: "correctAnswers must reference options" });
  if (q.type !== "multiple-choice" && q.correctAnswers.length !== 1) ctx.addIssue({ code: "custom", message: "Single-choice questions require exactly one correct answer" });
});
export const questionSchema = questionBaseSchema.transform((question) => ({ ...question, correctAnswer: question.correctAnswers[0] }));
const legacyQuestionSchema = z.object({ correctAnswer: z.string().min(1) }).passthrough().transform(({ correctAnswer, ...question }) => ({ ...question, type: "single-choice" as const, correctAnswers: [correctAnswer] })).pipe(questionSchema);
export const compatibleQuestionSchema = z.union([questionSchema, legacyQuestionSchema]);
export const subjectSchema = z.object({
  schemaVersion: z.literal(1), contentVersion: z.number().int().positive(), id: z.string().min(1), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  code: z.string().min(1), name: z.string().min(1), description: z.string(), language: z.string().min(1), questionCount: z.number().int().nonnegative(),
  source: z.object({ file: z.string(), pageCount: z.number().int().nonnegative(), note: z.string() }),
  dataQuality: z.object({
    needsReviewCount: z.number().int().nonnegative(),
    duplicatePromptGroups: z.array(z.array(z.number().int().positive()).min(2)),
    answerCorrectionCount: z.number().int().nonnegative().optional(),
    correctedAnswerNumbers: z.array(z.number().int().positive()).optional(),
    reviewBasis: z.string().optional(),
  }).superRefine((quality, ctx) => {
    if (quality.answerCorrectionCount !== undefined && quality.correctedAnswerNumbers?.length !== quality.answerCorrectionCount) ctx.addIssue({ code: "custom", message: "answerCorrectionCount mismatch" });
  }),
  questions: z.array(compatibleQuestionSchema)
}).superRefine((subject, ctx) => {
  if (subject.questionCount !== subject.questions.length) ctx.addIssue({ code: "custom", message: "questionCount does not match questions.length" });
  if (new Set(subject.questions.map((question) => question.id)).size !== subject.questions.length) ctx.addIssue({ code: "custom", message: "Question IDs must be unique" });
  if (new Set(subject.questions.map((question) => question.number)).size !== subject.questions.length) ctx.addIssue({ code: "custom", message: "Question numbers must be unique" });
  if (subject.dataQuality.needsReviewCount !== subject.questions.filter((question) => question.needsReview).length) ctx.addIssue({ code: "custom", message: "needsReviewCount mismatch" });
  const numbers = new Set(subject.questions.map((question) => question.number));
  if (subject.dataQuality.duplicatePromptGroups.flat().some((number) => !numbers.has(number))) ctx.addIssue({ code: "custom", message: "Duplicate group references missing question" });
});
