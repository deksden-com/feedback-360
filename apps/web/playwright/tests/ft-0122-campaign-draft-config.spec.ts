import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { type Page, expect, test } from "@playwright/test";

const artifactsDir = resolve(
  process.cwd(),
  "../..",
  ".memory-bank/evidence/EP-012/FT-0122/2026-03-06",
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

test("FT-0122: HR creates and reopens campaign draft configuration", async ({ page }) => {
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
  expect(companyId).toBeTruthy();
  expect(hrUserId).toBeTruthy();
  if (!companyId || !hrUserId) {
    throw new Error("Missing required seed handles for FT-0122.");
  }

  await loginWithCompany(page, hrUserId, companyId);
  await page.goto("/hr/campaigns/new");
  await expect(page.getByTestId("campaign-draft-form")).toBeVisible({ timeout: 60_000 });

  await page.getByTestId("campaign-draft-name").fill("Q2 Leadership Review");
  await page.getByTestId("campaign-draft-timezone").fill("Europe/Moscow");
  await page.getByTestId("campaign-draft-start-at").fill("2026-04-02T10:00");
  await page.getByTestId("campaign-draft-end-at").fill("2026-04-25T18:30");
  await page.getByTestId("campaign-draft-weight-manager").fill("50");
  await page.getByTestId("campaign-draft-weight-peers").fill("25");
  await page.getByTestId("campaign-draft-weight-subordinates").fill("25");
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-01-draft-create-form.png`,
  });

  await page.getByTestId("campaign-draft-save").click();
  await expect(page).toHaveURL(/\/hr\/campaigns\/.+\?created=1/);
  await expect(page.getByTestId("campaign-detail-flash")).toContainText("Draft кампании создан", {
    timeout: 30_000,
  });
  await expect(page.getByTestId("campaign-detail-name")).toContainText("Q2 Leadership Review", {
    timeout: 30_000,
  });

  const createdCampaignUrl = new URL(page.url());
  const pathParts = createdCampaignUrl.pathname.split("/");
  const campaignId = pathParts.at(-1);
  expect(campaignId).toBeTruthy();
  if (!campaignId) {
    throw new Error("Campaign id missing after draft create redirect.");
  }

  await page.goto(`/hr/campaigns/${campaignId}/edit`);
  await expect(page.getByTestId("campaign-draft-form")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("campaign-draft-name")).toHaveValue("Q2 Leadership Review");
  await expect(page.getByTestId("campaign-draft-timezone")).toHaveValue("Europe/Moscow");
  await expect(page.getByTestId("campaign-draft-start-at")).toHaveValue("2026-04-02T10:00");
  await expect(page.getByTestId("campaign-draft-end-at")).toHaveValue("2026-04-25T18:30");
  await expect(page.getByTestId("campaign-draft-weight-manager")).toHaveValue("50");
  await expect(page.getByTestId("campaign-draft-weight-peers")).toHaveValue("25");
  await expect(page.getByTestId("campaign-draft-weight-subordinates")).toHaveValue("25");
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-02-draft-edit-reopen.png`,
  });
});
