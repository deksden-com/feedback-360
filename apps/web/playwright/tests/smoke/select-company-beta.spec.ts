import { expect, test } from "@playwright/test";

import { loginAsUser, seedScenario } from "./beta-helpers";

test("SMOKE(beta): select-company loads for provisioned user", async ({ page }) => {
  test.setTimeout(90_000);
  const handles = await seedScenario(page.request, "S1_multi_tenant_min");
  const userId = handles["user.shared"];

  expect(userId).toBeTruthy();
  await loginAsUser(page, String(userId));

  await page.goto("/select-company");
  await expect(page.getByRole("heading", { name: "Выберите компанию" })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText("Не удалось загрузить компании")).toHaveCount(0);
  await expect(page.getByTestId(/^company-card-/)).toHaveCount(2);
  await expect(page.getByTestId(`select-company-${handles["company.a"]}`)).toBeVisible();
  await expect(page.getByTestId(`select-company-${handles["company.b"]}`)).toBeVisible();
});
