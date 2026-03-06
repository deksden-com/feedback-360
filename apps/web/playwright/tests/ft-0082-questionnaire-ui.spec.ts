import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { runSeedScenario } from "@feedback-360/db";
import { type Page, expect, test } from "@playwright/test";

const artifactsDir = resolve(
  process.cwd(),
  "../..",
  ".memory-bank/evidence/EP-008/FT-0082/2026-03-06",
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

test("FT-0082: list -> structured draft save -> submit", async ({ page }) => {
  test.setTimeout(120_000);

  const seeded = await runSeedScenario({
    scenario: "S5_campaign_started_no_answers",
  });

  const questionnaireId = seeded.handles?.["questionnaire.main"];
  const userId = seeded.handles?.["user.head_a"];
  const companyId = seeded.handles?.["company.main"];
  const indicatorMain1 = seeded.handles?.["indicator.main_1"];
  const indicatorMain2 = seeded.handles?.["indicator.main_2"];
  const indicatorSecondary = seeded.handles?.["indicator.secondary_1"];
  const competencyMain = seeded.handles?.["competency.main"];
  expect(questionnaireId).toBeTruthy();
  expect(userId).toBeTruthy();
  expect(companyId).toBeTruthy();
  expect(indicatorMain1).toBeTruthy();
  expect(indicatorMain2).toBeTruthy();
  expect(indicatorSecondary).toBeTruthy();
  expect(competencyMain).toBeTruthy();

  await loginWithCompany(page, String(userId), String(companyId));

  await page.goto("/questionnaires");
  await expect(page.getByRole("heading", { name: "Мои анкеты" })).toBeVisible();
  await expect(page.getByTestId(`questionnaire-row-${questionnaireId}`)).toBeVisible();
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-01-questionnaire-inbox.png`,
  });

  await page.getByTestId(`open-questionnaire-${questionnaireId}`).click();
  await expect(page).toHaveURL(`/questionnaires/${questionnaireId}`);

  await page.getByTestId(`indicator-input-${indicatorMain1}-4`).check({ force: true });
  await page.getByTestId(`indicator-input-${indicatorMain2}-3`).check({ force: true });
  await page.getByTestId(`indicator-input-${indicatorSecondary}-NA`).check({ force: true });
  await page.getByTestId(`competency-comment-${competencyMain}`).fill("FT-0082 draft note");
  await page.getByTestId("questionnaire-final-comment").fill("Итоговый комментарий FT-0082");
  await page.getByTestId("save-draft-button").click();

  await expect(page).toHaveURL(`/questionnaires/${questionnaireId}?saved=1`, { timeout: 60_000 });
  await expect(page.getByTestId("questionnaire-progress-card")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("questionnaire-progress")).toContainText("3/4", {
    timeout: 60_000,
  });
  await expect(page.getByTestId(`competency-comment-${competencyMain}`)).toHaveValue(
    "FT-0082 draft note",
    { timeout: 60_000 },
  );
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-02-questionnaire-draft-saved.png`,
  });

  await page.getByTestId("submit-questionnaire-button").click();
  await expect(page).toHaveURL("/questionnaires?submitted=1", { timeout: 60_000 });
  await expect(page.getByTestId("flash-submitted")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId(`questionnaire-status-${questionnaireId}`)).toContainText(
    "Отправлена",
    { timeout: 60_000 },
  );
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-03-questionnaire-submitted.png`,
  });
});

test("FT-0082: ended campaign is read-only and backend rejects save", async ({ page }) => {
  const seeded = await runSeedScenario({
    scenario: "S8_campaign_ended",
  });

  const questionnaireId = seeded.handles?.["questionnaire.main"];
  const userId = seeded.handles?.["user.head_a"];
  const companyId = seeded.handles?.["company.main"];
  expect(questionnaireId).toBeTruthy();
  expect(userId).toBeTruthy();
  expect(companyId).toBeTruthy();

  await loginWithCompany(page, String(userId), String(companyId));

  await page.goto(`/questionnaires/${questionnaireId}`);
  await expect(page.getByTestId("readonly-banner")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("save-draft-button")).toBeDisabled();
  await expect(page.getByTestId("submit-questionnaire-button")).toBeDisabled();
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-04-ended-readonly-view.png`,
  });

  const saveResponse = await page.request.post("/api/questionnaires/draft", {
    data: {
      questionnaireId,
      draft: {
        finalComment: "should fail",
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
