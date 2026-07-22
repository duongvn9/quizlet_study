import type { SubjectProgress } from "@/domain/study/types";
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

function hasValidRelations(progress: SubjectProgress, questionIds?: string[], questionOptions?: Record<string, string[]>) {
  const validQuestions = questionIds ? new Set(questionIds) : null;
  for (const [key, record] of Object.entries(progress.questionProgress)) {
    if (key !== record.questionId || (validQuestions && !validQuestions.has(record.questionId))) return false;
    const options = questionOptions?.[record.questionId];
    if (record.lastSelectedOptionId !== null && options && !options.includes(record.lastSelectedOptionId)) return false;
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
    if (attempt.selectedOptionId !== null && options && !options.includes(attempt.selectedOptionId)) return false;
  }
  for (const item of session.queue) {
    const attempts = session.attempts.filter((attempt) => attempt.queueInstanceId === item.instanceId);
    if (item.answered !== (attempts.length === 1)) return false;
  }
  return true;
}

export const storage = {
  load(id: string, version: number, questionIds?: string[], questionOptions?: Record<string, string[]>): LoadResult {
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
      if (parsed.data.subjectContentVersion !== version) {
        removeInvalid(id);
        try {
          localStorage.setItem(noticeKey(id), "pending");
        } catch {
          return { status: "content-version-mismatch", progress: null, previousContentVersion: parsed.data.subjectContentVersion, currentContentVersion: version };
        }
        return { status: "content-version-mismatch", progress: null, previousContentVersion: parsed.data.subjectContentVersion, currentContentVersion: version };
      }
      if (!hasValidRelations(parsed.data, questionIds, questionOptions)) {
        removeInvalid(id);
        try {
          localStorage.setItem(noticeKey(id), "pending");
        } catch {
          return { status: "incompatible", progress: null };
        }
        return { status: "incompatible", progress: null };
      }
      return { status: "loaded", progress: parsed.data };
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
