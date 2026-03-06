import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

const artifactsDir = resolve(
  process.cwd(),
  "../..",
  ".memory-bank/evidence/EP-018/FT-0182/2026-03-06",
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

test("FT-0182: HR inspects template catalog and sample preview", async ({ page }) => {
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
  const campaignId = seeded.handles?.["campaign.main"];
  expect(companyId).toBeTruthy();
  expect(hrAdminUserId).toBeTruthy();
  expect(campaignId).toBeTruthy();

  await loginWithCompany(page, String(hrAdminUserId), String(companyId));
  const preloadResponse = await page.request.post("/api/hr/notifications/execute", {
    data: {
      action: "notifications.templates.preview",
      input: { templateKey: "campaign_invite@v1", campaignId },
    },
  });
  expect(preloadResponse.ok()).toBeTruthy();
  await page.goto("/hr/notifications");

  await expect(page.getByTestId("template-catalog-card")).toBeVisible();
  await expect(page.getByTestId("template-row-campaign_invite@v1")).toBeVisible();
  await expect(page.getByTestId("template-row-campaign_reminder@v1")).toBeVisible();

  await page.getByTestId("template-select").selectOption("campaign_reminder@v1");
  await page.getByTestId("template-campaign-select").selectOption(String(campaignId));
  await Promise.all([
    page.waitForResponse(/\/api\/hr\/notifications\/execute$/, { timeout: 30_000 }),
    page.getByTestId("template-preview-button").click(),
  ]);

  await expect(page.getByTestId("template-preview-subject")).toContainText("Напоминание");
  await expect(page.getByTestId("template-preview-vars")).toContainText("pendingCount");
  await expect(page.getByTestId("template-preview-text")).toContainText("незаверш");

  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-01-template-preview.png`,
  });
});
