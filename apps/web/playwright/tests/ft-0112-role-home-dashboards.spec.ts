import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100";

test("FT-0112: home page is role-aware and leads to the next useful action", async ({ page }) => {
  test.setTimeout(90_000);

  const artifactsDir = resolve(
    process.cwd(),
    "../..",
    ".memory-bank/evidence/EP-011/FT-0112/2026-03-06",
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

  const companyId = seeded.handles?.["company.main"];
  const employeeUserId = seeded.handles?.["user.staff_a1"];
  const managerUserId = seeded.handles?.["user.head_a"];
  const hrAdminUserId = seeded.handles?.["user.hr_admin"];

  if (!companyId || !employeeUserId || !managerUserId || !hrAdminUserId) {
    throw new Error("Missing required seed handles for FT-0112.");
  }

  const loginAs = async (userId: string) => {
    const cookieUrl = new URL(baseUrl);
    await page.context().clearCookies();
    await page.context().addCookies([
      {
        name: "go360go_user_id",
        value: userId,
        domain: cookieUrl.hostname,
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
      {
        name: "go360go_active_company_id",
        value: companyId,
        domain: cookieUrl.hostname,
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    await page.goto("/");
    await expect(page.getByTestId("internal-app-shell")).toBeVisible();
  };

  await loginAs(employeeUserId);
  await expect(page.getByTestId("home-role-employee")).toBeVisible();
  await expect(page.getByTestId("home-cta-questionnaires")).toBeVisible();
  await expect(page.getByTestId("home-cta-results")).toBeVisible();
  await expect(page.getByTestId("home-cta-team-results")).toHaveCount(0);
  await expect(page.getByTestId("home-cta-hr-campaigns")).toHaveCount(0);
  await capture("step-01-employee-home-dashboard.png");
  await page.getByTestId("home-cta-questionnaires").click();
  await expect(page).toHaveURL("/questionnaires");

  await loginAs(managerUserId);
  await expect(page.getByTestId("home-role-manager")).toBeVisible();
  await expect(page.getByTestId("home-cta-team-results")).toBeVisible();
  await expect(page.getByTestId("home-cta-hr-campaigns")).toHaveCount(0);
  await capture("step-02-manager-home-dashboard.png");
  await page.getByTestId("home-cta-team-results").click();
  await expect(page).toHaveURL("/results/team");

  await loginAs(hrAdminUserId);
  await expect(page.getByTestId("home-role-hr_admin")).toBeVisible();
  await expect(page.getByTestId("home-cta-hr-campaigns")).toBeVisible();
  await expect(page.getByTestId("home-cta-hr-results")).toBeVisible();
  await expect(page.getByTestId("home-card-active-employees")).toContainText("8");
  await capture("step-03-hr-home-dashboard.png");
  await page.getByTestId("home-cta-hr-campaigns").click();
  await expect(page).toHaveURL("/hr/campaigns");
});
