import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

const artifactsDir = resolve(
  process.cwd(),
  "../..",
  ".memory-bank/evidence/EP-017/FT-0173/2026-03-06",
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

test("FT-0173: HR generates and saves matrix before lock", async ({ page }) => {
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
  const campaignId = seeded.handles?.["campaign.main"];
  const departmentA = seeded.handles?.["department.a"];

  expect(companyId).toBeTruthy();
  expect(hrAdminUserId).toBeTruthy();
  expect(campaignId).toBeTruthy();
  expect(departmentA).toBeTruthy();

  await loginWithCompany(page, String(hrAdminUserId), String(companyId));
  await page.goto(`/hr/campaigns/${campaignId}/matrix`);

  await expect(page.getByTestId("matrix-builder-root")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("matrix-builder-lock-banner")).toContainText("редактируема");
  await page.getByTestId(`matrix-department-${departmentA}`).check();
  await page.getByTestId("matrix-generate").click();

  await expect(page.getByTestId("matrix-builder-flash")).toContainText("Матрица сгенерирована", {
    timeout: 30_000,
  });
  await expect(page.locator('[data-testid^="matrix-group-"]')).toHaveCount(3, {
    timeout: 30_000,
  });

  await page.getByTestId("matrix-save").click();
  await expect(page.getByTestId("matrix-builder-flash")).toContainText("Матрица сохранена", {
    timeout: 30_000,
  });

  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-01-matrix-builder-editable.png`,
  });
});

test("FT-0173: locked campaign matrix becomes read-only after first draft save", async ({
  page,
}) => {
  test.setTimeout(120_000);

  const seededResponse = await page.request.post("/api/dev/seed", {
    data: { scenario: "S6_campaign_started_some_drafts" },
  });
  expect(seededResponse.ok()).toBeTruthy();
  const seeded = (await seededResponse.json()) as {
    ok?: boolean;
    handles?: Record<string, string>;
  };

  const companyId = seeded.handles?.["company.main"];
  const hrAdminUserId = seeded.handles?.["user.hr_admin"];
  const campaignId = seeded.handles?.["campaign.main"];

  expect(companyId).toBeTruthy();
  expect(hrAdminUserId).toBeTruthy();
  expect(campaignId).toBeTruthy();

  await loginWithCompany(page, String(hrAdminUserId), String(companyId));
  await page.goto(`/hr/campaigns/${campaignId}/matrix`);

  await expect(page.getByTestId("matrix-builder-root")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("matrix-builder-lock-banner")).toContainText("зафиксирована");
  await expect(page.getByTestId("matrix-generate")).toBeDisabled();
  await expect(page.getByTestId("matrix-save")).toBeDisabled();

  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-02-matrix-builder-locked.png`,
  });
});
