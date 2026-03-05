import { expect, test } from "@playwright/test";

import { loginWithCompany, seedScenario } from "./beta-helpers";

test("SMOKE(beta): results pages render processed and HR views on completed campaign", async ({
  page,
}) => {
  const handles = await seedScenario(page.request, "S9_campaign_completed_with_ai");
  const companyId = handles["company.main"];
  const campaignId = handles["campaign.main"];
  const subjectEmployeeId = handles["employee.subject_main"];
  const employeeUserId = handles["user.staff_a1"];
  const hrUserId = handles["user.hr_admin"];

  expect(companyId).toBeTruthy();
  expect(campaignId).toBeTruthy();
  expect(subjectEmployeeId).toBeTruthy();
  expect(employeeUserId).toBeTruthy();
  expect(hrUserId).toBeTruthy();

  await loginWithCompany(page, String(employeeUserId), String(companyId));
  await page.goto(`/results?campaignId=${campaignId}`);
  await expect(page.getByRole("heading", { name: "Мои результаты" })).toBeVisible();
  await expect(page.getByTestId("results-summary")).toBeVisible();
  await expect(page.getByTestId(/^open-text-processed-/).first()).toBeVisible();
  await expect(page.getByTestId(/^open-text-raw-/)).toHaveCount(0);

  await loginWithCompany(page, String(hrUserId), String(companyId));
  await page.goto(`/results/hr?campaignId=${campaignId}&subjectEmployeeId=${subjectEmployeeId}`);
  await expect(page.getByRole("heading", { name: "HR результаты" })).toBeVisible();
  await expect(page.getByTestId("results-summary")).toBeVisible();
  await expect(page.getByTestId(/^open-text-processed-/).first()).toBeVisible();
  await expect(page.getByTestId(/^open-text-raw-/).first()).toBeVisible();
});
