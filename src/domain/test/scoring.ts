import type { Question } from "@/domain/subjects/types";
import type { TestSession } from "./types";

export function submitTest(session: TestSession, questions: readonly Question[], now: string): TestSession {
  if (session.status === "submitted") return session;
  const byId = new Map(questions.map((question) => [question.id, question]));
  const correct = session.questionIds.filter((id) => session.responses[id]?.selectedOptionId === byId.get(id)?.correctAnswer).length;
  const unanswered = session.questionIds.filter((id) => !session.responses[id]).length;
  const total = session.questionIds.length;
  return { ...session, status: "submitted", submittedAt: now, updatedAt: now, score: { correct, incorrect: total - correct - unanswered, unanswered, total, percent: total ? Math.round(correct / total * 100) : 0, scoredAt: now } };
}
