import { expect, test } from "@playwright/test";

import { loginAsUser, seedScenario } from "./beta-helpers";

test("SMOKE(beta): select-company loads for provisioned user", async ({ browser }) => {
  test.setTimeout(90_000);
  const context = await browser.newContext({ baseURL: "https://beta.go360go.ru" });
  const page = await context.newPage();
  const handles = await seedScenario(page.request, "S1_multi_tenant_min");
  const userId = handles["user.shared"];

  expect(userId).toBeTruthy();
  await loginAsUser(page, String(userId));

  await page.goto("/select-company", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Выберите компанию" })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText("Не удалось загрузить компании")).toHaveCount(0);
  await expect(page.getByTestId(/^company-card-/)).toHaveCount(2, { timeout: 30_000 });
  await expect(page.getByTestId(`select-company-${handles["company.a"]}`)).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByTestId(`select-company-${handles["company.b"]}`)).toBeVisible({
    timeout: 30_000,
  });
  await context.close();
});
