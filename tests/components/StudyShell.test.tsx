import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import data from "@/data/subjects/swd392.json";
import { subjectSchema } from "@/domain/subjects/schemas";
import { StudyShell } from "@/components/study/StudyShell";
import { audioMocks } from "../setup";
import { storage } from "@/lib/storage/local-study-storage";
import { createProgress, createSession } from "@/domain/study/create-session";
import { answer, move } from "@/domain/study/reducer";

const subject = subjectSchema.parse(data);
const first = subject.questions[0];
const correctIndex = first.options.findIndex((option) => option.id === first.correctAnswer);
const wrongIndex = first.options.findIndex((option) => option.id !== first.correctAnswer);
const explained = subject.questions.find((question) => question.explanation)!;
const explainedSubject = { ...subject, questions: [explained, ...subject.questions.filter((question) => question.id !== explained.id)] };

async function renderStudy(questionNumber = 1) {
  render(<StudyShell subject={subject} />);
  await screen.findByText(`Câu ${questionNumber}`);
}

describe("StudyShell interactions and sound", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders dynamic options and click sends the correct option", async () => {
    await renderStudy();
    const options = within(document.querySelector(".options")!).getAllByRole("button");
    expect(options).toHaveLength(first.options.length);
    fireEvent.click(options[correctIndex]);
    expect(await screen.findByText("Chính xác")).toBeVisible();
    expect(options[correctIndex]).toHaveClass("correct");
    expect(options.every((option) => option.hasAttribute("disabled"))).toBe(true);
  });

  it.each(["correct", "incorrect", "dont-know"])("shows an explanation after a %s answer", async (result) => {
    render(<StudyShell subject={explainedSubject} />);
    await screen.findByText(`Câu ${explained.number}`);
    expect(screen.queryByText("Giải thích")).not.toBeInTheDocument();
    if (result === "dont-know") {
      fireEvent.click(screen.getByRole("button", { name: "Không biết" }));
    } else {
      const index = explained.options.findIndex((option) => result === "correct" ? option.id === explained.correctAnswer : option.id !== explained.correctAnswer);
      fireEvent.click(within(document.querySelector(".options")!).getAllByRole("button")[index]);
    }
    expect(await screen.findByText("Giải thích")).toBeVisible();
    expect(screen.getByText(explained.explanation!)).toBeVisible();
  });

  it("renders no explanation panel when the answered question has none", async () => {
    await renderStudy();
    fireEvent.click(within(document.querySelector(".options")!).getAllByRole("button")[correctIndex]);
    expect(await screen.findByText("Chính xác")).toBeVisible();
    expect(screen.queryByText("Giải thích")).not.toBeInTheDocument();
  });

  it("plays once for a correct click", async () => {
    await renderStudy();
    fireEvent.click(within(document.querySelector(".options")!).getAllByRole("button")[correctIndex]);
    expect(audioMocks.play).toHaveBeenCalledTimes(1);
  });

  it("does not play for an incorrect answer", async () => {
    await renderStudy();
    const options = within(document.querySelector(".options")!).getAllByRole("button");
    fireEvent.click(options[wrongIndex]);
    await waitFor(() => expect(options[wrongIndex]).toHaveClass("wrong"));
    expect(options[correctIndex]).toHaveClass("correct");
    expect(audioMocks.play).not.toHaveBeenCalled();
  });

  it("does not play for I don't know", async () => {
    await renderStudy();
    fireEvent.click(screen.getByRole("button", { name: "Không biết" }));
    expect(await screen.findByText("Hãy ghi nhớ đáp án đúng")).toBeVisible();
    expect(audioMocks.play).not.toHaveBeenCalled();
  });

  it("maps keyboard numbers to display order and Space continues", async () => {
    await renderStudy();
    fireEvent.keyDown(window, { key: String(correctIndex + 1) });
    expect(await screen.findByText("Chính xác")).toBeVisible();
    fireEvent.keyDown(window, { key: " ", code: "Space" });
    expect(await screen.findByText("Câu 2")).toBeVisible();
  });

  it("ignores keyboard shortcuts from controls", async () => {
    await renderStudy();
    const sound = screen.getByRole("button", { name: "Âm thanh" });
    fireEvent.keyDown(sound, { key: String(correctIndex + 1) });
    expect(screen.queryByText("Chính xác")).not.toBeInTheDocument();
  });

  it("does not play when viewing answered history", async () => {
    let progress = createProgress(subject.id, subject.contentVersion, subject.questions);
    progress = { ...progress, activeSession: createSession(subject.id, subject.contentVersion, subject.questions) };
    progress = answer(progress, first, first.correctAnswer);
    progress = move(progress, 1);
    storage.save(progress);
    await renderStudy(2);
    fireEvent.click(screen.getByRole("button", { name: "Trước" }));
    await screen.findByText("Câu 1");
    expect(audioMocks.play).not.toHaveBeenCalled();
  });

  it("restores an answered item neutrally without replaying transient details", async () => {
    let progress = createProgress(subject.id, subject.contentVersion, explainedSubject.questions);
    progress = { ...progress, activeSession: createSession(subject.id, subject.contentVersion, explainedSubject.questions) };
    progress = answer(progress, explained, explained.correctAnswer);
    storage.save(progress);
    render(<StudyShell subject={explainedSubject} />);
    await screen.findByText("Câu 1");
    fireEvent.click(screen.getByRole("button", { name: "Trước" }));
    expect(await screen.findByText(/Bạn đã trả lời lượt này/)).toBeVisible();
    expect(screen.queryByText("Chính xác")).not.toBeInTheDocument();
    expect(screen.queryByText("Giải thích")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Không biết" })).toBeEnabled();
    expect(within(document.querySelector(".options")!).getAllByRole("button").every((option) => !option.hasAttribute("disabled"))).toBe(true);
    expect(audioMocks.play).not.toHaveBeenCalled();
  });

  it("replaces a historical answer with keyboard feedback, persistence, and correct audio", async () => {
    let progress = createProgress(subject.id, subject.contentVersion, subject.questions);
    progress = { ...progress, activeSession: createSession(subject.id, subject.contentVersion, subject.questions) };
    progress = answer(progress, first, first.options[wrongIndex].id);
    progress = move(progress, 1);
    const oldAttempt = progress.activeSession!.attempts[0];
    const queue = progress.activeSession!.queue;
    storage.save(progress);
    await renderStudy(2);
    fireEvent.click(screen.getByRole("button", { name: "Trước" }));
    expect(await screen.findByText(/Chọn lại sẽ thay thế kết quả trước đó/)).toBeVisible();
    const options = within(document.querySelector(".options")!).getAllByRole("button");
    expect(options.every((option) => !option.hasAttribute("disabled"))).toBe(true);
    fireEvent.keyDown(window, { key: String(correctIndex + 1) });
    expect(await screen.findByText("Chính xác")).toBeVisible();
    expect(screen.queryByText(/Chọn lại sẽ thay thế/)).not.toBeInTheDocument();
    expect(options.every((option) => option.hasAttribute("disabled"))).toBe(true);
    expect(audioMocks.play).toHaveBeenCalledTimes(1);
    const loaded = storage.load(subject.id, subject.contentVersion);
    expect(loaded).toMatchObject({ status: "loaded", progress: { lifetimeAttempts: 1, activeSession: { queue, attempts: [{ ...oldAttempt, selectedOptionId: first.correctAnswer, result: "correct" }] } } });
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));
    fireEvent.click(screen.getByRole("button", { name: "Trước" }));
    expect(await screen.findByText(/Chọn lại sẽ thay thế kết quả trước đó/)).toBeVisible();
    expect(screen.queryByText("Chính xác")).not.toBeInTheDocument();
    expect(audioMocks.play).toHaveBeenCalledTimes(1);
  });

  it("does not play when a historical correct answer is replaced with another correct selection", async () => {
    let progress = createProgress(subject.id, subject.contentVersion, subject.questions);
    progress = { ...progress, activeSession: createSession(subject.id, subject.contentVersion, subject.questions) };
    progress = answer(progress, first, first.correctAnswer);
    progress = move(progress, 1);
    storage.save(progress);
    await renderStudy(2);
    fireEvent.click(screen.getByRole("button", { name: "Trước" }));
    fireEvent.keyDown(window, { key: String(correctIndex + 1) });
    expect(screen.queryByText("Chính xác")).not.toBeInTheDocument();
    expect(audioMocks.play).not.toHaveBeenCalled();
  });

  it("clears reveal after navigation and keeps a retry instance answerable", async () => {
    await renderStudy();
    fireEvent.click(screen.getByRole("button", { name: "Không biết" }));
    expect(await screen.findByText("Hãy ghi nhớ đáp án đúng")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));
    fireEvent.click(screen.getByRole("button", { name: "Trước" }));
    expect(await screen.findByText(/Bạn đã trả lời lượt này/)).toBeVisible();
    expect(screen.queryByText("Hãy ghi nhớ đáp án đúng")).not.toBeInTheDocument();
    for (let index = 0; index < 4; index += 1) {
      fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));
      fireEvent.click(within(document.querySelector(".options")!).getAllByRole("button")[0]);
    }
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));
    expect(await screen.findByText("Câu 1")).toBeVisible();
    expect(screen.getByRole("button", { name: "Không biết" })).toBeEnabled();
  });

  it("does not play correct answers when sound is disabled", async () => {
    localStorage.setItem("study-flow:v1:sound", "false");
    await renderStudy();
    await waitFor(() => expect(screen.getByRole("button", { name: "Âm thanh" })).toHaveAttribute("aria-pressed", "false"));
    fireEvent.click(within(document.querySelector(".options")!).getAllByRole("button")[correctIndex]);
    expect(audioMocks.play).not.toHaveBeenCalled();
  });

  it("opens settings and persists next-session shuffle semantics", async () => {
    await renderStudy();
    fireEvent.click(screen.getByRole("button", { name: "Cài đặt" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("checkbox", { name: "Xáo trộn câu hỏi" }));
    expect(JSON.parse(localStorage.getItem("study-flow:v1:settings")!)).toMatchObject({ shuffleQuestions: true });
    expect(screen.getByText(/Áp dụng khi tạo phiên học mới/)).toBeVisible();
  });

  it("restores focus, closes with Escape, traps Tab, and exposes progress semantics", async () => {
    await renderStudy();
    const trigger = screen.getByRole("button", { name: "Cài đặt" });
    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog");
    const controls = within(dialog).getAllByRole("button");
    controls.at(-1)!.focus();
    fireEvent.keyDown(window, { key: "Tab" });
    expect(within(dialog).getAllByRole("checkbox")[0]).toHaveFocus();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(screen.getByText("Đã xem 1 / 249 câu · Đã thuộc 0 / 249 câu")).toBeVisible();
    expect(screen.getByRole("progressbar", { name: "Tiến độ câu hỏi" })).toHaveAttribute("aria-valuenow", String(Math.round(1 / subject.questionCount * 100)));
  });

  it("keeps feedback in an aria-live region", async () => {
    await renderStudy();
    fireEvent.click(within(document.querySelector(".options")!).getAllByRole("button")[correctIndex]);
    expect((await screen.findByText("Chính xác")).closest("[aria-live=polite]")).toBeInTheDocument();
  });

  it("reloads an unanswered current item without changing queue, option shuffle, mastery, or streak", async () => {
    let saved = createProgress(subject.id, subject.contentVersion, subject.questions);
    const session = createSession(subject.id, subject.contentVersion, subject.questions, { shuffleQuestions: true, shuffleOptions: true }, { id: (() => { let id = 0; return () => `shuffle-${id++}`; })(), now: () => "2026-01-01T00:00:00.000Z", random: () => 0.25 });
    const questionId = session.queue[0].questionId;
    saved = { ...saved, questionProgress: { ...saved.questionProgress, [questionId]: { ...saved.questionProgress[questionId], status: "mastered", correctStreak: 4 } }, activeSession: session };
    storage.save(saved);
    render(<StudyShell subject={subject} />);
    await screen.findByText(`Câu ${subject.questions.find((question) => question.id === questionId)!.number}`);
    const loaded = storage.load(subject.id, subject.contentVersion);
    expect(loaded).toMatchObject({ status: "loaded", progress: { activeSession: { currentIndex: 0, queue: session.queue, settings: { shuffleQuestions: true, shuffleOptions: true } }, questionProgress: { [questionId]: { status: "mastered", correctStreak: 4 } } } });
    expect(within(document.querySelector(".options")!).getAllByRole("button").map((button) => button.textContent)).toEqual([...subject.questions.find((question) => question.id === questionId)!.options].sort((left, right) => {
      const rank = (optionId: string) => Array.from(`${session.queue[0].instanceId}:${optionId}`).reduce((hash, character) => Math.imul(hash ^ character.charCodeAt(0), 16777619), 2166136261) >>> 0;
      return rank(left.id) - rank(right.id);
    }).map((option, index) => `${index + 1}${option.text}`));
  });

  it("reloads an answered current item at the next unanswered item", async () => {
    let saved = createProgress(subject.id, subject.contentVersion, subject.questions);
    saved = { ...saved, activeSession: createSession(subject.id, subject.contentVersion, subject.questions) };
    saved = answer(saved, first, first.correctAnswer);
    const queue = saved.activeSession!.queue;
    storage.save(saved);
    await renderStudy(2);
    expect(storage.load(subject.id, subject.contentVersion)).toMatchObject({ status: "loaded", progress: { activeSession: { currentIndex: 1, queue } } });
    expect(screen.queryByText("Chính xác")).not.toBeInTheDocument();
  });

  it("shows completion instead of loading when hydrated items are all answered", async () => {
    let saved = createProgress(subject.id, subject.contentVersion, subject.questions);
    saved = { ...saved, activeSession: createSession(subject.id, subject.contentVersion, subject.questions) };
    saved = { ...saved, activeSession: { ...saved.activeSession!, queue: saved.activeSession!.queue.map((item) => ({ ...item, answered: true })), attempts: saved.activeSession!.queue.map((item, index) => ({ id: `attempt-${index}`, queueInstanceId: item.instanceId, questionId: item.questionId, selectedOptionId: subject.questions.find((question) => question.id === item.questionId)!.correctAnswer, result: "correct" as const, answeredAt: "2026-01-01T00:00:00.000Z" })) } };
    storage.save(saved);
    render(<StudyShell subject={subject} />);
    expect(await screen.findByRole("heading", { name: "Hoàn thành phiên học" })).toBeVisible();
    expect(screen.queryByText(/Đang khôi phục/)).not.toBeInTheDocument();
  });

  it("continues the same active session", async () => {
    let saved = createProgress(subject.id, subject.contentVersion, subject.questions);
    saved = { ...saved, activeSession: createSession(subject.id, subject.contentVersion, subject.questions) };
    saved = answer(saved, first, first.correctAnswer);
    saved = move(saved, 1);
    storage.save(saved);
    await renderStudy(2);
    expect(storage.load(subject.id, subject.contentVersion)).toMatchObject({ status: "loaded", progress: { activeSession: { sessionId: saved.activeSession?.sessionId, currentIndex: 1 } } });
  });

  it("restarts with a fresh session while preserving long-lived progress", async () => {
    let saved = createProgress(subject.id, subject.contentVersion, subject.questions);
    saved = { ...saved, activeSession: createSession(subject.id, subject.contentVersion, subject.questions) };
    saved = answer(saved, first, first.correctAnswer);
    saved = move(saved, 1);
    storage.save(saved);
    const previousSessionId = saved.activeSession!.sessionId;
    window.history.replaceState({}, "", "/subjects/swd392/learn?restart=1");
    vi.spyOn(window, "confirm").mockReturnValue(true);
    await renderStudy();
    const loaded = storage.load(subject.id, subject.contentVersion);
    expect(loaded.status).toBe("loaded");
    if (loaded.status !== "loaded") return;
    expect(loaded.progress.activeSession?.sessionId).not.toBe(previousSessionId);
    expect(loaded.progress.activeSession?.currentIndex).toBe(0);
    expect(loaded.progress.activeSession?.queue).toHaveLength(subject.questionCount);
    expect(loaded.progress.questionProgress[first.id].totalAttempts).toBe(1);
    expect(window.location.search).toBe("");
  });

  it("preserves the active session when restart confirmation is canceled", async () => {
    let saved = createProgress(subject.id, subject.contentVersion, subject.questions);
    saved = { ...saved, activeSession: createSession(subject.id, subject.contentVersion, subject.questions) };
    saved = answer(saved, first, first.correctAnswer);
    saved = move(saved, 1);
    storage.save(saved);
    window.history.replaceState({}, "", "/subjects/swd392/learn?restart=1");
    vi.spyOn(window, "confirm").mockReturnValue(false);
    await renderStudy(2);
    const loaded = storage.load(subject.id, subject.contentVersion);
    expect(loaded).toMatchObject({ status: "loaded", progress: { activeSession: { sessionId: saved.activeSession?.sessionId, currentIndex: 1 } } });
  });
});
