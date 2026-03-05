import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { type Page, expect, test } from "@playwright/test";

const artifactsDir = resolve(
  process.cwd(),
  "../..",
  ".memory-bank/evidence/EP-008/FT-0082/2026-03-05",
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

test("FT-0082: list -> save draft -> submit", async ({ page }) => {
  test.setTimeout(120_000);
  const seededResponse = await page.request.post("/api/dev/seed", {
    data: {
      scenario: "S5_campaign_started_no_answers",
    },
  });
  expect(seededResponse.ok()).toBeTruthy();
  const seeded = (await seededResponse.json()) as {
    ok?: boolean;
    handles?: Record<string, string>;
  };
  expect(seeded.ok).toBeTruthy();

  const questionnaireId = seeded.handles?.["questionnaire.main"];
  const userId = seeded.handles?.["user.head_a"];
  const companyId = seeded.handles?.["company.main"];
  expect(questionnaireId).toBeTruthy();
  expect(userId).toBeTruthy();
  expect(companyId).toBeTruthy();

  await loginWithCompany(page, String(userId), String(companyId));

  await page.goto("/questionnaires");
  await expect(page.getByRole("heading", { name: "Мои анкеты" })).toBeVisible();
  await expect(page.getByTestId(`questionnaire-row-${questionnaireId}`)).toBeVisible();
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-01-questionnaire-list.png`,
  });

  await page.getByTestId(`open-questionnaire-${questionnaireId}`).click();
  await expect(page).toHaveURL(`/questionnaires/${questionnaireId}`);

  const noteInput = page.getByTestId("questionnaire-note");
  await expect(noteInput).toBeEditable({ timeout: 60_000 });
  await noteInput.fill("FT-0082 draft note");
  await page.getByTestId("save-draft-button").click();
  await expect(page).toHaveURL(`/questionnaires/${questionnaireId}?saved=1`, { timeout: 60_000 });
  await expect(noteInput).toHaveValue("FT-0082 draft note");
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-02-questionnaire-draft-saved.png`,
  });

  await page.getByTestId("submit-questionnaire-button").click();
  await expect(page).toHaveURL("/questionnaires?submitted=1", { timeout: 60_000 });
  await expect(page.getByTestId(`questionnaire-status-${questionnaireId}`)).toContainText(
    "Отправлена",
  );
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-03-questionnaire-submitted.png`,
  });
});

test("FT-0082: ended campaign is read-only and backend rejects save", async ({ page }) => {
  const seededResponse = await page.request.post("/api/dev/seed", {
    data: {
      scenario: "S8_campaign_ended",
    },
  });
  expect(seededResponse.ok()).toBeTruthy();
  const seeded = (await seededResponse.json()) as {
    ok?: boolean;
    handles?: Record<string, string>;
  };
  expect(seeded.ok).toBeTruthy();

  const questionnaireId = seeded.handles?.["questionnaire.main"];
  const userId = seeded.handles?.["user.head_a"];
  const companyId = seeded.handles?.["company.main"];
  expect(questionnaireId).toBeTruthy();
  expect(userId).toBeTruthy();
  expect(companyId).toBeTruthy();

  await loginWithCompany(page, String(userId), String(companyId));

  await page.goto(`/questionnaires/${questionnaireId}`);
  await expect(page.getByTestId("readonly-banner")).toBeVisible();
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
        note: "should fail",
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
