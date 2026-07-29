import type { Question } from "@/domain/subjects/types";
import type { QuestionProgress } from "@/domain/study/types";
import type { TestDependencies, TestSession, TestSettings } from "./types";

export const defaultTestCount = (total: number) => Math.min(20, total);
export const validateTestCount = (value: number, total: number) => Number.isInteger(value) && value >= 1 && value <= total;

function shuffled<T>(values: readonly T[], random: () => number) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index--) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export function eligibleQuestions(questions: readonly Question[], pool: TestSettings["pool"], progress?: Record<string, QuestionProgress>) {
  const active = questions.filter((question) => !question.disabled);
  return pool === "all" ? active : active.filter((question) => progress?.[question.id]?.status !== "mastered");
}

export function createTestSession(subjectId: string, contentVersion: number, questions: readonly Question[], settings: TestSettings, dependencies: TestDependencies, progress?: Record<string, QuestionProgress>): TestSession {
  const pool = eligibleQuestions(questions, settings.pool, progress);
  const selected = (settings.shuffleQuestions ? shuffled(pool, dependencies.random) : pool).slice(0, Math.min(settings.count, pool.length));
  const optionOrders = Object.fromEntries(selected.map((question) => [question.id, (settings.shuffleOptions ? shuffled(question.options, dependencies.random) : [...question.options]).map((option) => option.id)]));
  const now = dependencies.now();
  return { schemaVersion: 1, subjectId, subjectContentVersion: contentVersion, sessionId: dependencies.id(), status: "active", currentIndex: 0, settings: { ...settings, count: selected.length }, questionIds: selected.map((question) => question.id), optionOrders, responses: {}, createdAt: now, updatedAt: now, submittedAt: null, score: null };
}

export function createTestFromPool(subjectId: string, contentVersion: number, pool: readonly Question[], settings: TestSettings, dependencies: TestDependencies) {
  return createTestSession(subjectId, contentVersion, pool, { ...settings, pool: "all" }, dependencies);
}
