import { beforeEach, describe, expect, it } from "vitest";
import data from "@/data/subjects/swd392.json";
import { subjectSchema } from "@/domain/subjects/schemas";
import { createProgress } from "@/domain/study/create-session";
import { storage } from "@/lib/storage/local-study-storage";
import { noticeKey, subjectKey } from "@/lib/storage/keys";

const subject = subjectSchema.parse(data);

describe("storage", () => {
  beforeEach(() => localStorage.clear());

  it("loads matching progress", () => {
    storage.save(createProgress(subject.id, 1, subject.questions));
    expect(storage.load(subject.id, 1).status).toBe("loaded");
  });

  it("handles missing and corrupt values", () => {
    expect(storage.load(subject.id, 1).status).toBe("missing");
    localStorage.setItem(subjectKey(subject.id), "{");
    expect(storage.load(subject.id, 1).status).toBe("invalid");
    expect(localStorage.getItem(subjectKey(subject.id))).toBeNull();
  });

  it("removes invalid schema for only the affected subject", () => {
    localStorage.setItem(subjectKey(subject.id), JSON.stringify({ schemaVersion: 999 }));
    localStorage.setItem(subjectKey("other"), "keep");
    expect(storage.load(subject.id, 1).status).toBe("invalid");
    expect(localStorage.getItem(subjectKey(subject.id))).toBeNull();
    expect(localStorage.getItem(subjectKey("other"))).toBe("keep");
  });

  it("resets only SWD392 on the corrected content version and shows notice once", () => {
    storage.save(createProgress(subject.id, subject.contentVersion - 1, subject.questions));
    const otherProgress = createProgress("other", 7, subject.questions);
    storage.save(otherProgress);

    expect(storage.load(subject.id, subject.contentVersion).status).toBe("content-version-mismatch");
    expect(localStorage.getItem(subjectKey(subject.id))).toBeNull();
    expect(storage.load("other", 7).status).toBe("loaded");
    expect(storage.consumeNotice(subject.id)).toBe(true);
    expect(storage.consumeNotice(subject.id)).toBe(false);
  });

  it("detects subject identity mismatch", () => {
    localStorage.setItem(subjectKey(subject.id), JSON.stringify({ ...createProgress(subject.id, 1, subject.questions), subjectId: "wrong" }));
    expect(storage.load(subject.id, 1).status).toBe("invalid");
  });

  it("detects incompatible question ids in progress", () => {
    const progress = createProgress(subject.id, 1, subject.questions);
    storage.save({ ...progress, questionProgress: { ...progress.questionProgress, missing: { ...progress.questionProgress[subject.questions[0].id], questionId: "missing" } } });
    expect(storage.load(subject.id, 1, subject.questions.map((question) => question.id)).status).toBe("incompatible");
  });

  it("keeps acknowledged update notice from showing again", () => {
    localStorage.setItem(noticeKey(subject.id), "acknowledged");
    expect(storage.consumeNotice(subject.id)).toBe(false);
  });
});
