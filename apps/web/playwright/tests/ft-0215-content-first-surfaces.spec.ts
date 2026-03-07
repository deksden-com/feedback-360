import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { type Page, expect, test } from "@playwright/test";

const artifactsDir = resolve(
  process.cwd(),
  "../..",
  ".memory-bank/evidence/EP-021/FT-0215/2026-03-07",
);

const loginWithCompany = async (page: Page, userId: string, companyId: string) => {
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

test("FT-0215: questionnaire surfaces prioritize work progress and actions", async ({ page }) => {
  test.setTimeout(120_000);

  const seededResponse = await page.request.post("/api/dev/seed", {
    data: { scenario: "S7_campaign_started_some_submitted" },
  });
  expect(seededResponse.ok()).toBeTruthy();
  const seeded = (await seededResponse.json()) as {
    ok?: boolean;
    handles?: Record<string, string>;
  };
  expect(seeded.ok).toBeTruthy();

  const companyId = seeded.handles?.["company.main"];
  const userId = seeded.handles?.["user.hr_admin"];
  const questionnaireInProgress = seeded.handles?.["questionnaire.main_in_progress"];
  expect(companyId).toBeTruthy();
  expect(userId).toBeTruthy();
  expect(questionnaireInProgress).toBeTruthy();

  await loginWithCompany(page, String(userId), String(companyId));
  await page.goto("/questionnaires");
  await expect(page.getByTestId("scr-questionnaires-inbox-root")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("scr-questionnaires-inbox-summary")).toBeVisible();
  await expect(page.getByTestId("scr-questionnaires-inbox-toolbar")).toBeVisible();
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-01-inbox__(SCR-QUESTIONNAIRES-INBOX).png`,
  });

  await page.getByTestId(`open-questionnaire-${questionnaireInProgress}`).click();
  await expect(page).toHaveURL(`/questionnaires/${questionnaireInProgress}`);
  await expect(page.getByTestId("scr-questionnaires-fill-root")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("scr-questionnaires-fill-summary")).toBeVisible();
  await expect(page.getByTestId("questionnaire-progress-card")).toBeVisible();
  await expect(page.getByTestId("scr-questionnaires-fill-actions")).toBeVisible();
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-02-fill__(SCR-QUESTIONNAIRES-FILL).png`,
  });
});

test("FT-0215: results surfaces lead with report context and summary", async ({ page }) => {
  test.setTimeout(120_000);

  const seededResponse = await page.request.post("/api/dev/seed", {
    data: { scenario: "S9_campaign_completed_with_ai" },
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
  const managerUserId = seeded.handles?.["user.head_a"];
  const hrAdminUserId = seeded.handles?.["user.hr_admin"];
  const subjectEmployeeId = seeded.handles?.["employee.subject_main"];

  expect(campaignId).toBeTruthy();
  expect(companyId).toBeTruthy();
  expect(employeeUserId).toBeTruthy();
  expect(managerUserId).toBeTruthy();
  expect(hrAdminUserId).toBeTruthy();
  expect(subjectEmployeeId).toBeTruthy();

  await loginWithCompany(page, String(employeeUserId), String(companyId));
  await page.goto(`/results?campaignId=${campaignId}`);
  await expect(page.getByTestId("results-layout-hero")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("results-summary")).toBeVisible({ timeout: 60_000 });
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-03-results-employee__(SCR-RESULTS-EMPLOYEE).png`,
  });

  await loginWithCompany(page, String(managerUserId), String(companyId));
  await page.goto(`/results/team?campaignId=${campaignId}&subjectEmployeeId=${subjectEmployeeId}`);
  await expect(page.getByTestId("scr-results-manager-root")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("results-layout-hero")).toBeVisible({ timeout: 60_000 });
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-04-results-manager__(SCR-RESULTS-MANAGER).png`,
  });

  await loginWithCompany(page, String(hrAdminUserId), String(companyId));
  await page.goto(`/results/hr?campaignId=${campaignId}&subjectEmployeeId=${subjectEmployeeId}`);
  await expect(page.getByTestId("scr-results-hr-root")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("results-layout-hero")).toBeVisible({ timeout: 60_000 });
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-05-results-hr__(SCR-RESULTS-HR).png`,
  });
});
