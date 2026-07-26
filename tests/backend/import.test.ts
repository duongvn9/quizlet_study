import { describe, expect, it } from "vitest";
import { JsonImportService } from "@/lib/backend";

const subject = { schemaVersion: 1, contentVersion: 1, id: "demo", slug: "demo", code: "DEMO", name: "Demo", description: "", language: "en", questionCount: 2, source: { file: "demo.json", pageCount: 1, note: "" }, dataQuality: { needsReviewCount: 0, duplicatePromptGroups: [[1, 2]] }, questions: [1, 2].map((number) => ({ id: `q${number}`, number, type: "single-choice", question: number === 1 ? "Same prompt" : " same   PROMPT ", options: [{ id: "a", text: "A" }, { id: "b", text: "B" }], correctAnswers: ["a"], explanation: null, source: { file: "demo", pages: [1] }, needsReview: false, reviewNotes: [] })) };

describe("JSON import", () => {
  const service = new JsonImportService();
  it("normalizes and reports duplicate prompts", () => { const report = service.validate(JSON.stringify(subject)); expect(report.valid).toBe(true); expect(report.duplicatePrompts).toEqual(["same prompt"]); expect(report.subject?.questions[0].correctAnswer).toBe("a"); });
  it("rejects malformed and oversized input", () => { expect(service.validate("{").errors[0].code).toBe("invalid-json"); expect(service.validate(JSON.stringify(subject), { maxBytes: 5 }).errors[0].code).toBe("too-large"); });
  it("rejects prototype-pollution keys", () => { const input = JSON.stringify(subject).replace('"description":""', '"description":"","__proto__":{}'); expect(service.validate(input).errors[0].code).toBe("unsafe-key"); });
  it("denies execution without an admin", async () => { await expect(service.import(JSON.stringify(subject), { dryRun: true })).rejects.toMatchObject({ code: "unauthorized" }); });
  it("allows an admin dry run without claiming persistence", async () => { const report = await service.import(JSON.stringify(subject), { dryRun: true, actor: { id: "admin", role: "admin" } }); expect(report.authorized).toBe(true); expect(report.persisted).toBe(false); expect(report.warnings.some((warning) => warning.code === "unavailable")).toBe(true); });
});
