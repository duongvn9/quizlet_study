import { describe, expect, it } from "vitest";
import pmgData from "@/data/subjects/pmg201c.json";
import { adaptPmg201c } from "@/domain/subjects/pmg201c-adapter";
import { createProgress, createSession } from "@/domain/study/create-session";
import { answer } from "@/domain/study/reducer";
import { selectLearnCounters } from "@/domain/study/selectors";

const subject = adaptPmg201c(pmgData);
const question = subject.questions.find((item) => item.number === 90)!;
let id = 0;
const deps = { id: () => `pmg-${id++}`, now: () => "2026-08-05T00:00:00.000Z", random: () => 0.5 };

function fresh() {
  const progress = createProgress(subject.id, subject.contentVersion, subject.questions);
  const session = createSession(subject.id, subject.contentVersion, subject.questions, {}, deps);
  const currentIndex = session.queue.findIndex((item) => item.questionId === question.id);
  return { ...progress, activeSession: { ...session, currentIndex, frontierIndex: currentIndex } };
}

describe("PMG201c study domain", () => {
  it("requires the exact multiple-choice set", () => {
    const partial = answer(fresh(), question, question.correctAnswers.slice(0, 1), deps);
    expect(partial.activeSession?.attempts[0].result).toBe("incorrect");
    const extra = question.options.find((option) => !question.correctAnswers.includes(option.id))!.id;
    expect(answer(fresh(), question, [...question.correctAnswers, extra], deps).activeSession?.attempts[0].result).toBe("incorrect");
    const exact = answer(fresh(), question, [...question.correctAnswers].reverse(), deps);
    expect(exact.activeSession?.attempts[0]).toMatchObject({ selectedOptionIds: [...question.correctAnswers].reverse(), result: "correct" });
  });

  it("schedules one retry and counts duplicate queue instances once", () => {
    const progress = answer(fresh(), question, question.correctAnswers.slice(0, 1), deps);
    expect(progress.activeSession?.queue.filter((item) => item.questionId === question.id)).toHaveLength(2);
    expect(selectLearnCounters(progress, subject.questions.map((item) => item.id))).toMatchObject({ presentedCount: 90, total: 333 });
  });

  it("creates and resets canonical progress for all 333 questions", () => {
    const attempted = answer(fresh(), question, question.correctAnswers, deps);
    const reset = createProgress(subject.id, subject.contentVersion, subject.questions);
    expect(Object.keys(attempted.questionProgress)).toHaveLength(333);
    expect(attempted.lifetimeAttempts).toBe(1);
    expect(reset).toMatchObject({ lifetimeAttempts: 0, activeSession: null, completedSessionCount: 0 });
    expect(Object.keys(reset.questionProgress)).toHaveLength(333);
    expect(Object.values(reset.questionProgress).every((item) => item.status === "new" && item.totalAttempts === 0)).toBe(true);
  });
});
