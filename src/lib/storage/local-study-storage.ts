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

export const storage = {
  load(id: string, version: number, questionIds?: string[]): LoadResult {
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
      if (questionIds) {
        const validIds = new Set(questionIds);
        const incompatible = Object.keys(parsed.data.questionProgress).some((questionId) => !validIds.has(questionId)) || parsed.data.activeSession?.queue.some((item) => !validIds.has(item.questionId));
        if (incompatible) {
          removeInvalid(id);
          return { status: "incompatible", progress: null };
        }
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
