import { expect, test } from "@playwright/test";

import { loginWithCompany, seedScenario } from "./beta-helpers";

test("SMOKE(beta): HR campaign workbench loads ended campaign", async ({ browser }) => {
  test.setTimeout(90_000);
  const context = await browser.newContext({ baseURL: "https://beta.go360go.ru" });
  const page = await context.newPage();
  const handles = await seedScenario(page.request, "S8_campaign_ended");
  const companyId = handles["company.main"];
  const campaignId = handles["campaign.main"];
  const hrUserId = handles["user.hr_admin"];

  expect(companyId).toBeTruthy();
  expect(campaignId).toBeTruthy();
  expect(hrUserId).toBeTruthy();

  await loginWithCompany(page, String(hrUserId), String(companyId));

  await page.goto(`/hr/campaigns/${campaignId}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("campaign-detail-overview")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("hr-campaign-workbench")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("campaign-ai-retry-button")).toBeVisible({ timeout: 15_000 });
  await context.close();
});
