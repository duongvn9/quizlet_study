import type { AttemptResult, SubjectProgress } from "@/domain/study/types";
import { noticeKey, subjectKey } from "./keys";
import { progressSchema } from "./schemas";

export type LoadResult =
  | { status: "loaded"; progress: SubjectProgress }
  | { status: "missing" | "invalid" | "incompatible"; progress: null }
  | { status: "content-version-mismatch"; progress: null; previousContentVersion: number | null; currentContentVersion: number };

function removeInvalid(id: string) {
  try {
    localStorage.removeItem(subjectKey(id));
  } catch {
    return;
  }
}

function migrateMma301(progress: SubjectProgress, version: number, correctAnswers?: Record<string, string[]>): SubjectProgress | null {
  if (progress.subjectId !== "mma301" || progress.subjectContentVersion !== 1 || version !== 2 || !correctAnswers) return null;
  const session = progress.activeSession;
  const attempts = session?.attempts.map((attempt) => {
    const correct = correctAnswers[attempt.questionId];
    if (!attempt.selectedOptionIds || !correct) return attempt;
    const result: AttemptResult = attempt.selectedOptionIds.length === correct.length && attempt.selectedOptionIds.every((id) => correct.includes(id)) ? "correct" : "incorrect";
    return { ...attempt, result };
  });
  const questionProgress = Object.fromEntries(Object.entries(progress.questionProgress).map(([id, record]) => {
    const previous = session?.attempts.filter((attempt) => attempt.questionId === id) ?? [];
    const next = attempts?.filter((attempt) => attempt.questionId === id) ?? [];
    if (!previous.length) return [id, record];
    const count = (items: typeof previous, result: "correct" | "incorrect" | "dont-know") => items.filter((attempt) => attempt.result === result).length;
    let streak = previous.every((attempt) => attempt.result === "correct") ? Math.max(0, record.correctStreak - previous.length) : 0;
    let masteredAt = streak >= session!.settings.masteryStreak ? record.masteredAt : null;
    for (const attempt of next) { streak = attempt.result === "correct" ? streak + 1 : 0; if (streak < session!.settings.masteryStreak) masteredAt = null; else if (!masteredAt) masteredAt = attempt.answeredAt; }
    const latest = next.at(-1)!;
    return [id, { ...record, status: streak >= session!.settings.masteryStreak ? "mastered" : record.totalAttempts ? "learning" : "new", correctCount: record.correctCount - count(previous, "correct") + count(next, "correct"), incorrectCount: record.incorrectCount - count(previous, "incorrect") + count(next, "incorrect"), dontKnowCount: record.dontKnowCount - count(previous, "dont-know") + count(next, "dont-know"), correctStreak: streak, lastSelectedOptionIds: latest.selectedOptionIds, lastResult: latest.result, lastSeenAt: latest.answeredAt, masteredAt: streak >= session!.settings.masteryStreak ? masteredAt : null }];
  }));
  return { ...progress, subjectContentVersion: version, questionProgress, activeSession: session && { ...session, subjectContentVersion: version, attempts: attempts! } };
}

function hasValidRelations(progress: SubjectProgress, questionIds?: string[], questionOptions?: Record<string, string[]>) {
  const validQuestions = questionIds ? new Set(questionIds) : null;
  for (const [key, record] of Object.entries(progress.questionProgress)) {
    if (key !== record.questionId || (validQuestions && !validQuestions.has(record.questionId))) return false;
    const options = questionOptions?.[record.questionId];
    if (record.lastSelectedOptionIds && options && record.lastSelectedOptionIds.some((id) => !options.includes(id))) return false;
  }
  const session = progress.activeSession;
  if (!session) return true;
  if (session.subjectId !== progress.subjectId || session.subjectContentVersion !== progress.subjectContentVersion) return false;
  if (session.currentIndex >= session.queue.length || session.frontierIndex >= session.queue.length || session.currentIndex > session.frontierIndex) return false;
  const queueIds = new Set(session.queue.map((item) => item.instanceId));
  if (queueIds.size !== session.queue.length) return false;
  const attemptIds = new Set(session.attempts.map((attempt) => attempt.id));
  if (attemptIds.size !== session.attempts.length) return false;
  for (const item of session.queue) {
    if (validQuestions && !validQuestions.has(item.questionId)) return false;
  }
  for (const attempt of session.attempts) {
    const item = session.queue.find((candidate) => candidate.instanceId === attempt.queueInstanceId);
    if (!item || item.questionId !== attempt.questionId) return false;
    const options = questionOptions?.[attempt.questionId];
    if (attempt.selectedOptionIds && options && attempt.selectedOptionIds.some((id) => !options.includes(id))) return false;
  }
  for (const item of session.queue) {
    const attempts = session.attempts.filter((attempt) => attempt.queueInstanceId === item.instanceId);
    if (item.answered !== (attempts.length === 1)) return false;
  }
  return true;
}

export const storage = {
  load(id: string, version: number, questionIds?: string[], questionOptions?: Record<string, string[]>, correctAnswers?: Record<string, string[]>): LoadResult {
    let raw: string | null;
    try {
      raw = localStorage.getItem(subjectKey(id));
    } catch {
      return { status: "invalid", progress: null };
    }
    if (!raw) return { status: "missing", progress: null };
    try {
      const parsed = progressSchema.safeParse(JSON.parse(raw));
      if (!parsed.success || parsed.data.subjectId !== id) {
        removeInvalid(id);
        return { status: "invalid", progress: null };
      }
      const progress = parsed.data.subjectContentVersion === version ? parsed.data : migrateMma301(parsed.data, version, correctAnswers);
      if (!progress) {
        removeInvalid(id);
        try {
          localStorage.setItem(noticeKey(id), "pending");
        } catch {
          return { status: "content-version-mismatch", progress: null, previousContentVersion: parsed.data.subjectContentVersion, currentContentVersion: version };
        }
        return { status: "content-version-mismatch", progress: null, previousContentVersion: parsed.data.subjectContentVersion, currentContentVersion: version };
      }
      if (!hasValidRelations(progress, questionIds, questionOptions)) {
        removeInvalid(id);
        try {
          localStorage.setItem(noticeKey(id), "pending");
        } catch {
          return { status: "incompatible", progress: null };
        }
        return { status: "incompatible", progress: null };
      }
      if (progress !== parsed.data) this.save(progress);
      return { status: "loaded", progress };
    } catch {
      removeInvalid(id);
      return { status: "invalid", progress: null };
    }
  },
  save(progress: SubjectProgress) {
    localStorage.setItem(subjectKey(progress.subjectId), JSON.stringify(progress));
  },
  remove(id: string) {
    localStorage.removeItem(subjectKey(id));
  },
  consumeNotice(id: string) {
    const key = noticeKey(id);
    try {
      if (localStorage.getItem(key) !== "pending") return false;
      localStorage.setItem(key, "acknowledged");
      return true;
    } catch {
      return false;
    }
  },
};
