import { expect, test } from "@playwright/test";
import subject from "../src/data/subjects/swd392.json";
import pmgData from "../src/data/subjects/pmg201c.json";
import { adaptPmg201c } from "../src/domain/subjects/pmg201c-adapter";

const pmg = adaptPmg201c(pmgData);

const progressKey = "study-flow:v1:subject:swd392";

async function openFreshLearn(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  const swd392Card = page.getByRole("article").filter({ has: page.getByRole("link", { name: "Bắt đầu học", exact: true }).and(page.locator('[href="/subjects/swd392"]')) });
  await expect(swd392Card.getByText("249 câu", { exact: true })).toBeVisible();
  await swd392Card.getByRole("link", { name: "Bắt đầu học", exact: true }).click();
  await expect(page).toHaveURL(/\/subjects\/swd392$/);
  await page.getByRole("link", { name: "Bắt đầu học", exact: true }).click();
  await expect(page).toHaveURL(/\/subjects\/swd392\/study\?mode=learn$/);
  await expect(page.getByText("Câu 1", { exact: true })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  page.on("pageerror", (error) => console.error(error.message));
});

test("start, answer, feedback, keyboard and resume", async ({ page }) => {
  await openFreshLearn(page);
  await page.keyboard.press("1");
  await expect(page.getByText(/Chính xác|Hãy ghi nhớ đáp án đúng/)).toBeVisible();
  await page.keyboard.press("Space");
  await expect(page.getByText("Câu 2", { exact: true })).toBeVisible();
  const saved = await page.evaluate((key) => localStorage.getItem(key), progressKey);
  expect(saved).toContain('"currentIndex":1');
  await page.reload();
  await expect(page.getByText("Câu 2", { exact: true })).toBeVisible();
});

test("dont know schedules retry and history can replace its result", async ({ page }) => {
  await openFreshLearn(page);
  await page.getByRole("button", { name: "Không biết" }).click();
  await expect(page.getByText("Hãy ghi nhớ đáp án đúng")).toBeVisible();
  await page.getByRole("button", { name: "Tiếp tục" }).click();
  await page.locator(".options button").first().click();
  await page.getByRole("button", { name: "Trước" }).click();
  await expect(page.getByText("Câu 1", { exact: true })).toBeVisible();
  await expect(page.getByText(/Chọn lại sẽ thay thế kết quả trước đó/)).toBeVisible();
  await expect(page.getByText("Hãy ghi nhớ đáp án đúng")).toHaveCount(0);
  await expect(page.getByText("Giải thích", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Không biết" })).toBeEnabled();
  await expect(page.locator(".options button").first()).toBeEnabled();
  const correctIndex = subject.questions[0].options.findIndex((option) => option.id === subject.questions[0].correctAnswer);
  await page.keyboard.press(String(correctIndex + 1));
  await expect(page.getByText("Chính xác")).toBeVisible();
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), progressKey);
  expect(saved.lifetimeAttempts).toBe(2);
  expect(saved.activeSession.attempts).toHaveLength(2);
  expect(saved.activeSession.attempts[0]).toMatchObject({ result: "correct", selectedOptionIds: [subject.questions[0].correctAnswer] });
  expect(saved.activeSession.queue.some((item: { questionId: string; reason: string }) => item.questionId === subject.questions[0].id && item.reason === "retry")).toBe(true);
});

