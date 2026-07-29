import type { Question } from "@/domain/subjects/types";
import type { TestSession } from "./types";

const exactSet = (selected: string[], correct: string[]) => selected.length === correct.length && selected.every((id) => correct.includes(id));

export function submitTest(session: TestSession, questions: readonly Question[], now: string): TestSession {
  if (session.status === "submitted") return session;
  const byId = new Map(questions.filter((question) => !question.disabled).map((question) => [question.id, question]));
  const questionIds = session.questionIds.filter((id) => byId.has(id));
  const correct = questionIds.filter((id) => {
    const response = session.responses[id];
    const question = byId.get(id);
    return !!response && !!question && exactSet(response.selectedOptionIds, question.correctAnswers);
  }).length;
  const optionOrders = Object.fromEntries(questionIds.map((id) => [id, session.optionOrders[id] ?? byId.get(id)!.options.map((option) => option.id)]));
  const responses = Object.fromEntries(questionIds.flatMap((id) => session.responses[id] ? [[id, session.responses[id]]] : []));
  const unanswered = questionIds.filter((id) => !responses[id]).length;
  const total = questionIds.length;
  return { ...session, questionIds, optionOrders, responses, currentIndex: Math.min(session.currentIndex, Math.max(0, total - 1)), status: "submitted", submittedAt: now, updatedAt: now, score: { correct, incorrect: total - correct - unanswered, unanswered, total, percent: total ? Math.round(correct / total * 100) : 0, scoredAt: now } };
}
