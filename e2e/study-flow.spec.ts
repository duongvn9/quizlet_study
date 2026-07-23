import { expect, test } from "@playwright/test";
import subject from "../src/data/subjects/swd392.json";

const progressKey = "study-flow:v1:subject:swd392";

async function openFreshLearn(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await expect(page.getByText("249 câu", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Bắt đầu học", exact: true }).click();
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
  expect(saved.activeSession.attempts[0]).toMatchObject({ result: "correct", selectedOptionId: subject.questions[0].correctAnswer });
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
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "Đặt lại tiến độ" }).click();
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).lifetimeAttempts, progressKey)).toBe(1);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Đặt lại tiến độ" }).click();
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

for (const width of [360, 390, 768, 1024, 1440]) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/subjects/swd392/learn");
    await expect(page.getByText("Câu 1", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
