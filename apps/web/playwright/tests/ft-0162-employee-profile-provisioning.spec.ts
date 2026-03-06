import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { type Page, expect, test } from "@playwright/test";

const artifactsDir = resolve(
  process.cwd(),
  "../..",
  ".memory-bank/evidence/EP-016/FT-0162/2026-03-06",
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

test("FT-0162: HR admin creates employee, updates email, provisions access, HR reader stays read-only", async ({
  page,
}) => {
  test.setTimeout(120_000);

  const seededResponse = await page.request.post("/api/dev/seed", {
    data: { scenario: "S1_company_min" },
  });
  expect(seededResponse.ok()).toBeTruthy();
  const seeded = (await seededResponse.json()) as {
    ok?: boolean;
    handles?: Record<string, string>;
  };
  expect(seeded.ok).toBeTruthy();

  const companyId = seeded.handles?.["company.main"];
  const hrAdminUserId = seeded.handles?.["user.hr_admin"];
  const hrReaderUserId = seeded.handles?.["user.hr_reader"];

  expect(companyId).toBeTruthy();
  expect(hrAdminUserId).toBeTruthy();
  expect(hrReaderUserId).toBeTruthy();

  await loginWithCompany(page, String(hrAdminUserId), String(companyId));
  await page.goto("/hr/employees/new");

  await page.getByTestId("employee-form-email").fill("new.person@acme.example");
  await page.getByTestId("employee-form-first-name").fill("New");
  await page.getByTestId("employee-form-last-name").fill("Person");
  await page.getByTestId("employee-form-phone").fill("+10000000999");
  await Promise.all([
    page.waitForURL(/\/hr\/employees\/.+\?flash=saved/),
    page.getByTestId("employee-create-submit").click(),
  ]);
  await expect(page.getByTestId("employee-profile-flash-saved")).toBeVisible({ timeout: 20_000 });
  await expect(page).toHaveURL(/\/hr\/employees\/.+/);

  await page.getByTestId("employee-profile-email-input").fill("new.person.updated@acme.example");
  await Promise.all([
    page.waitForURL(/flash=saved/),
    page.getByTestId("employee-profile-save").click(),
  ]);
  await expect(page.getByTestId("employee-profile-flash-saved")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("employee-profile-email")).toContainText(
    "new.person.updated@acme.example",
    { timeout: 20_000 },
  );

  const employeeProfileUrl = page.url();
  const provisionUserId = "18000000-0000-4000-8000-000000000099";
  await page.getByTestId("employee-provision-user-id").fill(provisionUserId);
  await page.getByTestId("employee-provision-email").fill("new.person.updated@acme.example");
  await page.getByTestId("employee-provision-role").selectOption("manager");
  await Promise.all([
    page.waitForURL(/flash=provisioned/),
    page.getByTestId("employee-provision-submit").click(),
  ]);

  await expect(page.getByTestId("employee-profile-flash-provisioned")).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByTestId("employee-profile-role")).toContainText("Руководитель", {
    timeout: 20_000,
  });
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-01-admin-create-and-provision.png`,
  });

  await loginWithCompany(page, String(hrReaderUserId), String(companyId));
  await page.goto(employeeProfileUrl);
  await expect(page.getByTestId("employee-profile-summary")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("employee-profile-form")).toHaveCount(0);
  await expect(page.getByTestId("employee-provision-form")).toHaveCount(0);
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-02-reader-read-only.png`,
  });
});
