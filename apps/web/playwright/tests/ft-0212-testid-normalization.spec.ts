import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { type Page, expect, test } from "@playwright/test";

const artifactsDir = resolve(
  process.cwd(),
  "../..",
  ".memory-bank/evidence/EP-021/FT-0212/2026-03-07",
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

test("FT-0212: key UI routes expose normalized screen scopes for automation", async ({ page }) => {
  test.setTimeout(120_000);

  const seededResponse = await page.request.post("/api/dev/seed", {
    data: { scenario: "S9_campaign_completed_with_ai" },
  });
  expect(seededResponse.ok()).toBeTruthy();
  const seeded = (await seededResponse.json()) as {
    ok?: boolean;
    handles?: Record<string, string>;
  };
  expect(seeded.ok).toBeTruthy();

  const companyId = seeded.handles?.["company.main"];
  const hrAdminUserId = seeded.handles?.["user.hr_admin"];
  const campaignId = seeded.handles?.["campaign.main"];
  const subjectEmployeeId = seeded.handles?.["employee.subject_main"];
  expect(companyId).toBeTruthy();
  expect(hrAdminUserId).toBeTruthy();
  expect(campaignId).toBeTruthy();
  expect(subjectEmployeeId).toBeTruthy();

  await loginWithCompany(page, String(hrAdminUserId), String(companyId));

  await page.goto("/");
  await expect(page.getByTestId("home-role-hr_admin")).toBeVisible({ timeout: 60_000 });

  await page.goto("/hr/employees");
  await expect(page.getByTestId("scr-hr-employees-root")).toBeVisible();
  await expect(page.getByTestId("scr-hr-employees-toolbar")).toBeVisible();

  await page.goto("/hr/org");
  await expect(page.getByTestId("scr-hr-org-root")).toBeVisible();

  await page.goto("/questionnaires");
  await expect(page.getByTestId("scr-questionnaires-inbox-root")).toBeVisible();

  await page.goto(`/results/hr?campaignId=${campaignId}&subjectEmployeeId=${subjectEmployeeId}`);
  await expect(page.getByTestId("scr-results-hr-root")).toBeVisible();
  await expect(page.getByTestId("results-layout-hero")).toBeVisible();

  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-01-normalized-selectors__(SCR-RESULTS-HR).png`,
  });
});
