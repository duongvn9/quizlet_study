import type { SubjectProgress } from "@/domain/study/types";
import { storage } from "@/lib/storage/local-study-storage";
import { progressSchema } from "@/lib/storage/schemas";
import { BackendError } from "./errors";
import type { ProgressRecord, ProgressRepository } from "./types";

export const GUEST_OWNER_ID = "guest";
const ownerKey = (ownerId: string, subjectId: string) => `study-flow:backend:v1:progress:${encodeURIComponent(ownerId)}:${encodeURIComponent(subjectId)}`;
const timestamp = (value: string | null) => value ? Date.parse(value) || 0 : 0;

export function mergeProgressRecords(local: ProgressRecord, remote: ProgressRecord): ProgressRecord {
  if (local.ownerId !== remote.ownerId || local.subjectId !== remote.subjectId) throw new BackendError("conflict", "Progress ownership or subject differs");
  if (local.progress.subjectContentVersion !== remote.progress.subjectContentVersion) return local.progress.subjectContentVersion > remote.progress.subjectContentVersion ? local : remote;
  const winner = timestamp(local.updatedAt) >= timestamp(remote.updatedAt) ? local : remote;
  const records = { ...remote.progress.questionProgress, ...local.progress.questionProgress };
  for (const id of new Set([...Object.keys(local.progress.questionProgress), ...Object.keys(remote.progress.questionProgress)])) {
    const left = local.progress.questionProgress[id];
    const right = remote.progress.questionProgress[id];
    if (left && right) records[id] = timestamp(left.lastSeenAt) >= timestamp(right.lastSeenAt) ? left : right;
  }
  const session = winner.progress.activeSession;
  const boundedSession = session && { ...session, currentIndex: Math.min(session.currentIndex, session.queue.length - 1), frontierIndex: Math.min(Math.max(session.frontierIndex, session.currentIndex), session.queue.length - 1) };
  return { ...winner, revision: Math.max(local.revision, remote.revision) + 1, progress: { ...winner.progress, activeSession: boundedSession, questionProgress: records, completedSessionCount: Math.max(local.progress.completedSessionCount, remote.progress.completedSessionCount), lifetimeAttempts: Math.max(local.progress.lifetimeAttempts, remote.progress.lifetimeAttempts) } };
}

export function migrateGuestProgress(record: ProgressRecord, userId: string, existing?: ProgressRecord | null): ProgressRecord {
  if (record.ownerId !== GUEST_OWNER_ID) return record;
  const migrated = { ...record, ownerId: userId, revision: record.revision + 1, updatedAt: new Date().toISOString() };
  return existing ? mergeProgressRecords(migrated, existing) : migrated;
}

export class LocalProgressRepository implements ProgressRepository {
  async get(ownerId: string, subjectId: string, contentVersion = 1): Promise<ProgressRecord | null> {
    if (typeof localStorage === "undefined") return null;
    if (ownerId === GUEST_OWNER_ID) {
      const result = storage.load(subjectId, contentVersion);
      return result.status === "loaded" ? createProgressRecord(ownerId, result.progress) : null;
    }
    try {
      const raw = localStorage.getItem(ownerKey(ownerId, subjectId));
      if (!raw) return null;
      const envelope = JSON.parse(raw) as ProgressRecord;
      const progress = progressSchema.safeParse(envelope.progress);
      if (!progress.success || envelope.ownerId !== ownerId || envelope.subjectId !== subjectId || progress.data.subjectContentVersion !== contentVersion) return null;
      return { ...envelope, progress: progress.data };
    } catch { return null; }
  }
  async save(record: ProgressRecord): Promise<ProgressRecord> { if (record.ownerId === GUEST_OWNER_ID) storage.save(record.progress); else localStorage.setItem(ownerKey(record.ownerId, record.subjectId), JSON.stringify(record)); return record; }
  async clear(ownerId: string, subjectId: string): Promise<void> { if (ownerId === GUEST_OWNER_ID) storage.remove(subjectId); else localStorage.removeItem(ownerKey(ownerId, subjectId)); }
}

export abstract class RemoteProgressRepository implements ProgressRepository {
  abstract get(ownerId: string, subjectId: string, contentVersion?: number): Promise<ProgressRecord | null>;
  abstract save(record: ProgressRecord): Promise<ProgressRecord>;
  abstract clear(ownerId: string, subjectId: string): Promise<void>;
}

export class SyncedProgressRepository implements ProgressRepository {
  constructor(private readonly local: ProgressRepository, private readonly remote: ProgressRepository, private readonly onRemoteError?: (error: unknown) => void) {}
  async get(ownerId: string, subjectId: string, version = 1): Promise<ProgressRecord | null> { const local = await this.local.get(ownerId, subjectId, version); try { const remote = await this.remote.get(ownerId, subjectId, version); if (!remote) return local; const merged = local ? mergeProgressRecords(local, remote) : remote; await this.local.save(merged); return merged; } catch (error) { this.onRemoteError?.(error); return local; } }
  async save(record: ProgressRecord): Promise<ProgressRecord> { const saved = await this.local.save(record); try { return await this.remote.save(saved); } catch (error) { this.onRemoteError?.(error); return saved; } }
  async clear(ownerId: string, subjectId: string): Promise<void> { await this.local.clear(ownerId, subjectId); try { await this.remote.clear(ownerId, subjectId); } catch (error) { this.onRemoteError?.(error); } }
  async migrateGuest(userId: string, subjectId: string, version: number): Promise<ProgressRecord | null> { const guestRecord = await this.local.get(GUEST_OWNER_ID, subjectId, version); if (!guestRecord) return null; const existing = await this.get(userId, subjectId, version); const migrated = migrateGuestProgress(guestRecord, userId, existing); await this.save(migrated); await this.local.clear(GUEST_OWNER_ID, subjectId); return migrated; }
}

export function createProgressRecord(ownerId: string, progress: SubjectProgress): ProgressRecord { return { ownerId, subjectId: progress.subjectId, progress, updatedAt: progress.lastStudiedAt ?? new Date(0).toISOString(), revision: 0 }; }
