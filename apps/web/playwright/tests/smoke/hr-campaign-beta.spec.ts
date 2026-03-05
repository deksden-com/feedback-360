import { expect, test } from "@playwright/test";

import { loginWithCompany, seedScenario } from "./beta-helpers";

test("SMOKE(beta): HR campaign workbench loads ended campaign", async ({ page }) => {
  const handles = await seedScenario(page.request, "S8_campaign_ended");
  const companyId = handles["company.main"];
  const campaignId = handles["campaign.main"];
  const hrUserId = handles["user.hr_admin"];

  expect(companyId).toBeTruthy();
  expect(campaignId).toBeTruthy();
  expect(hrUserId).toBeTruthy();

  await loginWithCompany(page, String(hrUserId), String(companyId));

  await page.goto(`/hr/campaigns?campaignId=${campaignId}`);
  await expect(page.getByRole("heading", { name: "HR Campaign Workbench" })).toBeVisible();
  await expect(page.getByTestId("hr-campaign-workbench")).toBeVisible();
  await expect(page.getByTestId("campaign-ai-retry-button")).toBeVisible();
});
