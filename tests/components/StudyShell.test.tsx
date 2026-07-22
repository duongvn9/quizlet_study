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
    expect(screen.getByText("✓ Đáp án đúng")).toBeVisible();
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
    fireEvent.click(within(document.querySelector(".options")!).getAllByRole("button")[wrongIndex]);
    expect(await screen.findByText("✕ Bạn đã chọn")).toBeVisible();
    expect(screen.getByText("✓ Đáp án đúng")).toBeVisible();
    expect(audioMocks.play).not.toHaveBeenCalled();
  });

  it("does not play for I don't know", async () => {
    await renderStudy();
    fireEvent.click(screen.getByRole("button", { name: "Không biết" }));
    expect(await screen.findByText("Hãy ghi nhớ đáp án đúng")).toBeVisible();
    expect(audioMocks.play).not.toHaveBeenCalled();
  });

  it("maps keyboard numbers to display order and Enter continues", async () => {
    await renderStudy();
    fireEvent.keyDown(window, { key: String(correctIndex + 1) });
    expect(await screen.findByText("Chính xác")).toBeVisible();
    fireEvent.keyDown(window, { key: "Enter" });
    expect(await screen.findByText("Câu 2")).toBeVisible();
  });

  it("ignores keyboard shortcuts from controls", async () => {
    await renderStudy();
    const sound = screen.getByRole("checkbox", { name: "Âm thanh" });
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

  it("does not play while restoring a correct answered item", async () => {
    let progress = createProgress(subject.id, subject.contentVersion, subject.questions);
    progress = { ...progress, activeSession: createSession(subject.id, subject.contentVersion, subject.questions) };
    progress = answer(progress, first, first.correctAnswer);
    storage.save(progress);
    await renderStudy();
    expect(await screen.findByText("Chính xác")).toBeVisible();
    expect(audioMocks.play).not.toHaveBeenCalled();
  });

  it("does not play correct answers when sound is disabled", async () => {
    localStorage.setItem("study-flow:v1:sound", "false");
    await renderStudy();
    await waitFor(() => expect(screen.getByRole("checkbox", { name: "Âm thanh" })).not.toBeChecked());
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
