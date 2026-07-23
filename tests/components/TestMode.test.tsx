import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import data from "@/data/subjects/swd392.json";
import { TestResults } from "@/components/test/TestResults";
import { TestRunner } from "@/components/test/TestRunner";
import { TestSetup } from "@/components/test/TestSetup";
import { TestShell } from "@/components/test/TestShell";
import { subjectSchema } from "@/domain/subjects/schemas";
import { createProgress } from "@/domain/study/create-session";
import { createTestSession } from "@/domain/test/generation";
import { selectResponse } from "@/domain/test/reducer";
import { submitTest } from "@/domain/test/scoring";
import { testKey } from "@/lib/storage/test-storage";
import { audioMocks } from "../setup";

const subject = subjectSchema.parse(data);
const deps = { random: () => 0.5, id: () => "test-session", now: () => "2026-01-01T00:00:00.000Z" };
const makeSession = (count = 2) => createTestSession(subject.id, subject.contentVersion, subject.questions, { count, pool: "all", shuffleQuestions: false, shuffleOptions: false }, deps);

describe("Test setup", () => {
  it("supports presets, all, custom validation, unmastered, and pool shortages", () => {
    const onStart = vi.fn();
    render(<TestSetup total={45} unmastered={3} onStart={onStart} />);
    for (const preset of ["10", "20", "40", "Tất cả"]) expect(screen.getByRole("button", { name: preset })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "10" }));
    fireEvent.click(screen.getByLabelText("Chưa thuộc (3)"));
    expect(screen.getByRole("status")).toHaveTextContent("giảm còn 3 câu");
    fireEvent.click(screen.getByRole("button", { name: "Bắt đầu" }));
    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ count: 10, pool: "unmastered" }));
    fireEvent.change(screen.getByLabelText("Số câu tùy chỉnh"), { target: { value: "0" } });
    expect(screen.getByRole("alert")).toHaveTextContent("Nhập số nguyên từ 1 đến 45");
    expect(screen.getByRole("button", { name: "Bắt đầu" })).toBeDisabled();
    fireEvent.click(screen.getByLabelText("Tất cả (45)"));
    fireEvent.click(screen.getByRole("button", { name: "Tất cả" }));
    expect(screen.getByLabelText("Số câu tùy chỉnh")).toHaveValue(45);
  });

  it("disables an empty unmastered pool", () => {
    render(<TestSetup total={10} unmastered={0} onStart={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("Chưa thuộc (0)"));
    expect(screen.getByRole("button", { name: "Bắt đầu" })).toBeDisabled();
  });
});

