import { expect, test } from "@playwright/test";

const progressKey = "study-flow:v1:subject:swd392";

async function openFreshLearn(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await expect(page.getByText("249 câu", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Bắt đầu học", exact: true }).click();
  await expect(page).toHaveURL(/\/subjects\/swd392$/);
  await page.getByRole("link", { name: "Bắt đầu học", exact: true }).click();
  await expect(page).toHaveURL(/\/subjects\/swd392\/learn$/);
  await expect(page.getByText("Câu 1", { exact: true })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  page.on("pageerror", (error) => console.error(error.message));
});

test("start, answer, feedback, keyboard and resume", async ({ page }) => {
  await openFreshLearn(page);
  await page.keyboard.press("1");
  await expect(page.getByText(/Đáp án đúng|Chưa chính xác/)).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Câu 2", { exact: true })).toBeVisible();
  const saved = await page.evaluate((key) => localStorage.getItem(key), progressKey);
  expect(saved).toContain('"currentIndex":1');
  await page.reload();
  await expect(page.getByText("Câu 2", { exact: true })).toBeVisible();
});

test("dont know schedules retry and history remains read-only", async ({ page }) => {
  await openFreshLearn(page);
  await page.getByRole("button", { name: "Không biết" }).click();
  await expect(page.getByText("Hãy ghi nhớ đáp án đúng")).toBeVisible();
  await page.getByRole("button", { name: "Tiếp tục" }).click();
  await page.locator(".options button").first().click();
  await page.getByRole("button", { name: "Trước" }).click();
  await expect(page.getByText("Câu 1", { exact: true })).toBeVisible();
  await expect(page.locator(".options button").first()).toBeDisabled();
  const attempts = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).lifetimeAttempts, progressKey);
  expect(attempts).toBe(2);
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

for (const width of [360, 390, 768, 1024, 1440]) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/subjects/swd392/learn");
    await expect(page.getByText("Câu 1", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
