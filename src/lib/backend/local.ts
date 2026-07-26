import type { Subject } from "@/domain/subjects/types";
import type { AuthCredentials, AuthService, AuthState, QuestionSetRepository, SubjectRepository, UserIdentity, UserProfile, UserRepository } from "./types";

const guest: UserIdentity = { id: "guest", role: "guest" };

export class LocalAuthService implements AuthService {
  private state: AuthState = { user: guest, loading: false, error: null };
  async signUp(credentials: AuthCredentials): Promise<AuthState> { void credentials; return { ...this.state, error: "Authentication is disabled" }; }
  async signIn(credentials: AuthCredentials): Promise<AuthState> { void credentials; return { ...this.state, error: "Authentication is disabled" }; }
  async signOut(): Promise<AuthState> { this.state = { user: guest, loading: false, error: null }; return this.state; }
  async restoreSession(): Promise<AuthState> { return this.state; }
  async currentUser(): Promise<AuthState> { return this.state; }
}

export class MemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, UserProfile>();
  async get(id: string): Promise<UserProfile | null> { return this.users.get(id) ?? null; }
  async upsert(profile: UserProfile): Promise<UserProfile> { this.users.set(profile.id, profile); return profile; }
}

export class MemorySubjectRepository implements SubjectRepository {
  private readonly subjects = new Map<string, Subject>();
  async list(): Promise<Subject[]> { return [...this.subjects.values()]; }
  async getById(id: string): Promise<Subject | null> { return this.subjects.get(id) ?? null; }
  async getBySlug(slug: string): Promise<Subject | null> { return [...this.subjects.values()].find((subject) => subject.slug === slug) ?? null; }
  async upsert(subject: Subject): Promise<Subject> { this.subjects.set(subject.id, subject); return subject; }
  async remove(id: string): Promise<void> { this.subjects.delete(id); }
}

export class MemoryQuestionSetRepository implements QuestionSetRepository {
  private readonly questions = new Map<string, Subject["questions"]>();
  async list(subjectId: string): Promise<Subject["questions"]> { return this.questions.get(subjectId) ?? []; }
  async replace(subjectId: string, questions: Subject["questions"]): Promise<void> { this.questions.set(subjectId, questions); }
}
