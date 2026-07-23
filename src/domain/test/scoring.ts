import type { Question } from "@/domain/subjects/types";
import type { TestSession } from "./types";

const exactSet = (selected: string[], correct: string[]) => selected.length === correct.length && selected.every((id) => correct.includes(id));

export function submitTest(session: TestSession, questions: readonly Question[], now: string): TestSession {
  if (session.status === "submitted") return session;
  const byId = new Map(questions.map((question) => [question.id, question]));
  const correct = session.questionIds.filter((id) => {
    const response = session.responses[id];
    const question = byId.get(id);
    return !!response && !!question && exactSet(response.selectedOptionIds, question.correctAnswers);
  }).length;
  const unanswered = session.questionIds.filter((id) => !session.responses[id]).length;
  const total = session.questionIds.length;
  return { ...session, status: "submitted", submittedAt: now, updatedAt: now, score: { correct, incorrect: total - correct - unanswered, unanswered, total, percent: total ? Math.round(correct / total * 100) : 0, scoredAt: now } };
}
