import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { type Page, expect, test } from "@playwright/test";

const artifactsDir = resolve(
  process.cwd(),
  "../..",
  ".memory-bank/evidence/EP-010/FT-0101/2026-03-06",
);

const loginWithCompany = async (page: Page, userId: string, companyId: string) => {
  const loginResponse = await page.request.post("/api/dev/test-login", {
    data: {
      userId,
    },
  });
  expect(loginResponse.ok()).toBeTruthy();

  const companyResponse = await page.request.post("/api/session/active-company", {
    data: {
      companyId,
    },
  });
  expect(companyResponse.ok()).toBeTruthy();
};

test.beforeAll(async () => {
  await mkdir(artifactsDir, { recursive: true });
});

test("FT-0101: hr_reader is redacted, hr_admin keeps raw comments", async ({ page }) => {
  test.setTimeout(120_000);

  const seededResponse = await page.request.post("/api/dev/seed", {
    data: {
      scenario: "S9_campaign_completed_with_ai",
    },
  });
  expect(seededResponse.ok()).toBeTruthy();
  const seeded = (await seededResponse.json()) as {
    ok?: boolean;
    handles?: Record<string, string>;
  };
  expect(seeded.ok).toBeTruthy();

  const campaignId = seeded.handles?.["campaign.main"];
  const companyId = seeded.handles?.["company.main"];
  const subjectEmployeeId = seeded.handles?.["employee.subject_main"];
  const hrReaderUserId = seeded.handles?.["user.hr_reader"];
  const hrAdminUserId = seeded.handles?.["user.hr_admin"];

  expect(campaignId).toBeTruthy();
  expect(companyId).toBeTruthy();
  expect(subjectEmployeeId).toBeTruthy();
  expect(hrReaderUserId).toBeTruthy();
  expect(hrAdminUserId).toBeTruthy();

  await loginWithCompany(page, String(hrReaderUserId), String(companyId));
  await page.goto(`/results/hr?campaignId=${campaignId}&subjectEmployeeId=${subjectEmployeeId}`);
  await expect(page.getByRole("heading", { name: "HR результаты" })).toBeVisible();
  await expect(page.getByText("processed + summary комментарии без raw текста.")).toBeVisible();
  await expect(page.getByTestId(/^open-text-raw-/)).toHaveCount(0);
  await expect(page.getByTestId(/^open-text-processed-/).first()).toBeVisible();
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-01-hr-reader-results-redacted.png`,
  });

  await loginWithCompany(page, String(hrAdminUserId), String(companyId));
  await page.goto(`/results/hr?campaignId=${campaignId}&subjectEmployeeId=${subjectEmployeeId}`);
  await expect(page.getByRole("heading", { name: "HR результаты" })).toBeVisible();
  await expect(page.getByText("raw + processed + summary комментарии.")).toBeVisible();
  await expect(page.getByTestId(/^open-text-raw-/).first()).toBeVisible();
  await expect(page.getByTestId(/^open-text-processed-/).first()).toBeVisible();
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-02-hr-admin-results-with-raw.png`,
  });
});
