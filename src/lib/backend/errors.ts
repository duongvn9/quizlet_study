export type BackendErrorCode = "invalid-input" | "unauthorized" | "forbidden" | "not-found" | "conflict" | "unavailable" | "rate-limited" | "unknown";

export class BackendError extends Error {
  constructor(public readonly code: BackendErrorCode, message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "BackendError";
  }
}

export function normalizeError(error: unknown): BackendError {
  if (error instanceof BackendError) return error;
  if (error instanceof Error) return new BackendError("unknown", error.message, error);
  return new BackendError("unknown", "An unknown backend error occurred", error);
}
