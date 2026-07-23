import { describe, expect, it } from "vitest";
import data from "@/data/subjects/swd392.json";
import mmaData from "@/data/subjects/mma301.json";
import { adaptMma301 } from "@/domain/subjects/mma301-adapter";
import { subjectSchema } from "@/domain/subjects/schemas";
import { createTestSession, eligibleQuestions, validateTestCount } from "@/domain/test/generation";
import { goToQuestion, selectResponse } from "@/domain/test/reducer";
import { submitTest } from "@/domain/test/scoring";

const subject = subjectSchema.parse(data);
const deps = { random: () => 0, id: () => "session-1", now: () => "2026-01-01T00:00:00.000Z" };

describe("test domain", () => {
  it("generates canonical unique IDs and stable option orders without mutation", () => { const before = structuredClone(subject.questions); const session = createTestSession(subject.id, subject.contentVersion, subject.questions, { count: 10, pool: "all", shuffleQuestions: true, shuffleOptions: true }, deps); expect(new Set(session.questionIds).size).toBe(10); expect(session.optionOrders[session.questionIds[0]]).toHaveLength(subject.questions[0].options.length); expect(subject.questions).toEqual(before); });
  it("validates counts and filters mastered questions", () => { expect(validateTestCount(1, 2)).toBe(true); expect(validateTestCount(1.5, 2)).toBe(false); expect(eligibleQuestions(subject.questions.slice(0, 2), "unmastered", { [subject.questions[0].id]: { questionId: subject.questions[0].id, status: "mastered", totalAttempts: 0, correctCount: 0, incorrectCount: 0, dontKnowCount: 0, correctStreak: 0, lastSelectedOptionId: null, lastResult: null, firstSeenAt: null, lastSeenAt: null, masteredAt: null } })).toHaveLength(1); });
  it("scores multiple-choice answers as exact sets", () => { const mma = adaptMma301(mmaData); const question = mma.questions.find((item) => item.type === "multiple-choice" && item.correctAnswers.length > 1)!; let session = createTestSession(mma.id, mma.contentVersion, [question], { count: 1, pool: "all", shuffleQuestions: false, shuffleOptions: false }, deps); for (const id of question.correctAnswers.slice(0, -1)) session = selectResponse(session, id, "partial", true); expect(submitTest(session, [question], "done").score?.correct).toBe(0); session = createTestSession(mma.id, mma.contentVersion, [question], { count: 1, pool: "all", shuffleQuestions: false, shuffleOptions: false }, deps); for (const id of [...question.correctAnswers].reverse()) session = selectResponse(session, id, "exact", true); expect(submitTest(session, [question], "done").score?.correct).toBe(1); });
  it("changes answers, navigates with skips, and scores idempotently", () => { let session = createTestSession(subject.id, subject.contentVersion, subject.questions, { count: 2, pool: "all", shuffleQuestions: false, shuffleOptions: false }, deps); session = selectResponse(session, subject.questions[0].options[1].id, "later"); session = selectResponse(session, subject.questions[0].correctAnswer, "later2"); session = goToQuestion(session, 1, "later3"); const scored = submitTest(session, subject.questions, "done"); expect(scored.score).toMatchObject({ correct: 1, unanswered: 1, total: 2 }); expect(submitTest(scored, subject.questions, "different")).toBe(scored); });
});