describe("Test runner", () => {
  it("renders a five-option question and allows selection changes and navigation", () => {
    const fiveOptionQuestion = subject.questions.find((question) => question.options.length === 5)!;
    const session = createTestSession(subject.id, subject.contentVersion, [fiveOptionQuestion, subject.questions[0]], { count: 2, pool: "all", shuffleQuestions: false, shuffleOptions: false }, deps);
    const onSelect = vi.fn();
    const onNavigate = vi.fn();
    render(<TestRunner subject={subject} session={session} onSelect={onSelect} onNavigate={onNavigate} onSubmit={vi.fn()} />);
    expect(screen.getAllByRole("button", { pressed: false })).toHaveLength(5);
    fireEvent.click(screen.getAllByRole("button", { pressed: false })[0]);
    fireEvent.click(screen.getAllByRole("button", { pressed: false })[1]);
    expect(onSelect).toHaveBeenNthCalledWith(1, fiveOptionQuestion.options[0].id);
    expect(onSelect).toHaveBeenNthCalledWith(2, fiveOptionQuestion.options[1].id);
    expect(screen.getByText("Chưa trả lời: 2")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Tiếp" }));
    expect(onNavigate).toHaveBeenCalledWith(1);
    fireEvent.click(within(screen.getByRole("navigation", { name: "Điều hướng câu hỏi" })).getByRole("button", { name: "2" }));
    expect(onNavigate).toHaveBeenLastCalledWith(1);
  });

  it("shows no correctness, explanation, review, or audio before submit", () => {
    const session = selectResponse(makeSession(), subject.questions[0].options[0].id, "later");
    render(<TestRunner subject={subject} session={session} onSelect={vi.fn()} onNavigate={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.queryByText(/Đúng|Sai|Chính xác|Giải thích|Cần rà soát/)).not.toBeInTheDocument();
    expect(audioMocks.play).not.toHaveBeenCalled();
  });
});

describe("Test results", () => {
  it("shows score totals, answer review, explanation, needs-review, and all result actions", () => {
    const reviewQuestion = subject.questions.find((question) => question.needsReview && question.explanation?.trim()) ?? subject.questions.find((question) => question.needsReview)!;
    const otherQuestion = subject.questions.find((question) => question.id !== reviewQuestion.id)!;
    let session = createTestSession(subject.id, subject.contentVersion, [reviewQuestion, otherQuestion], { count: 2, pool: "all", shuffleQuestions: false, shuffleOptions: false }, deps);
    session = selectResponse(session, reviewQuestion.correctAnswer, "2026-01-01T00:00:01.000Z");
    session = submitTest(session, subject.questions, "2026-01-01T00:00:02.000Z");
    const actions = { onRetake: vi.fn(), onNew: vi.fn(), onLearn: vi.fn() };
    render(<TestResults subject={subject} session={session} {...actions} />);
    expect(screen.getByRole("heading", { name: "Kết quả kiểm tra" })).toBeVisible();
    expect(screen.getByText("1/2 đúng · 50% · 0 phút 2 giây")).toBeVisible();
    expect(screen.getByText("Sai: 0 · Chưa trả lời: 1")).toBeVisible();
    expect(screen.getAllByText(/Đáp án đúng:/)).toHaveLength(2);
    expect(screen.getAllByText("Cần rà soát").length).toBeGreaterThan(0);
    if (reviewQuestion.explanation?.trim()) expect(screen.getByText("Giải thích:")).toBeVisible();
    for (const [name, handler] of [["Làm lại cùng câu hỏi", actions.onRetake], ["Tạo bài mới", actions.onNew], ["Về chế độ Học", actions.onLearn]] as const) {
      fireEvent.click(screen.getByRole("button", { name }));
      expect(handler).toHaveBeenCalledOnce();
    }
  });
});

describe("Test shell persistence and isolation", () => {
  it("recovers invalid and content-mismatched sessions without mutating Learn", async () => {
    const learnKey = `study-flow:v1:subject:${subject.id}`;
    const learnState = createProgress(subject.id, subject.contentVersion, subject.questions);
    localStorage.setItem(learnKey, JSON.stringify(learnState));
    localStorage.setItem(testKey(subject.id), "invalid");
    const { unmount } = render(<TestShell subject={subject} />);
    expect(await screen.findByRole("status")).toHaveTextContent("không còn hợp lệ");
    expect(JSON.parse(localStorage.getItem(learnKey)!)).toEqual(learnState);
    unmount();
    const mismatch = { ...makeSession(), subjectContentVersion: subject.contentVersion - 1 };
    localStorage.setItem(testKey(subject.id), JSON.stringify(mismatch));
    render(<TestShell subject={subject} />);
    expect(await screen.findByRole("status")).toHaveTextContent("nội dung đã thay đổi");
    expect(JSON.parse(localStorage.getItem(learnKey)!)).toEqual(learnState);
  });

  it("resumes an unfinished test and uses the exact unanswered confirmation", async () => {
    const session = selectResponse(makeSession(), subject.questions[0].options[0].id, "later");
    localStorage.setItem(testKey(subject.id), JSON.stringify(session));
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<TestShell subject={subject} />);
    expect(await screen.findByText("Câu 1/2")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Nộp bài" }));
    expect(confirm).toHaveBeenCalledWith("Bạn còn 1 câu chưa trả lời. Nộp bài ngay?");
    expect(JSON.parse(localStorage.getItem(testKey(subject.id))!).status).toBe("active");
  });
});
