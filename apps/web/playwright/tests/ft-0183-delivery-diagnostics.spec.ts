import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

const artifactsDir = resolve(
  process.cwd(),
  "../..",
  ".memory-bank/evidence/EP-018/FT-0183/2026-03-06",
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

test("FT-0183: HR filters delivery diagnostics and inspects retry/fail attempts", async ({
  page,
}) => {
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

  const fixtureResponse = await page.request.post("/api/dev/notifications-fixture", {
    data: { campaignId },
  });
  expect(fixtureResponse.ok()).toBeTruthy();
  const preloadResponse = await page.request.post("/api/hr/notifications/execute", {
    data: {
      action: "notifications.deliveries.list",
      input: { campaignId, status: "retry_scheduled", channel: "email" },
    },
  });
  expect(preloadResponse.ok()).toBeTruthy();

  await page.goto("/hr/notifications");
  await expect(page.getByTestId("delivery-diagnostics-card")).toBeVisible();

  await page.getByTestId("delivery-campaign-select").selectOption(String(campaignId));
  await page.getByTestId("delivery-status-select").selectOption("retry_scheduled");
  await Promise.all([
    page.waitForResponse(/\/api\/hr\/notifications\/execute$/, { timeout: 30_000 }),
    page.getByTestId("delivery-refresh-button").click(),
  ]);

  await expect(page.getByText("Ретрай запланирован")).toBeVisible();
  await page.locator("[data-testid^='delivery-row-'] summary").first().click();
  await expect(page.locator("[data-testid^='delivery-attempts-']").first()).toContainText(
    "Attempt #1",
  );

  await page.getByTestId("delivery-status-select").selectOption("failed");
  await Promise.all([
    page.waitForResponse(/\/api\/hr\/notifications\/execute$/, { timeout: 30_000 }),
    page.getByTestId("delivery-refresh-button").click(),
  ]);
  await expect(page.getByText("Ошибка")).toBeVisible();

  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-01-delivery-diagnostics.png`,
  });
});
