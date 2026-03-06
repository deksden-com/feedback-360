import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

const artifactsDir = resolve(
  process.cwd(),
  "../..",
  ".memory-bank/evidence/EP-019/FT-0191/2026-03-06",
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

test("FT-0191: HR sees health, release metadata and ops checks", async ({ page }) => {
  test.setTimeout(120_000);

  const fixtureResponse = await page.request.post("/api/dev/seed", {
    data: { scenario: "S9_campaign_completed_with_ai" },
  });
  expect(fixtureResponse.ok()).toBeTruthy();
  const fixture = (await fixtureResponse.json()) as {
    ok?: boolean;
    handles?: Record<string, string>;
  };
  expect(fixture.ok).toBeTruthy();

  const companyId = fixture.handles?.["company.main"];
  const hrAdminUserId = fixture.handles?.["user.hr_admin"];
  expect(companyId).toBeTruthy();
  expect(hrAdminUserId).toBeTruthy();

  await loginWithCompany(page, String(hrAdminUserId), String(companyId));
  await page.goto("/ops");

  await expect(page.getByTestId("ops-health-card")).toBeVisible();
  await expect(page.getByText("Health & release")).toBeVisible();
  await expect(page.getByTestId("ops-app-env")).toHaveText(/beta|local|test/i);
  await expect(page.getByTestId("ops-health-check-web")).toBeVisible();
  await expect(page.getByTestId("ops-health-check-db")).toBeVisible();

  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-01-health-release-dashboard.png`,
  });
});
