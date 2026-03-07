import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { runSeedScenario } from "@feedback-360/db";
import { type Page, expect, test } from "@playwright/test";

const artifactsDir = resolve(
  process.cwd(),
  "../..",
  ".memory-bank/evidence/EP-013/FT-0132/2026-03-06",
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

test("FT-0132: structured questionnaire restores draft and submits successfully", async ({
  page,
}) => {
  test.setTimeout(120_000);

  const seeded = await runSeedScenario({
    scenario: "S6_campaign_started_some_drafts",
  });

  const companyId = seeded.handles?.["company.main"];
  const userId = seeded.handles?.["user.head_a"];
  const questionnaireId = seeded.handles?.["questionnaire.main"];
  const indicatorMain3 = seeded.handles?.["indicator.main_3"];
  const competencyMain = seeded.handles?.["competency.main"];
  expect(companyId).toBeTruthy();
  expect(userId).toBeTruthy();
  expect(questionnaireId).toBeTruthy();
  expect(indicatorMain3).toBeTruthy();
  expect(competencyMain).toBeTruthy();

  await loginWithCompany(page, String(userId), String(companyId));

  await page.goto(`/questionnaires/${questionnaireId}`);
  await expect(page.getByTestId("scr-questionnaires-fill-root")).toBeVisible({
    timeout: 60_000,
  });
  await expect(page.getByTestId("questionnaire-progress")).toContainText("3/4", {
    timeout: 60_000,
  });
  await expect(page.getByTestId(`competency-comment-${competencyMain}`)).toHaveValue(
    "Уже замечаю устойчивую постановку приоритетов.",
    { timeout: 60_000 },
  );

  await page.getByTestId(`indicator-input-${indicatorMain3}-5`).check({ force: true });
  await page
    .getByTestId(`competency-comment-${competencyMain}`)
    .fill("Уже замечаю устойчивую постановку приоритетов и более уверенную обратную связь.");
  await page
    .getByTestId("questionnaire-final-comment")
    .fill("Форма выглядит собранной и готовой к отправке.");
  await page.getByTestId("save-draft-button").click();

  await expect(page).toHaveURL(`/questionnaires/${questionnaireId}?saved=1`, { timeout: 60_000 });
  await expect(page.getByTestId("questionnaire-progress-card")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("questionnaire-progress")).toContainText("4/4", {
    timeout: 60_000,
  });
  await expect(page.getByTestId(`competency-comment-${competencyMain}`)).toHaveValue(
    "Уже замечаю устойчивую постановку приоритетов и более уверенную обратную связь.",
    { timeout: 60_000 },
  );
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-01-draft-restored-and-saved.png`,
  });

  await page.reload();
  await expect(page.getByTestId(`indicator-input-${indicatorMain3}-5`)).toBeChecked({
    timeout: 60_000,
  });
  await expect(page.getByTestId("questionnaire-final-comment")).toHaveValue(
    "Форма выглядит собранной и готовой к отправке.",
    { timeout: 60_000 },
  );

  await page.getByTestId("submit-questionnaire-button").click();
  await expect(page).toHaveURL("/questionnaires?submitted=1", { timeout: 60_000 });
  await expect(page.getByTestId("flash-submitted")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId(`questionnaire-status-${questionnaireId}`)).toContainText(
    "Отправлена",
    { timeout: 60_000 },
  );
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-02-questionnaire-submitted.png`,
  });
});
