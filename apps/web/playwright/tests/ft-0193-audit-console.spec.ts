import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

const artifactsDir = resolve(
  process.cwd(),
  "../..",
  ".memory-bank/evidence/EP-019/FT-0193/2026-03-06",
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

test("FT-0193: HR Reader sees redacted audit trail and release events", async ({ page }) => {
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
  const hrReaderUserId = fixture.handles?.["user.hr_reader"];
  const campaignId = fixture.handles?.["campaign.main"];
  expect(companyId).toBeTruthy();
  expect(hrAdminUserId).toBeTruthy();
  expect(hrReaderUserId).toBeTruthy();
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
    data?: { wasAlreadyCompleted?: boolean };
  };
  expect(aiRun.ok).toBeTruthy();
  const expectedEventType = aiRun.data?.wasAlreadyCompleted
    ? "ai.job_reused"
    : "ai.job_completed_stub";

  await loginWithCompany(page, String(hrReaderUserId), String(companyId));
  await page.goto("/ops");

  await expect(page.getByTestId("ops-audit-card")).toBeVisible();
  await page.getByTestId("ops-audit-event-type").fill(expectedEventType);
  await page.getByTestId("ops-audit-refresh").click();

  await expect(page.getByTestId("ops-console-flash")).toContainText("Audit trail обновлён");
  await expect(page.getByTestId("ops-audit-row")).toHaveCount(1);
  await expect(page.getByTestId("ops-audit-row")).toContainText("redacted/system");
  await page.getByTestId("ops-audit-metadata").locator("summary").click();
  await expect(page.getByTestId("ops-audit-metadata")).toContainText("{}");

  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-01-audit-console.png`,
  });
});
