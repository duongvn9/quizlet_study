import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import data from "@/data/subjects/swd392.json";
import { SubjectStudyWorkspace } from "@/components/study/SubjectStudyWorkspace";
import { subjectSchema } from "@/domain/subjects/schemas";

const subject = subjectSchema.parse(data);

describe("SubjectStudyWorkspace", () => {
  it("renders semantic mode links with Learn active", () => {
    render(<SubjectStudyWorkspace subject={subject} mode="learn" />);
    expect(screen.getByRole("link", { name: "Học" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Kiểm tra" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Kiểm tra" })).toHaveAttribute("href", "/subjects/swd392/study?mode=test");
    expect(screen.getByRole("link", { name: "Danh sách câu hỏi" })).toHaveAttribute("href", "/subjects/swd392/study?mode=questions");
  });

  it("renders only the Test placeholder in Test mode", () => {
    render(<SubjectStudyWorkspace subject={subject} mode="test" />);
    expect(screen.getByRole("link", { name: "Kiểm tra" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("heading", { name: "Tạo bài kiểm tra" })).toBeVisible();
    expect(screen.queryByText("Câu 1", { exact: true })).not.toBeInTheDocument();
  });

  it("renders the first 30 questions with correct answers in Questions mode", () => {
    render(<SubjectStudyWorkspace subject={subject} mode="questions" />);
    expect(screen.getByRole("link", { name: "Danh sách câu hỏi" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("heading", { name: "Danh sách câu hỏi" })).toBeVisible();
    expect(screen.getAllByText("Đáp án đúng")).toHaveLength(30);
    expect(screen.getByText(`30/${subject.questionCount} câu`)).toBeVisible();
  });
});
