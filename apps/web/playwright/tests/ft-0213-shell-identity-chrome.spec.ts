import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { type Page, expect, test } from "@playwright/test";

const artifactsDir = resolve(
  process.cwd(),
  "../..",
  ".memory-bank/evidence/EP-021/FT-0213/2026-03-07",
);

const loginWithCompany = async (page: Page, userId: string, companyId: string) => {
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

test("FT-0213: shell shows SaaS-like account chrome and grouped navigation", async ({ page }) => {
  test.setTimeout(120_000);

  const seededResponse = await page.request.post("/api/dev/seed", {
    data: { scenario: "S7_campaign_started_some_submitted" },
  });
  expect(seededResponse.ok()).toBeTruthy();
  const seeded = (await seededResponse.json()) as {
    ok?: boolean;
    handles?: Record<string, string>;
  };
  expect(seeded.ok).toBeTruthy();

  const companyId = seeded.handles?.["company.main"];
  const hrAdminUserId = seeded.handles?.["user.hr_admin"];
  expect(companyId).toBeTruthy();
  expect(hrAdminUserId).toBeTruthy();

  await loginWithCompany(page, String(hrAdminUserId), String(companyId));
  await page.goto("/");

  await expect(page.getByTestId("internal-app-shell")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("shell-company-card")).toContainText("Acme 360");
  await expect(page.getByTestId("nav-section-workspace").first()).toBeVisible();
  await expect(page.getByTestId("nav-section-people").first()).toBeVisible();
  await expect(page.getByTestId("nav-section-campaigns").first()).toBeVisible();
  await expect(page.getByTestId("shell-account-name-desktop")).toBeVisible();

  await page.getByTestId("shell-account-menu").locator("summary").click();
  await expect(page.getByTestId("shell-sign-out-desktop")).toBeVisible();

  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-01-shell-account-menu__(SCR-APP-HOME).png`,
  });
});
