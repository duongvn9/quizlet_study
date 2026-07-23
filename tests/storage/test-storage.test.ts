import { describe, expect, it } from "vitest";
import data from "@/data/subjects/swd392.json";
import { subjectSchema } from "@/domain/subjects/schemas";
import { createTestSession } from "@/domain/test/generation";
import { testKey, testStorage } from "@/lib/storage/test-storage";

const subject = subjectSchema.parse(data);
const options = Object.fromEntries(subject.questions.map((q) => [q.id, q.options.map((o) => o.id)]));
const session = createTestSession(subject.id, subject.contentVersion, subject.questions, { count: 2, pool: "all", shuffleQuestions: false, shuffleOptions: false }, { random: () => 0, id: () => "id", now: () => "now" });

describe("test storage", () => {
  it("round trips the exact session", () => { testStorage.save(session); expect(testStorage.load(subject.id, subject.contentVersion, options)).toEqual({ status: "loaded", session }); });
  it("removes only its own invalid key", () => { localStorage.setItem("study-flow:v1:subject:keep", "learn"); localStorage.setItem(testKey(subject.id), "bad"); expect(testStorage.load(subject.id, subject.contentVersion, options).status).toBe("invalid"); expect(localStorage.getItem("study-flow:v1:subject:keep")).toBe("learn"); });
  it("rejects content changes without touching other subjects", () => { testStorage.save(session); localStorage.setItem(testKey("other"), "keep"); expect(testStorage.load(subject.id, subject.contentVersion + 1, options).status).toBe("content-version-mismatch"); expect(localStorage.getItem(testKey("other"))).toBe("keep"); });
});
