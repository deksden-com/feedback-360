import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { type Page, expect, test } from "@playwright/test";

const artifactsDir = resolve(
  process.cwd(),
  "../..",
  ".memory-bank/evidence/EP-012/FT-0121/2026-03-06",
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

test("FT-0121: HR filters campaigns list and opens detail page", async ({ page }) => {
  test.setTimeout(180_000);

  const seededResponse = await page.request.post("/api/dev/seed", {
    data: {
      scenario: "S4_campaign_draft",
    },
  });
  expect(seededResponse.ok()).toBeTruthy();
  const seeded = (await seededResponse.json()) as {
    ok?: boolean;
    handles?: Record<string, string>;
  };
  expect(seeded.ok).toBeTruthy();

  const companyId = seeded.handles?.["company.main"];
  const hrUserId = seeded.handles?.["user.hr_admin"];
  const draftCampaignId = seeded.handles?.["campaign.main"];
  expect(companyId).toBeTruthy();
  expect(hrUserId).toBeTruthy();
  expect(draftCampaignId).toBeTruthy();
  if (!companyId || !hrUserId || !draftCampaignId) {
    throw new Error("Missing required seed handles for FT-0121.");
  }

  await loginWithCompany(page, hrUserId, companyId);
  await page.goto("/hr/campaigns/new");
  await expect(page.getByTestId("campaign-draft-form")).toBeVisible({ timeout: 60_000 });
  const modelVersionId = await page.getByTestId("campaign-draft-model").inputValue();
  expect(modelVersionId).toBeTruthy();
  if (!modelVersionId) {
    throw new Error("Model version id is required for FT-0121 setup.");
  }

  const createCampaign = async (name: string) => {
    const response = await page.request.post("/api/hr/campaigns/execute", {
      data: {
        action: "campaign.create",
        input: {
          name,
          modelVersionId,
          startAt: "2026-04-01T09:00:00.000Z",
          endAt: "2026-04-30T18:00:00.000Z",
          timezone: "Europe/Kaliningrad",
        },
      },
      headers: {
        "content-type": "application/json",
      },
    });
    expect(response.ok()).toBeTruthy();
    const payload = (await response.json()) as {
      ok?: boolean;
      data?: { campaignId?: string };
    };
    expect(payload.ok).toBeTruthy();
    expect(payload.data?.campaignId).toBeTruthy();
    return String(payload.data?.campaignId);
  };

  const startedCampaignId = await createCampaign("Started campaign");
  const completedCampaignId = await createCampaign("Completed campaign");

  for (const campaignId of [startedCampaignId, completedCampaignId]) {
    const startResponse = await page.request.post("/api/hr/campaigns/execute", {
      data: {
        action: "campaign.start",
        input: { campaignId },
      },
      headers: {
        "content-type": "application/json",
      },
    });
    expect(startResponse.ok()).toBeTruthy();
  }

  const endResponse = await page.request.post("/api/hr/campaigns/execute", {
    data: {
      action: "campaign.end",
      input: { campaignId: completedCampaignId },
    },
    headers: {
      "content-type": "application/json",
    },
  });
  expect(endResponse.ok()).toBeTruthy();

  const aiResponse = await page.request.post("/api/hr/campaigns/execute", {
    data: {
      action: "ai.runForCampaign",
      input: { campaignId: completedCampaignId },
    },
    headers: {
      "content-type": "application/json",
    },
  });
  expect(aiResponse.ok()).toBeTruthy();

  await page.goto("/hr/campaigns");
  await expect(page.getByRole("heading", { name: "HR кампании" })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByTestId("campaign-count-all")).toContainText("3");
  await expect(page.getByTestId("campaign-count-draft")).toContainText("1");
  await expect(page.getByTestId("campaign-count-started")).toContainText("1");
  await expect(page.getByTestId("campaign-count-completed")).toContainText("1");
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-01-campaign-list-overview.png`,
  });

  await page.getByTestId("campaign-filter-started").click();
  await expect(page).toHaveURL(/status=started/);
  await expect(page.getByTestId(`campaign-list-row-${startedCampaignId}`)).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByTestId(`campaign-list-row-${draftCampaignId}`)).toHaveCount(0);
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-02-campaign-list-filtered.png`,
  });

  await page
    .getByTestId(`campaign-list-row-${startedCampaignId}`)
    .getByRole("link", { name: "Открыть detail" })
    .click();
  await expect(page).toHaveURL(`/hr/campaigns/${startedCampaignId}`);
  await expect(page.getByTestId("campaign-detail-overview")).toBeVisible({
    timeout: 30_000,
  });
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-03-campaign-detail-from-list.png`,
  });
});
