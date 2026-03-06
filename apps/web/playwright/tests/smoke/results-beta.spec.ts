import { expect, test } from "@playwright/test";

import { loginWithCompany, seedScenario } from "./beta-helpers";

test("SMOKE(beta): results pages render processed and HR views on completed campaign", async ({
  browser,
}) => {
  test.setTimeout(90_000);
  const employeeContext = await browser.newContext({ baseURL: "https://beta.go360go.ru" });
  const employeePage = await employeeContext.newPage();
  const handles = await seedScenario(employeePage.request, "S9_campaign_completed_with_ai");
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

  await loginWithCompany(employeePage, String(employeeUserId), String(companyId));
  await employeePage.goto(`/results?campaignId=${campaignId}`, { waitUntil: "domcontentloaded" });
  await expect(employeePage.getByTestId("results-summary")).toBeVisible({ timeout: 30_000 });
  await expect(employeePage.getByTestId(/^open-text-processed-/).first()).toBeVisible({
    timeout: 30_000,
  });
  await expect(employeePage.getByTestId(/^open-text-raw-/)).toHaveCount(0);
  await employeeContext.close();

  const hrContext = await browser.newContext({ baseURL: "https://beta.go360go.ru" });
  const hrPage = await hrContext.newPage();
  await loginWithCompany(hrPage, String(hrUserId), String(companyId));
  await hrPage.goto(`/results/hr?campaignId=${campaignId}&subjectEmployeeId=${subjectEmployeeId}`, {
    waitUntil: "domcontentloaded",
  });
  await expect(hrPage.getByTestId("results-summary")).toBeVisible({ timeout: 30_000 });
  await expect(hrPage.getByTestId(/^open-text-processed-/).first()).toBeVisible({
    timeout: 30_000,
  });
  await expect(hrPage.getByTestId(/^open-text-raw-/).first()).toBeVisible({ timeout: 30_000 });
  await hrContext.close();
});
