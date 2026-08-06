import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import pmgData from "@/data/subjects/pmg201c.json";
import { StudyShell } from "@/components/study/StudyShell";
import { adaptPmg201c } from "@/domain/subjects/pmg201c-adapter";
import { createProgress, createSession } from "@/domain/study/create-session";
import { storage } from "@/lib/storage/local-study-storage";

const subject = adaptPmg201c(pmgData);
const multipleChoice = subject.questions.find((question) => question.number === 90)!;
const reviewQuestion = subject.questions.find((question) => question.needsReview && question.reviewNotes.length)!;

function freshProgress() {
  const progress = createProgress(subject.id, subject.contentVersion, subject.questions);
  return { ...progress, activeSession: createSession(subject.id, subject.contentVersion, subject.questions) };
}

async function renderAt(questionId: string) {
  storage.save(freshProgress());
  render(<StudyShell subject={subject} />);
  await screen.findByText("Câu 1");
  const number = subject.questions.find((question) => question.id === questionId)!.number;
  if (number === 1) return;
  fireEvent.click(screen.getByRole("button", { name: "Chuyển câu hỏi" }));
  fireEvent.change(screen.getByRole("slider", { name: "Vị trí câu hỏi" }), { target: { value: String(number) } });
  fireEvent.click(screen.getByRole("button", { name: `Chuyển đến câu ${number}` }));
  await screen.findByText(`Câu ${number}`);
}

describe("PMG201c StudyShell", () => {
  beforeEach(() => localStorage.clear());

  it("renders all six options", async () => {
    const question = subject.questions.find((item) => item.options.length === 6)!;
    await renderAt(question.id);
    expect(within(document.querySelector(".options")!).getAllByRole("button")).toHaveLength(6);
  });

  it("selects multiple answers, submits explicitly, and reveals every correct answer", async () => {
    await renderAt(multipleChoice.id);
    const options = within(document.querySelector(".options")!).getAllByRole("button");
    const correct = multipleChoice.correctAnswers.map((id) => multipleChoice.options.findIndex((option) => option.id === id));
    fireEvent.click(options[correct[0]]);
    expect(options[correct[0]]).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText("Chính xác")).not.toBeInTheDocument();
    fireEvent.click(options[correct[1]]);
    fireEvent.click(screen.getByRole("button", { name: "Nộp đáp án" }));
    expect(await screen.findByText("Chính xác")).toBeVisible();
    for (const index of correct) expect(options[index]).toHaveClass("correct");
  });

  it("shows review notes only after submission", async () => {
    await renderAt(reviewQuestion.id);
    expect(screen.queryByText("Dữ liệu nguồn cần rà soát")).not.toBeInTheDocument();
    const correct = reviewQuestion.options.findIndex((option) => option.id === reviewQuestion.correctAnswer);
    fireEvent.click(within(document.querySelector(".options")!).getAllByRole("button")[correct]);
    expect(await screen.findByText("Dữ liệu nguồn cần rà soát")).toBeVisible();
    expect(screen.getByText(reviewQuestion.reviewNotes[0])).toBeInTheDocument();
  });

  it("resets PMG progress to a fresh 333-question session", async () => {
    await renderAt(multipleChoice.id);
    fireEvent.click(document.querySelector<HTMLButtonElement>(".study-top .secondary")!);
    fireEvent.click(screen.getByRole("button", { name: "Đặt lại tiến độ" }));
    fireEvent.click(within(screen.getByRole("heading", { name: "Xác nhận" }).closest("[role=dialog]")!).getByRole("button", { name: "Đặt lại" }));
    await waitFor(() => expect(storage.load(subject.id, subject.contentVersion)).toMatchObject({ status: "loaded", progress: { lifetimeAttempts: 0, activeSession: { currentIndex: 0, queue: expect.any(Array) } } }));
    const loaded = storage.load(subject.id, subject.contentVersion);
    expect(loaded.status === "loaded" && loaded.progress.activeSession?.queue).toHaveLength(333);
  });
});
