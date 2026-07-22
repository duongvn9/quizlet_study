import type { Question } from "@/domain/subjects/types";
import type { AttemptResult, SubjectProgress } from "./types";

export function answer(progress: SubjectProgress, question: Question, selectedOptionId: string | null, deps = { id: () => crypto.randomUUID(), now: () => new Date().toISOString() }): SubjectProgress {
  const session = progress.activeSession; if (!session || session.completedAt) return progress;
  const item = Number.isInteger(session.currentIndex) ? session.queue[session.currentIndex] : undefined; if (!item || item.answered || item.questionId !== question.id) return progress;
  if (selectedOptionId !== null && !question.options.some((option) => option.id === selectedOptionId)) return progress;
  const old = progress.questionProgress[question.id]; if (!old) return progress;
  const result: AttemptResult = selectedOptionId === null ? "dont-know" : selectedOptionId === question.correctAnswer ? "correct" : "incorrect";
  const now = deps.now(); const streak = result === "correct" ? old.correctStreak + 1 : 0; const mastered = streak >= session.settings.masteryStreak;
  const qp = { ...old, status: mastered ? "mastered" as const : "learning" as const, totalAttempts: old.totalAttempts + 1, correctCount: old.correctCount + (result === "correct" ? 1 : 0), incorrectCount: old.incorrectCount + (result === "incorrect" ? 1 : 0), dontKnowCount: old.dontKnowCount + (result === "dont-know" ? 1 : 0), correctStreak: streak, lastSelectedOptionId: selectedOptionId, lastResult: result, firstSeenAt: old.firstSeenAt ?? now, lastSeenAt: now, masteredAt: mastered ? now : null };
  let queue = session.queue.map((q, i) => i === session.currentIndex ? { ...q, answered: true } : q);
  if (!mastered && !queue.some((q, i) => i > session.currentIndex && q.questionId === question.id && !q.answered)) { queue = [...queue]; queue.splice(Math.min(session.currentIndex + session.settings.retryGap + 1, queue.length), 0, { instanceId: deps.id(), questionId: question.id, reason: "retry", answered: false }); }
  return { ...progress, questionProgress: { ...progress.questionProgress, [question.id]: qp }, activeSession: { ...session, queue, attempts: [...session.attempts, { id: deps.id(), queueInstanceId: item.instanceId, questionId: question.id, selectedOptionId, result, answeredAt: now }], updatedAt: now }, lifetimeAttempts: progress.lifetimeAttempts + 1, lastStudiedAt: now };
}
export function move(progress: SubjectProgress, direction: -1 | 1, now = new Date().toISOString()): SubjectProgress { const s = progress.activeSession; if (!s || s.completedAt) return progress; const current = s.queue[s.currentIndex]; if (direction === 1 && !current?.answered) return progress; const target = s.currentIndex + direction; if (target < 0 || target >= s.queue.length) { if (direction === 1 && s.queue.every(q => q.answered)) return { ...progress, activeSession: { ...s, completedAt: now, updatedAt: now }, completedSessionCount: progress.completedSessionCount + 1 }; return progress; } return { ...progress, activeSession: { ...s, currentIndex: target, frontierIndex: Math.max(s.frontierIndex, target), updatedAt: now } } }
