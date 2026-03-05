import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { type Page, expect, test } from "@playwright/test";

const artifactsDir = resolve(
  process.cwd(),
  "../..",
  ".memory-bank/evidence/EP-008/FT-0083/2026-03-05",
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

test("FT-0083: employee/manager hide raw text, HR view includes raw text", async ({ page }) => {
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
  const subjectEmployeeId = seeded.handles?.["employee.subject_main"];
  const employeeUserId = seeded.handles?.["user.staff_a1"];
  const managerUserId = seeded.handles?.["user.head_a"];
  const hrUserId = seeded.handles?.["user.hr_admin"];
  expect(campaignId).toBeTruthy();
  expect(companyId).toBeTruthy();
  expect(subjectEmployeeId).toBeTruthy();
  expect(employeeUserId).toBeTruthy();
  expect(managerUserId).toBeTruthy();
  expect(hrUserId).toBeTruthy();

  await loginWithCompany(page, String(employeeUserId), String(companyId));
  await page.goto(`/results?campaignId=${campaignId}`);
  await expect(page.getByRole("heading", { name: "Мои результаты" })).toBeVisible();
  await expect(page.getByTestId("results-summary")).toBeVisible();
  await expect(page.getByTestId(/^open-text-processed-/).first()).toBeVisible();
  await expect(page.getByTestId(/^open-text-raw-/)).toHaveCount(0);
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-01-employee-results-without-raw.png`,
  });

  await loginWithCompany(page, String(managerUserId), String(companyId));
  await page.goto(`/results/team?campaignId=${campaignId}&subjectEmployeeId=${subjectEmployeeId}`);
  await expect(page.getByRole("heading", { name: "Результаты команды" })).toBeVisible();
  await expect(page.getByTestId("results-summary")).toBeVisible();
  await expect(page.getByTestId(/^open-text-processed-/).first()).toBeVisible();
  await expect(page.getByTestId(/^open-text-raw-/)).toHaveCount(0);
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-02-manager-results-without-raw.png`,
  });

  await loginWithCompany(page, String(hrUserId), String(companyId));
  await page.goto(`/results/hr?campaignId=${campaignId}&subjectEmployeeId=${subjectEmployeeId}`);
  await expect(page.getByRole("heading", { name: "HR результаты" })).toBeVisible();
  await expect(page.getByTestId("results-summary")).toBeVisible();
  await expect(page.getByTestId(/^open-text-raw-/).first()).toBeVisible();
  await expect(page.getByTestId(/^open-text-processed-/).first()).toBeVisible();
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-03-hr-results-with-raw.png`,
  });
});
