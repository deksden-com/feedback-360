import { expect, test } from "@playwright/test";

import { loginWithCompany, seedScenario } from "./beta-helpers";

test("SMOKE(beta): questionnaire draft path works on seeded campaign", async ({ browser }) => {
  test.setTimeout(90_000);
  const context = await browser.newContext({ baseURL: "https://beta.go360go.ru" });
  const page = await context.newPage();
  const handles = await seedScenario(page.request, "S5_campaign_started_no_answers");
  const userId = handles["user.head_a"];
  const companyId = handles["company.main"];
  const questionnaireId = handles["questionnaire.main"];

  expect(userId).toBeTruthy();
  expect(companyId).toBeTruthy();
  expect(questionnaireId).toBeTruthy();

  await loginWithCompany(page, String(userId), String(companyId));

  await page.goto("/questionnaires", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Мои анкеты" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId(`questionnaire-row-${questionnaireId}`)).toBeVisible({
    timeout: 15_000,
  });

  await page.getByTestId(`open-questionnaire-${questionnaireId}`).click();
  await expect(page.getByTestId("questionnaire-progress-card")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("questionnaire-final-comment")).toBeVisible({ timeout: 30_000 });
  await context.close();
});
