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
  const initialItems = queue.filter((q) => q.reason === "initial");
  const initialIndex = initialItems.findIndex((q) => q.instanceId === item.instanceId);
  const blockEnd = Math.floor(initialIndex / 5) * 5 + 5;
  const nextBlockIndex = queue.findIndex((q) => q.reason === "initial" && initialItems.findIndex((initial) => initial.instanceId === q.instanceId) >= blockEnd);
  if (result !== "correct" && !mastered && !queue.some((q, i) => i > session.currentIndex && q.questionId === question.id && !q.answered)) { const retryIndex = nextBlockIndex === -1 ? queue.length : nextBlockIndex; queue = [...queue]; queue.splice(retryIndex, 0, { instanceId: deps.id(), questionId: question.id, reason: "retry", answered: false }); }
  return { ...progress, questionProgress: { ...progress.questionProgress, [question.id]: qp }, activeSession: { ...session, queue, attempts: [...session.attempts, { id: deps.id(), queueInstanceId: item.instanceId, questionId: question.id, selectedOptionId, result, answeredAt: now }], updatedAt: now }, lifetimeAttempts: progress.lifetimeAttempts + 1, lastStudiedAt: now };
}
export function replaceAnswer(progress: SubjectProgress, question: Question, selectedOptionId: string | null, now = new Date().toISOString()): SubjectProgress {
  const session = progress.activeSession;
  if (!session || session.completedAt || !Number.isInteger(session.currentIndex)) return progress;
  const item = session.queue[session.currentIndex];
  if (!item?.answered || item.questionId !== question.id || selectedOptionId !== null && !question.options.some((option) => option.id === selectedOptionId)) return progress;
  const matchingAttemptIndexes = session.attempts.flatMap((attempt, index) => attempt.queueInstanceId === item.instanceId && attempt.questionId === question.id ? [index] : []);
  const old = progress.questionProgress[question.id];
  if (matchingAttemptIndexes.length !== 1 || !old) return progress;
  const attemptIndex = matchingAttemptIndexes[0];
  const previous = session.attempts[attemptIndex];
  const result: AttemptResult = selectedOptionId === null ? "dont-know" : selectedOptionId === question.correctAnswer ? "correct" : "incorrect";
  if (previous.selectedOptionId === selectedOptionId && previous.result === result) return progress;
  const attempts = session.attempts.map((attempt, index) => index === attemptIndex ? { ...attempt, selectedOptionId, result } : attempt);
  const questionAttempts = attempts.filter((attempt) => attempt.questionId === question.id);
  const originalQuestionAttempts = session.attempts.filter((attempt) => attempt.questionId === question.id);
  const count = (items: typeof questionAttempts, value: AttemptResult) => items.filter((attempt) => attempt.result === value).length;
  const baselineCorrect = old.correctCount - count(originalQuestionAttempts, "correct");
  const baselineIncorrect = old.incorrectCount - count(originalQuestionAttempts, "incorrect");
  const baselineDontKnow = old.dontKnowCount - count(originalQuestionAttempts, "dont-know");
  const allOriginalCorrect = originalQuestionAttempts.every((attempt) => attempt.result === "correct");
  let streak = allOriginalCorrect ? Math.max(0, old.correctStreak - originalQuestionAttempts.length) : 0;
  let masteredAt = streak >= session.settings.masteryStreak ? old.masteredAt : null;
  for (const attempt of questionAttempts) {
    streak = attempt.result === "correct" ? streak + 1 : 0;
    if (streak < session.settings.masteryStreak) masteredAt = null;
    else if (!masteredAt) masteredAt = attempt.answeredAt;
  }
  const latest = questionAttempts.at(-1)!;
  const mastered = streak >= session.settings.masteryStreak;
  const qp = { ...old, status: mastered ? "mastered" as const : "learning" as const, correctCount: baselineCorrect + count(questionAttempts, "correct"), incorrectCount: baselineIncorrect + count(questionAttempts, "incorrect"), dontKnowCount: baselineDontKnow + count(questionAttempts, "dont-know"), correctStreak: streak, lastSelectedOptionId: latest.selectedOptionId, lastResult: latest.result, lastSeenAt: latest.answeredAt, masteredAt: mastered ? masteredAt : null };
  return { ...progress, questionProgress: { ...progress.questionProgress, [question.id]: qp }, activeSession: { ...session, attempts, updatedAt: now } };
}

export function move(progress: SubjectProgress, direction: -1 | 1, now = new Date().toISOString()): SubjectProgress { const s = progress.activeSession; if (!s || s.completedAt) return progress; const current = s.queue[s.currentIndex]; if (direction === 1 && !current?.answered) return progress; const target = s.currentIndex + direction; if (target < 0 || target >= s.queue.length) { if (direction === 1 && s.queue.every(q => q.answered)) return { ...progress, activeSession: { ...s, completedAt: now, updatedAt: now }, completedSessionCount: progress.completedSessionCount + 1 }; return progress; } return { ...progress, activeSession: { ...s, currentIndex: target, frontierIndex: Math.max(s.frontierIndex, target), updatedAt: now } } }
