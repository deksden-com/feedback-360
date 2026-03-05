import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL;
const userId = process.env.BETA_SMOKE_USER_ID;

test("SMOKE(beta): select-company loads for provisioned user", async ({ page }) => {
  if (!baseUrl) {
    throw new Error("PLAYWRIGHT_BASE_URL is required for beta smoke test.");
  }
  if (!userId) {
    throw new Error("BETA_SMOKE_USER_ID is required for beta smoke test.");
  }

  const loginResponse = await page.request.post("/api/dev/test-login", {
    data: {
      userId,
    },
  });
  expect(loginResponse.ok()).toBeTruthy();

  await page.goto("/select-company");
  await expect(page.getByRole("heading", { name: "Выберите компанию" })).toBeVisible();
  await expect(page.getByText("Не удалось загрузить компании")).toHaveCount(0);
  await expect(page.getByTestId(/^company-card-/).first()).toBeVisible();
});
