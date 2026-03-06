import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { type Page, expect, test } from "@playwright/test";

const artifactsDir = resolve(
  process.cwd(),
  "../..",
  ".memory-bank/evidence/EP-012/FT-0123/2026-03-06",
);

const loginWithCompany = async (page: Page, userId: string, companyId: string) => {
  const loginResponse = await page.request.post("/api/dev/test-login", {
    data: { userId },
  });
  expect(loginResponse.ok()).toBeTruthy();

  const companyResponse = await page.request.post("/api/session/active-company", {
    data: { companyId },
  });
  expect(companyResponse.ok()).toBeTruthy();
};

test.beforeAll(async () => {
  await mkdir(artifactsDir, { recursive: true });
});

test("FT-0123: HR detail dashboard supports start, lock state, and AI retry", async ({ page }) => {
  test.setTimeout(240_000);

  const draftSeedResponse = await page.request.post("/api/dev/seed", {
    data: {
      scenario: "S4_campaign_draft",
    },
  });
  expect(draftSeedResponse.ok()).toBeTruthy();
  const draftSeed = (await draftSeedResponse.json()) as {
    ok?: boolean;
    handles?: Record<string, string>;
  };
  expect(draftSeed.ok).toBeTruthy();

  const draftCampaignId = draftSeed.handles?.["campaign.main"];
  const draftCompanyId = draftSeed.handles?.["company.main"];
  const draftHrUserId = draftSeed.handles?.["user.hr_admin"];
  expect(draftCampaignId).toBeTruthy();
  expect(draftCompanyId).toBeTruthy();
  expect(draftHrUserId).toBeTruthy();
  if (!draftCampaignId || !draftCompanyId || !draftHrUserId) {
    throw new Error("Missing required draft seed handles for FT-0123.");
  }

  await loginWithCompany(page, draftHrUserId, draftCompanyId);
  await page.goto(`/hr/campaigns/${draftCampaignId}`);
  await expect(page.getByTestId("campaign-detail-overview")).toBeVisible();
  await page.getByTestId("campaign-start-button").click();
  await expect(page.getByTestId("hr-campaign-message")).toContainText("Статус кампании", {
    timeout: 15_000,
  });
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-01-detail-started.png`,
  });

  const startedSeedResponse = await page.request.post("/api/dev/seed", {
    data: {
      scenario: "S5_campaign_started_no_answers",
    },
  });
  expect(startedSeedResponse.ok()).toBeTruthy();
  const startedSeed = (await startedSeedResponse.json()) as {
    ok?: boolean;
    handles?: Record<string, string>;
  };
  expect(startedSeed.ok).toBeTruthy();

  const startedCampaignId = startedSeed.handles?.["campaign.main"];
  const startedCompanyId = startedSeed.handles?.["company.main"];
  const startedHrUserId = startedSeed.handles?.["user.hr_admin"];
  const raterUserId = startedSeed.handles?.["user.head_a"];
  const questionnaireId = startedSeed.handles?.["questionnaire.main"];
  expect(startedCampaignId).toBeTruthy();
  expect(startedCompanyId).toBeTruthy();
  expect(startedHrUserId).toBeTruthy();
  expect(raterUserId).toBeTruthy();
  expect(questionnaireId).toBeTruthy();
  if (
    !startedCampaignId ||
    !startedCompanyId ||
    !startedHrUserId ||
    !raterUserId ||
    !questionnaireId
  ) {
    throw new Error("Missing required started seed handles for FT-0123.");
  }

  await loginWithCompany(page, raterUserId, startedCompanyId);
  const draftSaveResponse = await page.request.post("/api/questionnaires/draft", {
    data: {
      questionnaireId,
      draft: {
        note: "lock trigger",
      },
    },
    headers: {
      "content-type": "application/json",
    },
  });
  expect(draftSaveResponse.ok()).toBeTruthy();

  await loginWithCompany(page, startedHrUserId, startedCompanyId);
  await page.goto(`/hr/campaigns/${startedCampaignId}`);
  await expect(page.getByTestId("campaign-detail-lock-banner")).toBeVisible();
  await expect(page.getByTestId("weights-apply-button")).toBeDisabled();
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-02-detail-locked.png`,
  });

  const endedSeedResponse = await page.request.post("/api/dev/seed", {
    data: {
      scenario: "S8_campaign_ended",
    },
  });
  expect(endedSeedResponse.ok()).toBeTruthy();
  const endedSeed = (await endedSeedResponse.json()) as {
    ok?: boolean;
    handles?: Record<string, string>;
  };
  expect(endedSeed.ok).toBeTruthy();

  const endedCampaignId = endedSeed.handles?.["campaign.main"];
  const endedCompanyId = endedSeed.handles?.["company.main"];
  const endedHrUserId = endedSeed.handles?.["user.hr_admin"];
  expect(endedCampaignId).toBeTruthy();
  expect(endedCompanyId).toBeTruthy();
  expect(endedHrUserId).toBeTruthy();
  if (!endedCampaignId || !endedCompanyId || !endedHrUserId) {
    throw new Error("Missing required ended seed handles for FT-0123.");
  }

  await loginWithCompany(page, endedHrUserId, endedCompanyId);
  await page.goto(`/hr/campaigns/${endedCampaignId}`);
  await expect(page.getByTestId("campaign-detail-actions")).toContainText("AI post-processing");
  await page.getByTestId("campaign-ai-retry-button").click();
  await expect(page.getByTestId("hr-campaign-message")).toContainText("AI job", {
    timeout: 15_000,
  });
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-03-detail-ai-retry.png`,
  });
});