test("retry remains fresh through two reloads and answered-before-next resumes forward", async ({ page }) => {
  await openFreshLearn(page);
  await page.getByRole("button", { name: "Không biết" }).click();
  for (let index = 1; index < 5; index += 1) {
    await page.getByRole("button", { name: "Tiếp tục" }).click();
    const question = subject.questions[index];
    const correctIndex = question.options.findIndex((option) => option.id === question.correctAnswer);
    await page.locator(".options button").nth(correctIndex).click();
  }
  await page.getByRole("button", { name: "Tiếp tục" }).click();
  await expect(page.getByText("Câu 1", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Không biết" })).toBeEnabled();
  await page.reload();
  await expect(page.getByText("Câu 1", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Không biết" })).toBeEnabled();
  await page.getByRole("button", { name: "Không biết" }).click();
  await page.reload();
  await expect(page.getByText("Câu 6", { exact: true })).toBeVisible();
  await expect(page.getByText("Hãy ghi nhớ đáp án đúng")).toHaveCount(0);
});

test("seeded answered current resumes to next item", async ({ page }) => {
  await openFreshLearn(page);
  await page.getByRole("button", { name: "Không biết" }).click();
  await page.reload();
  await expect(page.getByText("Câu 2", { exact: true })).toBeVisible();
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).activeSession.currentIndex, progressKey)).toBe(1);
});

test("two seeded retries do not inflate the canonical Learn total", async ({ page }) => {
  await openFreshLearn(page);
  await page.evaluate((key) => {
    const progress = JSON.parse(localStorage.getItem(key)!);
    const queue = progress.activeSession.queue;
    queue.push({ ...queue[0], instanceId: "seeded-retry-1", reason: "retry", answered: false });
    queue.push({ ...queue[1], instanceId: "seeded-retry-2", reason: "retry", answered: false });
    localStorage.setItem(key, JSON.stringify(progress));
  }, progressKey);
  await page.reload();
  await expect(page.getByText(/Đã xem 1 \/ 249 câu/)).toBeVisible();
  await expect(page.getByText(/\/ 251 câu/)).toHaveCount(0);
});

test("content version reset is isolated and notice is shown once", async ({ page }) => {
  await openFreshLearn(page);
  await page.evaluate((key) => {
    const progress = JSON.parse(localStorage.getItem(key)!);
    progress.subjectContentVersion = 1;
    if (progress.activeSession) progress.activeSession.subjectContentVersion = 1;
    localStorage.setItem(key, JSON.stringify(progress));
    localStorage.setItem("study-flow:v1:subject:other", "keep");
  }, progressKey);
  await page.reload();
  await expect(page.getByText(/Bộ câu hỏi đã được cập nhật/)).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("study-flow:v1:subject:other"))).toBe("keep");
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).subjectContentVersion, progressKey)).toBe(2);
  await page.reload();
  await expect(page.getByText(/Bộ câu hỏi đã được cập nhật/)).toHaveCount(0);
});

test("manual reset requires confirmation", async ({ page }) => {
  await openFreshLearn(page);
  await page.getByRole("button", { name: "Không biết" }).click();
  await page.goto("/subjects/swd392");
  await page.getByRole("button", { name: "Đặt lại tiến độ" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Hủy" }).click();
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).lifetimeAttempts, progressKey)).toBe(1);
  await page.getByRole("button", { name: "Đặt lại tiến độ" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Đặt lại" }).click();
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).lifetimeAttempts, progressKey)).toBe(0);
});

test("workspace modes preserve unfinished Learn state without attempts or audio", async ({ page }) => {
  await openFreshLearn(page);
  const learn = page.getByRole("link", { name: "Học", exact: true });
  const testMode = page.getByRole("link", { name: "Kiểm tra", exact: true });
  await expect(learn).toHaveAttribute("aria-current", "page");
  const before = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), progressKey);
  await testMode.click();
  await expect(page).toHaveURL(/mode=test$/);
  await expect(page.getByRole("heading", { name: "Tạo bài kiểm tra" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Kiểm tra", exact: true })).toHaveAttribute("aria-current", "page");
  await page.getByRole("link", { name: "Học", exact: true }).click();
  await expect(page.getByText("Câu 1", { exact: true })).toBeVisible();
  const after = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), progressKey);
  expect(after.activeSession.sessionId).toBe(before.activeSession.sessionId);
  expect(after.activeSession.currentIndex).toBe(before.activeSession.currentIndex);
  expect(after.lifetimeAttempts).toBe(before.lifetimeAttempts);
});

