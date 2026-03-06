import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { runSeedScenario } from "@feedback-360/db";
import { type Page, expect, test } from "@playwright/test";

const artifactsDir = resolve(
  process.cwd(),
  "../..",
  ".memory-bank/evidence/EP-013/FT-0133/2026-03-06",
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

test("FT-0133: submitted questionnaire reopens in read-only mode", async ({ page }) => {
  test.setTimeout(120_000);

  const seeded = await runSeedScenario({
    scenario: "S7_campaign_started_some_submitted",
  });

  const companyId = seeded.handles?.["company.main"];
  const userId = seeded.handles?.["user.head_b"];
  const questionnaireId = seeded.handles?.["questionnaire.main_submitted"];
  expect(companyId).toBeTruthy();
  expect(userId).toBeTruthy();
  expect(questionnaireId).toBeTruthy();

  await loginWithCompany(page, String(userId), String(companyId));

  await page.goto(`/questionnaires/${questionnaireId}`);
  await expect(page.getByTestId("readonly-banner")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("save-draft-button")).toBeDisabled();
  await expect(page.getByTestId("submit-questionnaire-button")).toBeDisabled();
  await expect(page.getByTestId("go-to-results")).toBeVisible();
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-01-submitted-readonly.png`,
  });
});

test("FT-0133: ended campaign stays read-only and backend rejects write", async ({ page }) => {
  test.setTimeout(120_000);

  const seeded = await runSeedScenario({
    scenario: "S8_campaign_ended",
  });

  const companyId = seeded.handles?.["company.main"];
  const userId = seeded.handles?.["user.head_a"];
  const questionnaireId = seeded.handles?.["questionnaire.main"];
  expect(companyId).toBeTruthy();
  expect(userId).toBeTruthy();
  expect(questionnaireId).toBeTruthy();

  await loginWithCompany(page, String(userId), String(companyId));

  await page.goto(`/questionnaires/${questionnaireId}`);
  await expect(page.getByTestId("readonly-banner")).toContainText("Кампания завершена", {
    timeout: 60_000,
  });
  await expect(page.getByTestId("save-draft-button")).toBeDisabled();
  await expect(page.getByTestId("submit-questionnaire-button")).toBeDisabled();
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-02-ended-readonly.png`,
  });

  const saveResponse = await page.request.post("/api/questionnaires/draft", {
    data: {
      questionnaireId,
      draft: {
        finalComment: {
          rawText: "should fail",
        },
      },
    },
  });
  expect(saveResponse.status()).toBe(409);
  const savePayload = (await saveResponse.json()) as {
    ok?: boolean;
    error?: { code?: string };
  };
  expect(savePayload.ok).toBeFalsy();
  expect(savePayload.error?.code).toBe("campaign_ended_readonly");
});
