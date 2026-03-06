import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

const artifactsDir = resolve(
  process.cwd(),
  "../..",
  ".memory-bank/evidence/EP-019/FT-0192/2026-03-06",
);

const loginWithCompany = async (
  page: import("@playwright/test").Page,
  userId: string,
  companyId: string,
) => {
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

test("FT-0192: HR inspects AI jobs and duplicate webhook receipts", async ({ page }) => {
  test.setTimeout(120_000);

  const fixtureResponse = await page.request.post("/api/dev/seed", {
    data: { scenario: "S9_campaign_completed_with_ai" },
  });
  expect(fixtureResponse.ok()).toBeTruthy();
  const fixture = (await fixtureResponse.json()) as {
    ok?: boolean;
    handles?: Record<string, string>;
  };

  const companyId = fixture.handles?.["company.main"];
  const hrAdminUserId = fixture.handles?.["user.hr_admin"];
  const campaignId = fixture.handles?.["campaign.main"];
  expect(companyId).toBeTruthy();
  expect(hrAdminUserId).toBeTruthy();
  expect(campaignId).toBeTruthy();

  await loginWithCompany(page, String(hrAdminUserId), String(companyId));

  const aiRunResponse = await page.request.post("/api/hr/campaigns/execute", {
    data: {
      action: "ai.runForCampaign",
      input: { campaignId },
    },
  });
  expect(aiRunResponse.ok()).toBeTruthy();
  const aiRun = (await aiRunResponse.json()) as {
    ok?: boolean;
    data?: { aiJobId?: string };
  };
  expect(aiRun.ok).toBeTruthy();
  const aiJobId = aiRun.data?.aiJobId;
  expect(aiJobId).toBeTruthy();

  const webhookFixture = await page.request.post("/api/dev/ops-webhook", {
    data: {
      campaignId,
      aiJobId,
      idempotencyKey: `ft-0192-${campaignId}`,
      questionnaireId: fixture.handles?.["questionnaire.subject_manager"],
      competencyId: fixture.handles?.["competency.main"],
    },
  });
  expect(webhookFixture.ok()).toBeTruthy();

  await page.goto("/ops");

  await expect(page.getByTestId("ops-ai-card")).toBeVisible();
  await page.getByTestId("ops-campaign-filter").selectOption(String(campaignId));
  await page.getByTestId("ops-ai-status-filter").selectOption("completed");
  await Promise.all([
    page.waitForResponse(/\/api\/ops\/execute$/, { timeout: 30_000 }),
    page.getByTestId("ops-ai-refresh").click(),
  ]);

  await expect(page.getByTestId("ops-ai-row")).toHaveCount(1);
  await expect(page.getByTestId("ops-ai-row")).toContainText("deliveries 2");
  await page.getByTestId("ops-ai-receipt").locator("summary").click();
  await expect(page.getByTestId("ops-ai-receipt")).toContainText("Payload:");

  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-01-ai-diagnostics.png`,
  });
});
