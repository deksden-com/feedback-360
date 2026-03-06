import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

const artifactsDir = resolve(
  process.cwd(),
  "../..",
  ".memory-bank/evidence/EP-018/FT-0181/2026-03-06",
);

const loginWithCompany = async (
  page: import("@playwright/test").Page,
  userId: string,
  companyId: string,
) => {
  const loginResponse = await page.request.post("/api/dev/test-login", { data: { userId } });
  expect(loginResponse.ok()).toBeTruthy();

  const companyResponse = await page.request.post("/api/session/active-company", {
    data: { companyId },
  });
  expect(companyResponse.ok()).toBeTruthy();
};

test.beforeAll(async () => {
  await mkdir(artifactsDir, { recursive: true });
});

test("FT-0181: HR edits reminder cadence and sees timezone-aware preview", async ({ page }) => {
  test.setTimeout(120_000);

  const seededResponse = await page.request.post("/api/dev/seed", {
    data: { scenario: "S5_campaign_started_no_answers" },
  });
  expect(seededResponse.ok()).toBeTruthy();
  const seeded = (await seededResponse.json()) as {
    ok?: boolean;
    handles?: Record<string, string>;
  };
  expect(seeded.ok).toBeTruthy();

  const companyId = seeded.handles?.["company.main"];
  const hrAdminUserId = seeded.handles?.["user.hr_admin"];
  expect(companyId).toBeTruthy();
  expect(hrAdminUserId).toBeTruthy();

  await loginWithCompany(page, String(hrAdminUserId), String(companyId));
  const preloadResponse = await page.request.post("/api/hr/notifications/execute", {
    data: {
      action: "notifications.settings.preview",
      input: { campaignId: seeded.handles?.["campaign.main"] },
    },
  });
  expect(preloadResponse.ok()).toBeTruthy();
  await page.goto("/hr/notifications");

  await expect(page.getByRole("heading", { name: "Notification center" })).toBeVisible();
  await expect(page.getByTestId("reminder-settings-card")).toBeVisible();
  await expect(page.getByTestId("reminder-preview-summary")).toBeVisible();

  await page.getByTestId("quiet-start-input").fill("18");
  await page.getByTestId("quiet-end-input").fill("17");
  await page.getByTestId("reminder-save-button").click();
  await expect(page.getByTestId("notification-center-error")).toBeVisible();

  await page.getByTestId("reminder-hour-input").fill("11");
  await page.getByTestId("quiet-start-input").fill("9");
  await page.getByTestId("quiet-end-input").fill("19");
  await page.getByTestId("weekday-toggle-1").uncheck();
  await page.getByTestId("weekday-toggle-3").uncheck();
  await page.getByTestId("weekday-toggle-5").uncheck();
  await page.getByTestId("weekday-toggle-2").check();
  await page.getByTestId("weekday-toggle-4").check();
  await Promise.all([
    page.waitForResponse(/\/api\/hr\/notifications\/execute$/, { timeout: 30_000 }),
    page.getByTestId("reminder-preview-button").click(),
  ]);

  await expect(page.getByTestId("reminder-preview-summary")).toContainText("Следующий запуск");
  await expect(page.getByTestId("reminder-weekdays-summary")).toContainText("Вт, Чт");
  await expect(page.getByText("Quiet hours: 9:00–19:00")).toBeVisible();

  await Promise.all([
    page.waitForResponse(/\/api\/hr\/notifications\/execute$/, { timeout: 30_000 }),
    page.getByTestId("reminder-save-button").click(),
  ]);
  await expect(page.getByTestId("reminder-preview-button")).toBeEnabled({ timeout: 30_000 });
  await expect(page.getByText("Quiet hours: 9:00–19:00")).toBeVisible();
  await expect(page.getByTestId("notification-center-error")).toHaveCount(0);

  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-01-reminder-editor.png`,
  });
});
