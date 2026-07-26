import { subjectSchema } from "@/domain/subjects/schemas";
import { BackendError } from "./errors";
import { canManageContent } from "./permissions";
import type { ImportIssue, ImportOptions, ImportReport, ImportRepository, ImportService } from "./types";

const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);
function unsafePath(value: unknown, path = "$", seen = new Set<object>()): string | null { if (!value || typeof value !== "object") return null; if (seen.has(value)) return null; seen.add(value); for (const key of Object.keys(value)) { if (FORBIDDEN_KEYS.has(key)) return `${path}.${key}`; const nested = unsafePath((value as Record<string, unknown>)[key], `${path}.${key}`, seen); if (nested) return nested; } return null; }
function issue(path: string, code: string, message: string): ImportIssue { return { path, code, message }; }
function normalizedPrompt(value: string): string { return value.trim().replace(/\s+/g, " ").toLocaleLowerCase(); }
function contentHash(input: string): string { let hash = 2166136261; for (let index = 0; index < input.length; index += 1) { hash ^= input.charCodeAt(index); hash = Math.imul(hash, 16777619); } return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`; }

export class JsonImportService implements ImportService {
  constructor(private readonly repository?: ImportRepository) {}
  validate(input: string, options: ImportOptions = {}): ImportReport {
    const bytes = new TextEncoder().encode(input).length;
    const report: ImportReport = { valid: false, authorized: true, persisted: false, idempotent: false, dryRun: options.dryRun ?? true, bytes, contentHash: contentHash(input), filename: options.filename, errors: [], warnings: [], duplicateQuestionIds: [], duplicateQuestionNumbers: [], duplicatePrompts: [], createdCount: 0, updatedCount: 0, skippedCount: 0 };
    if (bytes > (options.maxBytes ?? 2_000_000)) { report.errors.push(issue("$", "too-large", "Import exceeds size limit")); return report; }
    let parsed: unknown;
    try { parsed = JSON.parse(input); } catch { report.errors.push(issue("$", "invalid-json", "Input is not valid JSON")); return report; }
    const unsafe = unsafePath(parsed);
    if (unsafe) { report.errors.push(issue(unsafe, "unsafe-key", "Unsafe object key detected")); return report; }
    const result = subjectSchema.safeParse(parsed);
    if (!result.success) { report.errors.push(...result.error.issues.map((entry) => issue(entry.path.join("."), entry.code, entry.message))); return report; }
    const duplicate = <T>(items: T[]) => [...new Set(items.filter((item, index) => items.indexOf(item) !== index))];
    report.subject = result.data;
    report.duplicateQuestionIds = duplicate(result.data.questions.map((question) => question.id));
    report.duplicateQuestionNumbers = duplicate(result.data.questions.map((question) => question.number));
    report.duplicatePrompts = duplicate(result.data.questions.map((question) => normalizedPrompt(question.question)));
    if (report.duplicatePrompts.length) report.warnings.push(issue("questions", "duplicate-prompts", "Duplicate normalized prompts detected"));
    report.valid = true;
    return report;
  }
  async import(input: string, options: ImportOptions = {}): Promise<ImportReport> {
    const report = this.validate(input, { ...options, dryRun: options.dryRun ?? false });
    if (!canManageContent(options.actor ?? null)) { report.authorized = false; report.errors.push(issue("actor", "forbidden", "Administrator permission required")); report.valid = false; throw new BackendError(options.actor ? "forbidden" : "unauthorized", "Administrator permission required", report); }
    if (!report.valid || !report.subject) return report;
    if (!this.repository) { report.warnings.push(issue("repository", "unavailable", "Import persistence is not configured")); return report; }
    const transaction = await this.repository.begin();
    try {
      const result = await transaction.upsertSubject(report.subject, report.contentHash);
      report.idempotent = result.unchanged;
      report.skippedCount = result.unchanged ? report.subject.questions.length : 0;
      report.createdCount = result.created ? report.subject.questions.length : 0;
      report.updatedCount = !result.created && !result.unchanged ? report.subject.questions.length : 0;
      if (report.dryRun) await transaction.rollback(); else { await transaction.commit(); report.persisted = true; }
      return report;
    } catch (error) { await transaction.rollback(); throw new BackendError("unknown", "Import transaction failed", error); }
  }
}
