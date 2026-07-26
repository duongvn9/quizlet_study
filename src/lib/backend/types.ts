import type { SubjectProgress } from "@/domain/study/types";
import type { Question, Subject } from "@/domain/subjects/types";

export type UserRole = "guest" | "user" | "admin";
export interface UserIdentity { id: string; email?: string; displayName?: string; role: UserRole }
export interface UserProfile extends UserIdentity { createdAt: string; updatedAt: string }
export interface AuthCredentials { email: string; password: string; displayName?: string }
export interface AuthState { user: UserIdentity | null; loading: boolean; error: string | null }
export interface ProgressRecord { ownerId: string; subjectId: string; progress: SubjectProgress; updatedAt: string; revision: number }
export interface ImportOptions { dryRun?: boolean; maxBytes?: number; actor?: UserIdentity | null; filename?: string }
export interface ImportIssue { path: string; code: string; message: string }
export interface ImportReport { valid: boolean; authorized: boolean; persisted: boolean; idempotent: boolean; dryRun: boolean; bytes: number; contentHash: string; filename?: string; subject?: Subject; errors: ImportIssue[]; warnings: ImportIssue[]; duplicateQuestionIds: string[]; duplicateQuestionNumbers: number[]; duplicatePrompts: string[]; createdCount: number; updatedCount: number; skippedCount: number }
export interface AuthService { signUp(credentials: AuthCredentials): Promise<AuthState>; signIn(credentials: AuthCredentials): Promise<AuthState>; signOut(): Promise<AuthState>; restoreSession(): Promise<AuthState>; currentUser(): Promise<AuthState> }
export interface UserRepository { get(id: string): Promise<UserProfile | null>; upsert(profile: UserProfile): Promise<UserProfile> }
export interface SubjectRepository { list(): Promise<Subject[]>; getById(id: string): Promise<Subject | null>; getBySlug(slug: string): Promise<Subject | null>; upsert(subject: Subject): Promise<Subject>; remove(id: string): Promise<void> }
export interface QuestionSetRepository { list(subjectId: string): Promise<Question[]>; replace(subjectId: string, questions: Question[]): Promise<void> }
export interface ProgressRepository { get(ownerId: string, subjectId: string, contentVersion?: number): Promise<ProgressRecord | null>; save(record: ProgressRecord): Promise<ProgressRecord>; clear(ownerId: string, subjectId: string): Promise<void> }
export interface ImportTransaction { upsertSubject(subject: Subject, contentHash: string): Promise<{ subject: Subject; created: boolean; unchanged: boolean }>; commit(): Promise<void>; rollback(): Promise<void> }
export interface ImportRepository { begin(): Promise<ImportTransaction> }
export interface ImportService { validate(input: string, options?: ImportOptions): ImportReport; import(input: string, options?: ImportOptions): Promise<ImportReport> }