test("invalid mode falls back to Learn and legacy Learn redirects", async ({ page }) => {
  await page.goto("/subjects/swd392/study?mode=invalid");
  await expect(page.getByRole("link", { name: "Học", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByText("Câu 1", { exact: true })).toBeVisible();
  await page.goto("/subjects/swd392/learn");
  await expect(page).toHaveURL(/\/subjects\/swd392\/study\?mode=learn$/);
});

test("complete 10-question Test flow persists responses and leaves Learn unchanged", async ({ page }) => {
  await openFreshLearn(page);
  const learnBefore = await page.evaluate((key) => localStorage.getItem(key), progressKey);
  await page.getByRole("link", { name: "Kiểm tra", exact: true }).click();
  await page.getByRole("button", { name: "10", exact: true }).click();
  await page.getByLabel("Xáo trộn câu hỏi").uncheck();
  await page.getByLabel("Xáo trộn đáp án").uncheck();
  await page.getByRole("button", { name: "Bắt đầu" }).click();
  const firstCorrect = subject.questions[0].options.findIndex((option) => option.id === subject.questions[0].correctAnswer);
  await page.locator(".options button").nth(firstCorrect).click();
  await page.getByRole("button", { name: "Tiếp" }).click();
  await page.locator(".options button").first().click();
  await page.getByRole("button", { name: "Trước" }).click();
  await expect(page.locator(".options button").nth(firstCorrect)).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.locator(".options button").nth(firstCorrect)).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Nộp bài" }).click();
  const confirmDialog = page.getByRole("dialog");
  await expect(confirmDialog).toContainText("Bạn còn 8 câu chưa trả lời. Nộp bài ngay?");
  await confirmDialog.getByRole("button", { name: "Nộp bài" }).click();
  await expect(page.getByRole("heading", { name: "Kết quả kiểm tra" })).toBeVisible();
  await expect(page.getByText(/Chưa trả lời: 8/)).toBeVisible();
  await expect(page.locator(".test-review")).toHaveCount(10);
  expect(await page.evaluate((key) => localStorage.getItem(key), progressKey)).toBe(learnBefore);
});

test("PMG201c learn, multiple-choice resume, test scoring, and existing routes", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  const card = page.getByRole("article").filter({ hasText: "PMG201c" });
  await expect(card.getByText("221 câu", { exact: true })).toBeVisible();
  await card.getByRole("link", { name: "Bắt đầu học", exact: true }).click();
  await expect(page.getByText("77 câu cần rà soát")).toBeVisible();
  await page.getByRole("link", { name: "Bắt đầu học", exact: true }).click();
  await page.locator(".options button").first().click();
  await page.getByRole("button", { name: "Tiếp tục" }).click();
  await page.getByRole("button", { name: "Chuyển câu hỏi" }).click();
  await page.getByRole("slider", { name: "Vị trí câu hỏi" }).fill("90");
  await page.getByRole("button", { name: "Chuyển đến câu 90" }).click();
  const multiple = pmg.questions[89];
  for (const answer of multiple.correctAnswers) await page.locator(".options button").nth(multiple.options.findIndex((option) => option.id === answer)).click();
  await page.getByRole("button", { name: "Nộp đáp án" }).click();
  await expect(page.getByText("Chính xác")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Câu 91", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Kiểm tra", exact: true }).click();
  await page.getByRole("button", { name: "10", exact: true }).click();
  await page.getByLabel("Xáo trộn câu hỏi").uncheck();
  await page.getByLabel("Xáo trộn đáp án").uncheck();
  await page.getByRole("button", { name: "Bắt đầu" }).click();
  const first = pmg.questions[0];
  await page.locator(".options button").nth(first.options.findIndex((option) => option.id === first.correctAnswer)).click();
  await page.getByRole("button", { name: "Nộp bài" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Nộp bài" }).click();
  await expect(page.getByText(/1\/10 đúng/)).toBeVisible();
  for (const slug of ["swd392", "mma301", "mln122", "fe-swd392"]) {
    await page.goto(`/subjects/${slug}`);
    await expect(page.getByRole("link", { name: "Bắt đầu học", exact: true })).toBeVisible();
  }
});

for (const width of [360, 1440]) {
  test(`Test setup, runner, and results have no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/subjects/swd392/study?mode=test");
    await expect(page.getByRole("heading", { name: "Tạo bài kiểm tra" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole("button", { name: "10", exact: true }).click();
    await page.getByRole("button", { name: "Bắt đầu" }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole("button", { name: "Nộp bài" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Nộp bài" }).click();
    await expect(page.getByRole("heading", { name: "Kết quả kiểm tra" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

for (const width of [360, 390, 768, 1024, 1440]) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/subjects/swd392/learn");
    await expect(page.getByText("Câu 1", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
