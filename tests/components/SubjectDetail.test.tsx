import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import pmgData from "@/data/subjects/pmg201c.json";
import { SubjectDetail } from "@/components/subjects/SubjectDetail";
import { adaptPmg201c } from "@/domain/subjects/pmg201c-adapter";

const subject = adaptPmg201c(pmgData);

describe("SubjectDetail metadata", () => {
  it("renders canonical question, review, and duplicate totals", async () => {
    render(<SubjectDetail subject={subject} />);
    expect(screen.getByText("221 câu")).toBeVisible();
    expect(screen.getByText("77 cần rà soát")).toBeVisible();
    expect(screen.getByText("35 nhóm câu trùng")).toBeVisible();
  });
});
