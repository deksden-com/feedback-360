import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

const artifactsDir = resolve(
  process.cwd(),
  "../..",
  ".memory-bank/evidence/EP-017/FT-0172/2026-03-06",
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

test("FT-0172: HR edits draft model and publishes valid version", async ({ page }) => {
  test.setTimeout(120_000);

  const seededResponse = await page.request.post("/api/dev/seed", {
    data: { scenario: "S4_campaign_draft" },
  });
  expect(seededResponse.ok()).toBeTruthy();
  const seeded = (await seededResponse.json()) as {
    ok?: boolean;
    handles?: Record<string, string>;
  };

  const companyId = seeded.handles?.["company.main"];
  const hrAdminUserId = seeded.handles?.["user.hr_admin"];
  expect(companyId).toBeTruthy();
  expect(hrAdminUserId).toBeTruthy();

  await loginWithCompany(page, String(hrAdminUserId), String(companyId));
  await page.goto("/hr/models/new?kind=levels");

  await expect(page.getByTestId("model-editor-root")).toBeVisible({ timeout: 60_000 });
  await page.getByTestId("add-group").click();
  await page.getByTestId("group-weight-0").fill("80");
  await page.getByTestId("group-weight-1").fill("10");
  await expect(page.getByTestId("model-editor-weight-warning")).toBeVisible();

  await page.getByTestId("group-weight-1").fill("20");
  await expect(page.getByTestId("model-editor-total-weight")).toContainText("100%");
  await page.getByTestId("model-editor-name").fill("Leadership Levels v1");
  await page.getByTestId("model-editor-save").click();

  await expect(page).toHaveURL(/\/hr\/models\/.+\?saved=1$/, { timeout: 30_000 });
  await expect(page.getByTestId("model-editor-status")).toContainText("Черновик", {
    timeout: 30_000,
  });
  await page.getByTestId("model-editor-publish").click();

  await expect(page).toHaveURL(/\/hr\/models\/.+\?published=1$/, { timeout: 30_000 });
  await expect(page.getByTestId("model-editor-status")).toContainText("Опубликована", {
    timeout: 30_000,
  });
  await expect(page.getByTestId("model-editor-readonly-copy")).toBeVisible({ timeout: 30_000 });

  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-01-model-editor-published.png`,
  });
});
