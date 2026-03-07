import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { type Page, expect, test } from "@playwright/test";

const artifactsDir = resolve(
  process.cwd(),
  "../..",
  ".memory-bank/evidence/EP-015/FT-0151/2026-03-06",
);

const loginWithCompany = async (page: Page, userId: string, companyId: string) => {
  const loginResponse = await page.request.post("/api/dev/test-login", {
    data: {
      userId,
    },
  });
  expect(loginResponse.ok()).toBeTruthy();

  const companyResponse = await page.request.post("/api/session/active-company", {
    data: {
      companyId,
    },
  });
  expect(companyResponse.ok()).toBeTruthy();
};

test.beforeAll(async () => {
  await mkdir(artifactsDir, { recursive: true });
});

test("FT-0151: employee gets a structured results dashboard without raw text", async ({ page }) => {
  test.setTimeout(120_000);

  const seededResponse = await page.request.post("/api/dev/seed", {
    data: {
      scenario: "S9_campaign_completed_with_ai",
    },
  });
  expect(seededResponse.ok()).toBeTruthy();
  const seeded = (await seededResponse.json()) as {
    ok?: boolean;
    handles?: Record<string, string>;
  };
  expect(seeded.ok).toBeTruthy();

  const campaignId = seeded.handles?.["campaign.main"];
  const companyId = seeded.handles?.["company.main"];
  const employeeUserId = seeded.handles?.["user.staff_a1"];

  expect(campaignId).toBeTruthy();
  expect(companyId).toBeTruthy();
  expect(employeeUserId).toBeTruthy();

  await loginWithCompany(page, String(employeeUserId), String(companyId));
  await page.goto(`/results?campaignId=${campaignId}`);

  await expect(page.getByTestId("scr-results-employee-root")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole("heading", { name: "Мои результаты" })).toBeVisible();
  await expect(page.getByTestId("results-summary")).toBeVisible();
  await expect(page.getByTestId("results-group-card-manager")).toBeVisible();
  await expect(page.getByTestId("results-open-text-headline")).toBeVisible();
  await expect(page.getByTestId("results-subject-label")).toContainText("Мой профиль");
  await expect(page.getByTestId("results-open-text-count")).toBeVisible();
  await expect(page.getByTestId(/^open-text-processed-/).first()).toBeVisible();
  await expect(page.getByTestId(/^open-text-raw-/)).toHaveCount(0);

  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-01-employee-results-dashboard.png`,
  });
});
