import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

const artifactsDir = resolve(
  process.cwd(),
  "../..",
  ".memory-bank/evidence/EP-017/FT-0171/2026-03-06",
);

const loginWithCompany = async (
  page: import("@playwright/test").Page,
  userId: string,
  companyId: string,
) => {
  const loginResponse = await page.request.post("/api/dev/test-login", { data: { userId } });
  expect(loginResponse.ok()).toBeTruthy();

  const companyResponse = await page.request.post("/api/session/active-company", {
    data: { companyId },
  });
  expect(companyResponse.ok()).toBeTruthy();
};

test.beforeAll(async () => {
  await mkdir(artifactsDir, { recursive: true });
});

test("FT-0171: HR sees model catalog and clones draft", async ({ page }) => {
  test.setTimeout(120_000);

  const seededResponse = await page.request.post("/api/dev/seed", {
    data: { scenario: "S4_campaign_draft" },
  });
  expect(seededResponse.ok()).toBeTruthy();
  const seeded = (await seededResponse.json()) as {
    ok?: boolean;
    handles?: Record<string, string>;
  };
  expect(seeded.ok).toBeTruthy();

  const companyId = seeded.handles?.["company.main"];
  const hrAdminUserId = seeded.handles?.["user.hr_admin"];
  const sourceModelVersionId = seeded.handles?.["model.version.main"];

  expect(companyId).toBeTruthy();
  expect(hrAdminUserId).toBeTruthy();
  expect(sourceModelVersionId).toBeTruthy();

  await loginWithCompany(page, String(hrAdminUserId), String(companyId));
  await page.goto("/hr/models");

  await expect(page.getByRole("heading", { name: "Модели компетенций" })).toBeVisible({
    timeout: 60_000,
  });
  await expect(page.getByTestId(`model-row-${sourceModelVersionId}`)).toBeVisible();
  await expect(page.getByTestId(`model-status-${sourceModelVersionId}`)).toContainText(
    "Опубликована",
  );

  await page.getByTestId(`model-clone-${sourceModelVersionId}`).click();
  await expect(page).toHaveURL(/\/hr\/models\/.+\?cloned=1$/, { timeout: 30_000 });
  await expect(page.getByTestId("model-editor-root")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("model-editor-status")).toContainText("Черновик", {
    timeout: 30_000,
  });

  await page.goto("/hr/models");
  await expect(page.getByTestId("model-catalog-search")).toBeVisible();
  await expect(page.locator('[data-testid^="model-row-"]')).toHaveCount(2, {
    timeout: 30_000,
  });

  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-01-model-catalog-clone.png`,
  });
});
