import { describe, expect, it } from "vitest";
import data from "@/data/subjects/swd392.json";
import { subjectSchema } from "@/domain/subjects/schemas";
import { createProgress, createSession } from "@/domain/study/create-session";
import { answer, move, replaceAnswer } from "@/domain/study/reducer";
import { findResumeQueueIndex, resumeProgress } from "@/domain/study/resume";
import { selectLearnCounters, selectStats } from "@/domain/study/selectors";
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

  it("makes the first correct answer learning without inserting a retry", () => {
    const question = subject.questions[0];
    const progress = answer(fresh(), question, question.correctAnswer, deps);
    expect(progress.questionProgress[question.id]).toMatchObject({ status: "learning", correctStreak: 1 });
    expect(progress.activeSession?.queue.filter((item) => item.questionId === question.id)).toHaveLength(1);
  });

  it("continues to question 6 after five correct answers", () => {
    let progress = fresh();
    for (let index = 0; index < 5; index += 1) {
      const question = subject.questions[index];
      progress = answer(progress, question, question.correctAnswer, deps);
      progress = move(progress, 1, deps.now());
    }
    expect(progress.activeSession?.queue[progress.activeSession.currentIndex]).toMatchObject({ questionId: subject.questions[5].id, reason: "initial" });
    expect(progress.activeSession?.queue).toHaveLength(subject.questionCount);
  });

  it("retries only an incorrect question after its five-question block", () => {
    let progress = fresh();
    for (let index = 0; index < 5; index += 1) {
      const question = subject.questions[index];
      const selected = index === 1 ? question.options.find((option) => option.id !== question.correctAnswer)!.id : question.correctAnswer;
      progress = answer(progress, question, selected, deps);
      progress = move(progress, 1, deps.now());
    }
    expect(progress.activeSession?.queue[progress.activeSession.currentIndex]).toMatchObject({ questionId: subject.questions[1].id, reason: "retry" });
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
    expect(progress.questionProgress[question.id]).toMatchObject({ lastSelectedOptionIds: null, lastResult: "dont-know", correctStreak: 0 });
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

  describe("replaceAnswer", () => {
    it.each([
      ["incorrect", (question: typeof subject.questions[number]) => question.options.find((option) => option.id !== question.correctAnswer)!.id, "incorrect"],
      ["dont-know", () => null, "dont-know"],
    ] as const)("replaces correct with %s without changing identity, totals, or queue", (_name, selection, expected) => {
      const question = subject.questions[0];
      const answered = answer(fresh(), question, question.correctAnswer, deps);
      const attempt = answered.activeSession!.attempts[0];
      const queue = answered.activeSession!.queue;
      const replaced = replaceAnswer(answered, question, selection(question), "2026-01-02T00:00:00.000Z");
      expect(replaced.activeSession?.attempts).toHaveLength(1);
      expect(replaced.activeSession?.attempts[0]).toEqual({ ...attempt, selectedOptionIds: selection(question) === null ? null : [selection(question)!], result: expected });
      expect(replaced.activeSession?.queue).toBe(queue);
      expect(replaced.lifetimeAttempts).toBe(answered.lifetimeAttempts);
      expect(replaced.questionProgress[question.id]).toMatchObject({ totalAttempts: 1, correctCount: 0, incorrectCount: expected === "incorrect" ? 1 : 0, dontKnowCount: expected === "dont-know" ? 1 : 0, lastSelectedOptionIds: selection(question) === null ? null : [selection(question)!], lastResult: expected, correctStreak: 0 });
    });

    it("replaces wrong with correct while retaining its scheduled retry", () => {
      const question = subject.questions[0];
      const wrong = question.options.find((option) => option.id !== question.correctAnswer)!.id;
      const answered = answer(fresh(), question, wrong, deps);
      const queue = answered.activeSession!.queue;
      const replaced = replaceAnswer(answered, question, question.correctAnswer, "later");
      expect(replaced.activeSession?.queue).toBe(queue);
      expect(replaced.activeSession?.queue.some((item) => item.reason === "retry" && item.questionId === question.id)).toBe(true);
      expect(replaced.questionProgress[question.id]).toMatchObject({ correctCount: 1, incorrectCount: 0, lastResult: "correct", correctStreak: 1 });
    });

    it("recalculates streak and mastery from the inferable pre-session baseline", () => {
      const question = subject.questions[0];
      let progress = fresh();
      progress = { ...progress, questionProgress: { ...progress.questionProgress, [question.id]: { ...progress.questionProgress[question.id], status: "learning", totalAttempts: 3, correctCount: 3, correctStreak: 3, firstSeenAt: "before", lastSeenAt: "before" } } };
      progress = answer(progress, question, question.correctAnswer, deps);
      expect(progress.questionProgress[question.id]).toMatchObject({ status: "mastered", correctStreak: 4 });
      const wrong = question.options.find((option) => option.id !== question.correctAnswer)!.id;
      const replaced = replaceAnswer(progress, question, wrong, "later");
      expect(replaced.questionProgress[question.id]).toMatchObject({ status: "learning", correctStreak: 0, masteredAt: null, firstSeenAt: "before", totalAttempts: 4 });
      const restored = replaceAnswer(replaced, question, question.correctAnswer, "latest");
      expect(restored.questionProgress[question.id]).toMatchObject({ status: "learning", correctStreak: 1, masteredAt: null, lastSeenAt: deps.now() });
    });

    it("rejects invalid replacements and duplicate attempt state", () => {
      const question = subject.questions[0];
      const answered = answer(fresh(), question, question.correctAnswer, deps);
      expect(replaceAnswer(answered, subject.questions[1], subject.questions[1].correctAnswer)).toBe(answered);
      expect(replaceAnswer(answered, question, "missing")).toBe(answered);
      expect(replaceAnswer(answered, question, question.correctAnswer)).toBe(answered);
      const duplicate = { ...answered, activeSession: { ...answered.activeSession!, attempts: [...answered.activeSession!.attempts, answered.activeSession!.attempts[0]] } };
      expect(replaceAnswer(duplicate, question, null)).toBe(duplicate);
    });
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

  describe("resume selection", () => {
    const arrangedSession = (answered: boolean[], currentIndex: number) => ({ ...fresh().activeSession!, currentIndex, frontierIndex: Math.max(0, Math.min(currentIndex, answered.length - 1)), queue: fresh().activeSession!.queue.slice(0, answered.length).map((item, index) => ({ ...item, answered: answered[index] })) });

    it("keeps the current unanswered item", () => expect(findResumeQueueIndex(arrangedSession([false, false], 0))).toBe(0));
    it("selects the next item after an answered current item", () => expect(findResumeQueueIndex(arrangedSession([true, false], 0))).toBe(1));
    it("selects an unanswered retry instance", () => {
      const session = arrangedSession([true, false], 0);
      session.queue[1] = { ...session.queue[1], reason: "retry" };
      expect(findResumeQueueIndex(session)).toBe(1);
    });
    it("wraps to an earlier unanswered item", () => expect(findResumeQueueIndex(arrangedSession([false, true, true], 2))).toBe(0));
    it("returns null when all items are answered", () => expect(findResumeQueueIndex(arrangedSession([true, true], 1))).toBeNull());
    it("handles an out-of-range current index safely", () => expect(findResumeQueueIndex(arrangedSession([true, false], 99))).toBe(1));
    it("does not mutate the session", () => {
      const session = arrangedSession([true, false], 0);
      const snapshot = structuredClone(session);
      findResumeQueueIndex(session);
      expect(session).toEqual(snapshot);
    });
    it("does not reorder a shuffled queue", () => {
      const session = arrangedSession([true, false, true], 0);
      session.queue = [session.queue[2], session.queue[0], session.queue[1]];
      const ids = session.queue.map((item) => item.instanceId);
      findResumeQueueIndex(session);
      expect(session.queue.map((item) => item.instanceId)).toEqual(ids);
    });
  });

  it("resumes without changing attempts, mastery, streak, or queue order", () => {
    const progress = fresh();
    const questionId = subject.questions[0].id;
    const arranged = { ...progress, questionProgress: { ...progress.questionProgress, [questionId]: { ...progress.questionProgress[questionId], status: "mastered" as const, correctStreak: 3 } }, activeSession: { ...progress.activeSession!, currentIndex: 0, queue: progress.activeSession!.queue.map((item, index) => ({ ...item, answered: index === 0 })) } };
    const attempts = arranged.activeSession!.attempts;
    const questionProgress = arranged.questionProgress;
    const queue = arranged.activeSession!.queue;
    const resumed = resumeProgress(arranged, deps.now());
    expect(resumed.activeSession?.currentIndex).toBe(1);
    expect(resumed.activeSession?.attempts).toBe(attempts);
    expect(resumed.questionProgress).toBe(questionProgress);
    expect(resumed.questionProgress[questionId]).toMatchObject({ status: "mastered", correctStreak: 3 });
    expect(resumed.activeSession?.queue).toBe(queue);
  });

  it("completes answered and empty hydrated sessions exactly once", () => {
    for (const empty of [false, true]) {
      const progress = fresh();
      const arranged = { ...progress, activeSession: { ...progress.activeSession!, queue: empty ? [] : progress.activeSession!.queue.map((item) => ({ ...item, answered: true })), currentIndex: 0, frontierIndex: 0 } };
      const completed = resumeProgress(arranged, deps.now());
      expect(completed.activeSession?.completedAt).toBe(deps.now());
      expect(completed.completedSessionCount).toBe(1);
      expect(resumeProgress(completed, "later")).toBe(completed);
      expect(arranged.activeSession?.completedAt).toBeNull();
    }
  });

  describe("Learn counters", () => {
    const ids = subject.questions.map((question) => question.id);
    const counters = (progress: SubjectProgress | null, canonical = ids) => selectLearnCounters(progress, canonical);

    it("is safe for empty progress", () => expect(counters(null)).toEqual({ presentedCount: 0, masteredCount: 0, total: 249, percentage: 0 }));
    it("includes the newly presented first item", () => expect(counters(fresh()).presentedCount).toBe(1));
    it("counts distinct canonical IDs through the highest frontier", () => {
      const progress = fresh();
      const arranged = { ...progress, activeSession: { ...progress.activeSession!, currentIndex: 1, frontierIndex: 3 } };
      expect(counters(arranged).presentedCount).toBe(4);
    });
    it("is backward stable", () => {
      const progress = fresh();
      const arranged = { ...progress, activeSession: { ...progress.activeSession!, currentIndex: 1, frontierIndex: 4 } };
      expect(counters(arranged).presentedCount).toBe(5);
    });
    it("uses current when it is beyond a stale persisted frontier", () => {
      const progress = fresh();
      const arranged = { ...progress, activeSession: { ...progress.activeSession!, currentIndex: 2, frontierIndex: 0 } };
      expect(counters(arranged).presentedCount).toBe(3);
    });
    it("counts retry duplicates once", () => {
      const progress = fresh();
      const duplicate = { ...progress.activeSession!.queue[0], instanceId: "retry", reason: "retry" as const };
      const arranged = { ...progress, activeSession: { ...progress.activeSession!, queue: [progress.activeSession!.queue[0], duplicate, ...progress.activeSession!.queue.slice(1)], currentIndex: 2, frontierIndex: 2 } };
      expect(counters(arranged).presentedCount).toBe(2);
    });
    it("is reload stable", () => {
      const progress = fresh();
      const arranged = { ...progress, activeSession: { ...progress.activeSession!, currentIndex: 4, frontierIndex: 4 } };
      expect(counters(structuredClone(arranged))).toEqual(counters(arranged));
    });
    it("ignores malformed and noncanonical queue IDs", () => {
      const progress = fresh();
      const arranged = { ...progress, activeSession: { ...progress.activeSession!, queue: [{ ...progress.activeSession!.queue[0], questionId: "missing" }], currentIndex: 99, frontierIndex: 99 } };
      expect(counters(arranged).presentedCount).toBe(0);
    });
    it("handles a small subject", () => expect(counters(fresh(), ids.slice(0, 2))).toMatchObject({ presentedCount: 1, total: 2 }));
    it("clamps presented and mastered counts to canonical total", () => {
      const progress = fresh();
      const canonical = ids.slice(0, 2);
      const extra = { ...progress.questionProgress, extra: { ...progress.questionProgress[ids[0]], questionId: "extra", status: "mastered" as const }, [ids[0]]: { ...progress.questionProgress[ids[0]], status: "mastered" as const }, [ids[1]]: { ...progress.questionProgress[ids[1]], status: "mastered" as const } };
      const arranged = { ...progress, questionProgress: extra, activeSession: { ...progress.activeSession!, queue: [...progress.activeSession!.queue, ...progress.activeSession!.queue], currentIndex: 999, frontierIndex: 999 } };
      expect(counters(arranged, canonical)).toMatchObject({ presentedCount: 2, masteredCount: 2, total: 2 });
    });
  });
});
