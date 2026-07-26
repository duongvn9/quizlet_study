import { BackendError } from "./errors";
import type { UserIdentity } from "./types";

export function canManageContent(user: UserIdentity | null): boolean { return user?.role === "admin"; }
export function canAccessOwner(user: UserIdentity | null, ownerId: string): boolean { return user?.role === "admin" || user?.id === ownerId; }
export function requireOwner(user: UserIdentity | null, ownerId: string): void { if (!user) throw new BackendError("unauthorized", "Authentication required"); if (!canAccessOwner(user, ownerId)) throw new BackendError("forbidden", "Permission denied"); }
