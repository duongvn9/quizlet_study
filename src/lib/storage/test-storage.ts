import { z } from "zod";
import type { TestSession } from "@/domain/test/types";

export const testKey = (subjectId: string) => `study-flow:v1:test:${subjectId}`;
const response = z.object({ selectedOptionId: z.string().min(1), answeredAt: z.string() });
const score = z.object({ correct: z.number().int().nonnegative(), incorrect: z.number().int().nonnegative(), unanswered: z.number().int().nonnegative(), total: z.number().int().positive(), percent: z.number().min(0).max(100), scoredAt: z.string() });
const schema = z.object({ schemaVersion: z.literal(1), subjectId: z.string().min(1), subjectContentVersion: z.number().int().positive(), sessionId: z.string().min(1), status: z.enum(["active", "submitted"]), currentIndex: z.number().int().nonnegative(), settings: z.object({ count: z.number().int().positive(), pool: z.enum(["all", "unmastered"]), shuffleQuestions: z.boolean(), shuffleOptions: z.boolean() }), questionIds: z.array(z.string().min(1)).min(1), optionOrders: z.record(z.string(), z.array(z.string().min(1)).min(2)), responses: z.record(z.string(), response), createdAt: z.string(), updatedAt: z.string(), submittedAt: z.string().nullable(), score: score.nullable() });
export type TestLoadResult = { status: "loaded"; session: TestSession } | { status: "missing" | "invalid" | "content-version-mismatch"; session: null };

export const testStorage = {
  load(subjectId: string, contentVersion: number, validOptions: Record<string, string[]>): TestLoadResult {
    const key = testKey(subjectId);
    let raw: string | null;
    try { raw = localStorage.getItem(key); } catch { return { status: "invalid", session: null }; }
    if (!raw) return { status: "missing", session: null };
    try {
      const parsed = schema.safeParse(JSON.parse(raw));
      if (!parsed.success || parsed.data.subjectId !== subjectId || parsed.data.subjectContentVersion !== contentVersion) {
        localStorage.removeItem(key);
        return { status: parsed.success && parsed.data.subjectContentVersion !== contentVersion ? "content-version-mismatch" : "invalid", session: null };
      }
      const session = parsed.data as TestSession;
      const ids = new Set(session.questionIds);
      const valid = session.currentIndex < session.questionIds.length && ids.size === session.questionIds.length && session.questionIds.every((id) => validOptions[id] && session.optionOrders[id]?.length === validOptions[id].length && session.optionOrders[id].every((option) => validOptions[id].includes(option))) && Object.entries(session.responses).every(([id, value]) => ids.has(id) && validOptions[id]?.includes(value.selectedOptionId));
      if (!valid || (session.status === "active") !== (session.score === null && session.submittedAt === null)) { localStorage.removeItem(key); return { status: "invalid", session: null }; }
      return { status: "loaded", session };
    } catch { try { localStorage.removeItem(key); } catch {} return { status: "invalid", session: null }; }
  },
  save(session: TestSession) { localStorage.setItem(testKey(session.subjectId), JSON.stringify(session)); },
  remove(subjectId: string) { localStorage.removeItem(testKey(subjectId)); },
};
