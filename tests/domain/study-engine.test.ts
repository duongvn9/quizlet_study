import { describe, expect, it } from "vitest";
import data from "@/data/subjects/swd392.json";
import { subjectSchema } from "@/domain/subjects/schemas";
import { createProgress, createSession } from "@/domain/study/create-session";
import { answer, move } from "@/domain/study/reducer";
import { selectStats } from "@/domain/study/selectors";
import type { SubjectProgress } from "@/domain/study/types";

const subject = subjectSchema.parse(data);
let n = 0;
const deps = { id: () => `id-${n++}`, now: () => "2026-01-01T00:00:00.000Z", random: () => 0.5 };

function fresh(): SubjectProgress {
  const progress = createProgress(subject.id, subject.contentVersion, subject.questions);
  return { ...progress, activeSession: createSession(subject.id, subject.contentVersion, subject.questions, {}, deps) };
}

describe("study engine", () => {
  it("creates a source-ordered queue and a valid shuffled permutation", () => {
    const ordered = createSession(subject.id, subject.contentVersion, subject.questions, {}, deps);
    const shuffled = createSession(subject.id, subject.contentVersion, subject.questions, { shuffleQuestions: true }, deps);
    expect(ordered.queue).toHaveLength(249);
    expect(ordered.queue[0].questionId).toBe("swd392-001");
    expect(new Set(shuffled.queue.map((item) => item.questionId))).toEqual(new Set(subject.questions.map((question) => question.id)));
    expect(shuffled.queue).toHaveLength(subject.questionCount);
  });

  it("makes the first correct answer learning and inserts one retry", () => {
    const question = subject.questions[0];
    const progress = answer(fresh(), question, question.correctAnswer, deps);
    expect(progress.questionProgress[question.id]).toMatchObject({ status: "learning", correctStreak: 1 });
    expect(progress.activeSession?.queue[5]).toMatchObject({ questionId: question.id, reason: "retry", answered: false });
    expect(progress.activeSession?.queue.filter((item) => item.questionId === question.id)).toHaveLength(2);
  });

  it("masters on the second consecutive correct answer without another retry", () => {
    const question = subject.questions[0];
    let progress = answer(fresh(), question, question.correctAnswer, deps);
    progress = { ...progress, activeSession: { ...progress.activeSession!, currentIndex: 5, frontierIndex: 5 } };
    progress = answer(progress, question, question.correctAnswer, deps);
    expect(progress.questionProgress[question.id]).toMatchObject({ status: "mastered", correctStreak: 2, masteredAt: deps.now() });
    expect(progress.activeSession?.queue.filter((item) => item.questionId === question.id)).toHaveLength(2);
  });

  it("demotes mastery after an incorrect answer and schedules a retry", () => {
    const question = subject.questions[0];
    let progress = fresh();
    progress = { ...progress, questionProgress: { ...progress.questionProgress, [question.id]: { ...progress.questionProgress[question.id], status: "mastered", correctStreak: 2, masteredAt: deps.now() } } };
    const wrong = question.options.find((option) => option.id !== question.correctAnswer)!.id;
    progress = answer(progress, question, wrong, deps);
    expect(progress.questionProgress[question.id]).toMatchObject({ status: "learning", correctStreak: 0, masteredAt: null });
    expect(progress.activeSession?.queue.some((item) => item.reason === "retry" && item.questionId === question.id)).toBe(true);
  });

  it("records don't know with null selection, reset streak, and retry", () => {
    const question = subject.questions[0];
    let progress = fresh();
    progress = { ...progress, questionProgress: { ...progress.questionProgress, [question.id]: { ...progress.questionProgress[question.id], correctStreak: 1 } } };
    progress = answer(progress, question, null, deps);
    expect(progress.questionProgress[question.id]).toMatchObject({ lastSelectedOptionId: null, lastResult: "dont-know", correctStreak: 0 });
    expect(progress.activeSession?.queue[5].questionId).toBe(question.id);
    expect(selectStats(progress, 249).accuracy).toBe(0);
  });

  it.each([
    ["mismatched question", (progress: SubjectProgress) => progress, (progress: SubjectProgress) => answer(progress, subject.questions[1], subject.questions[1].correctAnswer, deps)],
    ["unknown option", (progress: SubjectProgress) => progress, (progress: SubjectProgress) => answer(progress, subject.questions[0], "missing", deps)],
    ["invalid index", (progress: SubjectProgress) => ({ ...progress, activeSession: { ...progress.activeSession!, currentIndex: 999 } }), (progress: SubjectProgress) => answer(progress, subject.questions[0], subject.questions[0].correctAnswer, deps)],
    ["missing progress question", (progress: SubjectProgress) => ({ ...progress, questionProgress: {} }), (progress: SubjectProgress) => answer(progress, subject.questions[0], subject.questions[0].correctAnswer, deps)],
    ["completed session", (progress: SubjectProgress) => ({ ...progress, activeSession: { ...progress.activeSession!, completedAt: deps.now() } }), (progress: SubjectProgress) => answer(progress, subject.questions[0], subject.questions[0].correctAnswer, deps)],
  ])("safely rejects %s", (_name, arrange, submit) => {
    const progress = arrange(fresh());
    expect(submit(progress)).toEqual(progress);
  });

  it("rejects an already answered item", () => {
    const question = subject.questions[0];
    const progress = answer(fresh(), question, question.correctAnswer, deps);
    expect(answer(progress, question, question.correctAnswer, deps)).toEqual(progress);
  });

  it("preserves history and blocks skipping an unanswered frontier", () => {
    const question = subject.questions[0];
    let progress = answer(fresh(), question, question.correctAnswer, deps);
    const attempts = progress.activeSession!.attempts;
    progress = move(progress, 1);
    expect(move(progress, 1)).toEqual(progress);
    progress = move(progress, -1);
    expect(progress.activeSession?.attempts).toEqual(attempts);
    expect(progress.activeSession?.queue[0].answered).toBe(true);
  });

  it("completes once only after every queue item is answered", () => {
    let progress = fresh();
    progress = { ...progress, activeSession: { ...progress.activeSession!, currentIndex: progress.activeSession!.queue.length - 1, frontierIndex: progress.activeSession!.queue.length - 1, queue: progress.activeSession!.queue.map((item) => ({ ...item, answered: true })) } };
    progress = move(progress, 1, deps.now());
    expect(progress.activeSession?.completedAt).toBe(deps.now());
    expect(progress.completedSessionCount).toBe(1);
    expect(move(progress, 1, deps.now()).completedSessionCount).toBe(1);
  });
});
