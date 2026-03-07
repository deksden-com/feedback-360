import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { type Page, expect, test } from "@playwright/test";

const artifactsDir = resolve(
  process.cwd(),
  "../..",
  ".memory-bank/evidence/EP-016/FT-0161/2026-03-06",
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

test("FT-0161: HR filters employee directory and opens profile", async ({ page }) => {
  test.setTimeout(120_000);

  const seededResponse = await page.request.post("/api/dev/seed", {
    data: { scenario: "S2_org_basic" },
  });
  expect(seededResponse.ok()).toBeTruthy();
  const seeded = (await seededResponse.json()) as {
    ok?: boolean;
    handles?: Record<string, string>;
  };
  expect(seeded.ok).toBeTruthy();

  const companyId = seeded.handles?.["company.main"];
  const hrAdminUserId = seeded.handles?.["user.hr_admin"];
  const departmentA = seeded.handles?.["department.a"];
  const staffA1 = seeded.handles?.["employee.staff_a1"];

  expect(companyId).toBeTruthy();
  expect(hrAdminUserId).toBeTruthy();
  expect(departmentA).toBeTruthy();
  expect(staffA1).toBeTruthy();

  await loginWithCompany(page, String(hrAdminUserId), String(companyId));
  await page.goto(
    `/hr/employees?departmentId=${departmentA}&status=active&search=${encodeURIComponent("staff.a1@acme.example")}`,
  );

  await expect(page.getByRole("heading", { name: "Сотрудники" })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("scr-hr-employees-root")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("scr-hr-employees-toolbar")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("employee-directory-search")).toHaveValue("staff.a1@acme.example");

  await expect(page.getByTestId(`employee-row-${staffA1}`)).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId(`employee-open-${staffA1}`)).toBeVisible({ timeout: 20_000 });
  await page.getByTestId(`employee-open-${staffA1}`).click();

  await expect(page).toHaveURL(new RegExp(`/hr/employees/${staffA1}$`));
  await expect(page.getByTestId("scr-hr-employee-detail-root")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("employee-profile-summary")).toBeVisible({ timeout: 60_000 });
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-01-employee-directory-and-profile.png`,
  });
});
