import type { TestSession } from "./types";

export function selectResponse(session: TestSession, optionId: string, now: string): TestSession {
  if (session.status !== "active") return session;
  const questionId = session.questionIds[session.currentIndex];
  if (!questionId || !session.optionOrders[questionId]?.includes(optionId)) return session;
  return { ...session, responses: { ...session.responses, [questionId]: { selectedOptionId: optionId, answeredAt: now } }, updatedAt: now };
}

export function goToQuestion(session: TestSession, index: number, now: string): TestSession {
  if (session.status !== "active" || !Number.isInteger(index) || index < 0 || index >= session.questionIds.length) return session;
  return { ...session, currentIndex: index, updatedAt: now };
}
