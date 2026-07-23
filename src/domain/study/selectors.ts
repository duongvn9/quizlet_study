import type { SubjectProgress } from "./types";
export function selectStats(progress: SubjectProgress | null, total: number) { const values = progress ? Object.values(progress.questionProgress) : []; const seenCount = values.filter(q => q.totalAttempts > 0).length; const masteredCount = values.filter(q => q.status === "mastered").length; const learningCount = values.filter(q => q.status === "learning").length; const correct = values.reduce((n, q) => n + q.correctCount, 0); const incorrect = values.reduce((n, q) => n + q.incorrectCount, 0); const dontKnow = values.reduce((n, q) => n + q.dontKnowCount, 0); return { seenCount, masteredCount, learningCount, newCount: Math.max(0, total - seenCount), remainingCount: Math.max(0, total - masteredCount), correct, incorrect, dontKnow, totalAttempts: correct + incorrect + dontKnow, accuracy: correct + incorrect ? Math.min(100, Math.max(0, Math.round(correct / (correct + incorrect) * 100))) : 0, percentage: total ? Math.min(100, Math.max(0, Math.round(masteredCount / total * 100))) : 0 } }

export function selectLearnCounters(progress: SubjectProgress | null, canonicalQuestionIds: readonly string[]) {
  const canonicalIds = new Set(canonicalQuestionIds.filter((id) => typeof id === "string" && id.length > 0));
  const total = canonicalIds.size;
  const session = progress?.activeSession;
  const frontier = session && Number.isInteger(session.frontierIndex) ? session.frontierIndex : -1;
  const current = session && Number.isInteger(session.currentIndex) ? session.currentIndex : -1;
  const reachedThrough = Math.max(frontier, current);
  const presentedIds = new Set((session?.queue ?? []).slice(0, Math.max(0, reachedThrough + 1)).map((item) => item?.questionId).filter((id): id is string => canonicalIds.has(id)));
  const mastered = progress ? [...canonicalIds].filter((id) => progress.questionProgress?.[id]?.status === "mastered").length : 0;
  const presentedCount = Math.min(total, presentedIds.size);
  const masteredCount = Math.min(total, mastered);
  return { presentedCount, masteredCount, total, percentage: total ? presentedCount / total * 100 : 0 };
}
