import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

test("FT-0111: internal app shell keeps company context and role-aware nav", async ({ page }) => {
  test.setTimeout(90_000);
  const artifactsDir = resolve(
    process.cwd(),
    "../..",
    ".memory-bank/evidence/EP-011/FT-0111/2026-03-06",
  );
  await mkdir(artifactsDir, { recursive: true });

  const capture = async (fileName: string) => {
    await page.screenshot({
      path: `${artifactsDir}/${fileName}`,
      timeout: 15_000,
    });
  };

  const seededResponse = await page.request.post("/api/dev/seed", {
    data: {
      scenario: "S7_campaign_started_some_submitted",
    },
  });
  expect(seededResponse.ok()).toBeTruthy();
  const seeded = (await seededResponse.json()) as {
    ok?: boolean;
    handles?: Record<string, string>;
  };
  expect(seeded.ok).toBeTruthy();

  const userEmployeeId = seeded.handles?.["user.staff_a1"];
  const userManagerId = seeded.handles?.["user.head_a"];
  const userHrAdminId = seeded.handles?.["user.hr_admin"];
  const companyId = seeded.handles?.["company.main"];
  expect(userEmployeeId).toBeTruthy();
  expect(userManagerId).toBeTruthy();
  expect(userHrAdminId).toBeTruthy();
  expect(companyId).toBeTruthy();
  if (!userEmployeeId || !userManagerId || !userHrAdminId || !companyId) {
    throw new Error("Missing required seed handles for FT-0111.");
  }

  const loginAs = async (userId: string) => {
    await page.context().clearCookies();
    const loginResponse = await page.request.post("/api/dev/test-login", { data: { userId } });
    expect(loginResponse.ok()).toBeTruthy();

    const companyResponse = await page.request.post("/api/session/active-company", {
      data: { companyId },
    });
    expect(companyResponse.ok()).toBeTruthy();

    await page.goto("/");
    await expect(page).toHaveURL("/");
    await expect(page.getByTestId("internal-app-shell")).toBeVisible({ timeout: 60_000 });
  };

  await loginAs(userEmployeeId);
  await expect(page.getByTestId("shell-company-name")).toContainText("Acme 360");
  await expect(page.getByTestId("shell-account-menu")).toBeVisible();
  await expect(page.getByTestId("nav-section-workspace").first()).toBeVisible();
  await expect(page.getByTestId("nav-home").first()).toBeVisible();
  await expect(page.getByTestId("nav-questionnaires").first()).toBeVisible();
  await expect(page.getByTestId("nav-results").first()).toBeVisible();
  await expect(page.getByTestId("nav-hr-campaigns")).toHaveCount(0);
  await expect(page.getByTestId("nav-results-team")).toHaveCount(0);
  await capture("step-01-employee-home-shell.png");

  await page.getByTestId("nav-results").first().click();
  await expect(page).toHaveURL("/results");
  await expect(page.getByTestId("internal-app-shell")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("shell-company-name")).toContainText("Acme 360");
  await capture("step-02-results-shell.png");

  await loginAs(userManagerId);
  await expect(page.getByTestId("nav-section-team").first()).toBeVisible();
  await expect(page.getByTestId("nav-results-team").first()).toBeVisible();
  await expect(page.getByTestId("nav-hr-campaigns")).toHaveCount(0);
  await page.getByTestId("nav-results-team").first().click();
  await expect(page).toHaveURL("/results/team");
  await expect(page.getByTestId("internal-app-shell")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("shell-company-name")).toContainText("Acme 360");
  await capture("step-03-manager-team-results-shell.png");

  await loginAs(userHrAdminId);
  await expect(page.getByTestId("nav-section-people").first()).toBeVisible();
  await expect(page.getByTestId("nav-section-campaigns").first()).toBeVisible();
  await expect(page.getByTestId("nav-hr-campaigns").first()).toBeVisible();
  await expect(page.getByTestId("nav-results-hr").first()).toBeVisible();
  await expect(page.getByTestId("nav-results-team")).toHaveCount(0);
  await page.getByTestId("nav-hr-campaigns").first().click();
  await expect(page).toHaveURL("/hr/campaigns");
  await expect(page.getByTestId("internal-app-shell")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("shell-company-name")).toContainText("Acme 360");
  await capture("step-04-hr-campaigns-shell.png");
});
