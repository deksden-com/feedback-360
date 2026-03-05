import { expect, test } from "@playwright/test";

import { loginWithCompany, seedScenario } from "./beta-helpers";

test("SMOKE(beta): questionnaire draft path works on seeded campaign", async ({ page }) => {
  const handles = await seedScenario(page.request, "S5_campaign_started_no_answers");
  const userId = handles["user.head_a"];
  const companyId = handles["company.main"];
  const questionnaireId = handles["questionnaire.main"];

  expect(userId).toBeTruthy();
  expect(companyId).toBeTruthy();
  expect(questionnaireId).toBeTruthy();

  await loginWithCompany(page, String(userId), String(companyId));

  await page.goto("/questionnaires");
  await expect(page.getByRole("heading", { name: "Мои анкеты" })).toBeVisible();
  await expect(page.getByTestId(`questionnaire-row-${questionnaireId}`)).toBeVisible();

  await page.getByTestId(`open-questionnaire-${questionnaireId}`).click();
  await expect(page.getByRole("heading", { name: `Анкета #${questionnaireId}` })).toBeVisible();

  await page.getByTestId("questionnaire-note").fill("Beta smoke draft note");
  await page.getByTestId("save-draft-button").click();

  await expect(page.getByTestId("questionnaire-flash-saved")).toBeVisible();
  await expect(page.getByTestId("questionnaire-note")).toHaveValue("Beta smoke draft note");
});
