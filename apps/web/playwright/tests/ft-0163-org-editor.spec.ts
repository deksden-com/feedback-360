import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { type Page, expect, test } from "@playwright/test";

const artifactsDir = resolve(
  process.cwd(),
  "../..",
  ".memory-bank/evidence/EP-016/FT-0163/2026-03-06",
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

test("FT-0163: HR edits department tree, moves employee and updates manager with history preserved", async ({
  page,
}) => {
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
  const departmentB = seeded.handles?.["department.b"];
  const headB = seeded.handles?.["employee.head_b"];
  const staffA1 = seeded.handles?.["employee.staff_a1"];

  expect(companyId).toBeTruthy();
  expect(hrAdminUserId).toBeTruthy();
  expect(departmentA).toBeTruthy();
  expect(departmentB).toBeTruthy();
  expect(headB).toBeTruthy();
  expect(staffA1).toBeTruthy();

  await loginWithCompany(page, String(hrAdminUserId), String(companyId));
  await page.goto(`/hr/org?departmentId=${departmentA}&employeeId=${staffA1}`);

  await expect(page.getByRole("heading", { name: "Оргструктура" })).toBeVisible({
    timeout: 60_000,
  });
  await page.getByTestId("department-name-input").fill("Команда A");
  await Promise.all([
    page.waitForURL(/flash=department-saved/),
    page.getByTestId("department-save-submit").click(),
  ]);
  await expect(page.getByTestId("org-flash-department-saved")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId(`org-tree-row-${departmentA}`)).toContainText("Команда A", {
    timeout: 60_000,
  });

  await page.getByTestId("org-move-department-select").selectOption(String(departmentB));
  await Promise.all([page.waitForURL(/flash=moved/), page.getByTestId("org-move-submit").click()]);
  await expect(page.getByTestId("org-flash-moved")).toBeVisible({ timeout: 60_000 });

  await page.getByTestId("org-manager-select").selectOption(String(headB));
  await Promise.all([
    page.waitForURL(/flash=manager/),
    page.getByTestId("org-manager-submit").click(),
  ]);
  await expect(page.getByTestId("org-flash-manager")).toBeVisible({ timeout: 60_000 });

  await page.goto(`/hr/employees/${staffA1}`);
  await expect(page.getByTestId("employee-profile-department-history")).toContainText("Команда A", {
    timeout: 60_000,
  });
  await expect(page.getByTestId("employee-profile-department-history")).toContainText("Dept B", {
    timeout: 60_000,
  });
  await expect(page.getByTestId("employee-profile-manager-history")).toContainText("Boris HeadB", {
    timeout: 60_000,
  });
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-01-org-editor-history.png`,
  });
});
