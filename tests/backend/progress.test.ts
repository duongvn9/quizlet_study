import { describe, expect, it, vi } from "vitest";
import { GUEST_OWNER_ID, SyncedProgressRepository, mergeProgressRecords, migrateGuestProgress, type ProgressRecord, type ProgressRepository } from "@/lib/backend";
import type { SubjectProgress } from "@/domain/study/types";

function record(ownerId = "user", version = 1, updatedAt = "2026-01-01T00:00:00.000Z"): ProgressRecord {
  const progress: SubjectProgress = { schemaVersion: 1, subjectId: "subject", subjectContentVersion: version, questionProgress: {}, activeSession: null, completedSessionCount: 0, lifetimeAttempts: 0, lastStudiedAt: updatedAt };
  return { ownerId, subjectId: "subject", progress, updatedAt, revision: 0 };
}

class Repository implements ProgressRepository {
  value: ProgressRecord | null = null;
  fail = false;
  async get(): Promise<ProgressRecord | null> { if (this.fail) throw new Error("remote"); return this.value; }
  async save(value: ProgressRecord): Promise<ProgressRecord> { if (this.fail) throw new Error("remote"); this.value = value; return value; }
  async clear(): Promise<void> { if (this.fail) throw new Error("remote"); this.value = null; }
}

describe("progress repositories", () => {
  it("rejects owner conflicts", () => { expect(() => mergeProgressRecords(record("a"), record("b"))).toThrow("ownership"); });
  it("uses the newer content version", () => { expect(mergeProgressRecords(record("user", 1), record("user", 2)).progress.subjectContentVersion).toBe(2); });
  it("migrates guests and merges an existing owner record", () => { const migrated = migrateGuestProgress(record(GUEST_OWNER_ID, 1, "2026-01-02T00:00:00.000Z"), "user", record("user")); expect(migrated.ownerId).toBe("user"); expect(migrated.revision).toBeGreaterThan(0); });
  it("preserves a local save when remote save fails", async () => { const local = new Repository(); const remote = new Repository(); remote.fail = true; const onError = vi.fn(); const synced = new SyncedProgressRepository(local, remote, onError); const value = record(); await expect(synced.save(value)).resolves.toBe(value); expect(local.value).toBe(value); expect(onError).toHaveBeenCalled(); });
  it("returns local progress when remote loading fails", async () => { const local = new Repository(); local.value = record(); const remote = new Repository(); remote.fail = true; await expect(new SyncedProgressRepository(local, remote).get("user", "subject", 1)).resolves.toBe(local.value); });
});
