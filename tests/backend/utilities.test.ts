import { describe, expect, it, vi } from "vitest";
import { BackendError, canAccessOwner, getBackendConfig, normalizeError, withRetry } from "@/lib/backend";

describe("backend utilities", () => {
  it("keeps backend features disabled by default", () => { expect(getBackendConfig({})).toEqual({ authEnabled: false, remoteProgressEnabled: false, adminImportEnabled: false }); });
  it("normalizes errors", () => { expect(normalizeError(new Error("failed"))).toMatchObject({ code: "unknown", message: "failed" }); expect(normalizeError(new BackendError("conflict", "x")).code).toBe("conflict"); });
  it("checks ownership and admin access", () => { expect(canAccessOwner({ id: "a", role: "user" }, "a")).toBe(true); expect(canAccessOwner({ id: "a", role: "admin" }, "b")).toBe(true); expect(canAccessOwner(null, "a")).toBe(false); });
  it("retries with exponential delays", async () => { const operation = vi.fn().mockRejectedValueOnce(new Error("temporary")).mockResolvedValue("ok"); const sleep = vi.fn().mockResolvedValue(undefined); await expect(withRetry(operation, { sleep })).resolves.toBe("ok"); expect(sleep).toHaveBeenCalledWith(100); });
});
