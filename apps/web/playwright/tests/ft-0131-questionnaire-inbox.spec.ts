import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { runSeedScenario } from "@feedback-360/db";
import { type Page, expect, test } from "@playwright/test";

const artifactsDir = resolve(
  process.cwd(),
  "../..",
  ".memory-bank/evidence/EP-013/FT-0131/2026-03-06",
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

test("FT-0131: questionnaire inbox supports status filters and resume flow", async ({ page }) => {
  test.setTimeout(120_000);

  const seeded = await runSeedScenario({
    scenario: "S7_campaign_started_some_submitted",
  });

  const companyId = seeded.handles?.["company.main"];
  const userId = seeded.handles?.["user.hr_admin"];
  const questionnaireNotStarted = seeded.handles?.["questionnaire.main_not_started"];
  const questionnaireInProgress = seeded.handles?.["questionnaire.main_in_progress"];
  const questionnaireSubmitted = seeded.handles?.["questionnaire.main_submitted"];
  expect(companyId).toBeTruthy();
  expect(userId).toBeTruthy();
  expect(questionnaireNotStarted).toBeTruthy();
  expect(questionnaireInProgress).toBeTruthy();
  expect(questionnaireSubmitted).toBeTruthy();

  await loginWithCompany(page, String(userId), String(companyId));

  await page.goto("/questionnaires");
  await expect(page.getByTestId("questionnaire-summary-total")).toContainText("3", {
    timeout: 60_000,
  });
  await expect(page.getByTestId("questionnaire-summary-drafts")).toContainText("1", {
    timeout: 60_000,
  });
  await expect(page.getByTestId("questionnaire-summary-submitted")).toContainText("1", {
    timeout: 60_000,
  });
  await expect(page.getByTestId("questionnaire-section-not_started")).toContainText(
    "Не начата · 1",
    { timeout: 60_000 },
  );
  await expect(page.getByTestId("questionnaire-section-in_progress")).toContainText(
    "Черновик · 1",
    { timeout: 60_000 },
  );
  await expect(page.getByTestId("questionnaire-section-submitted")).toContainText(
    "Отправлена · 1",
    { timeout: 60_000 },
  );
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-01-inbox-all-statuses.png`,
  });

  await page.getByTestId("questionnaire-filter-status-in_progress").click();
  await expect(page).toHaveURL("/questionnaires?status=in_progress");
  await expect(page.getByTestId(`questionnaire-row-${questionnaireInProgress}`)).toBeVisible({
    timeout: 60_000,
  });
  await expect(page.getByTestId(`questionnaire-row-${questionnaireNotStarted}`)).toHaveCount(0);
  await expect(page.getByTestId(`questionnaire-row-${questionnaireSubmitted}`)).toHaveCount(0);
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-02-inbox-filtered-drafts.png`,
  });

  await page.getByTestId(`open-questionnaire-${questionnaireInProgress}`).click();
  await expect(page).toHaveURL(`/questionnaires/${questionnaireInProgress}`);
  await expect(page.getByTestId("questionnaire-progress-card")).toBeVisible({ timeout: 60_000 });
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-03-resume-draft.png`,
  });
});
