import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { type Page, expect, test } from "@playwright/test";

const artifactsDir = resolve(
  process.cwd(),
  "../..",
  ".memory-bank/evidence/EP-008/FT-0084/2026-03-05",
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

test("FT-0084: HR manages draft/start/matrix and lock blocks matrix+weights", async ({ page }) => {
  test.setTimeout(180_000);

  const s4Response = await page.request.post("/api/dev/seed", {
    data: {
      scenario: "S4_campaign_draft",
    },
  });
  expect(s4Response.ok()).toBeTruthy();
  const s4Seeded = (await s4Response.json()) as {
    ok?: boolean;
    handles?: Record<string, string>;
  };
  expect(s4Seeded.ok).toBeTruthy();

  const s4CampaignId = s4Seeded.handles?.["campaign.main"];
  const s4CompanyId = s4Seeded.handles?.["company.main"];
  const hrUserId = s4Seeded.handles?.["user.hr_admin"];
  const subjectEmployeeId = s4Seeded.handles?.["employee.staff_a1"];
  const managerEmployeeId = s4Seeded.handles?.["employee.head_a"];
  expect(s4CampaignId).toBeTruthy();
  expect(s4CompanyId).toBeTruthy();
  expect(hrUserId).toBeTruthy();
  expect(subjectEmployeeId).toBeTruthy();
  expect(managerEmployeeId).toBeTruthy();

  await loginWithCompany(page, String(hrUserId), String(s4CompanyId));
  await page.goto(`/hr/campaigns?campaignId=${s4CampaignId}`);
  await expect(page.getByRole("heading", { name: "HR Campaign Workbench" })).toBeVisible();

  const addParticipantsResponse = await page.request.post("/api/hr/campaigns/execute", {
    data: {
      action: "campaign.participants.add",
      input: {
        campaignId: s4CampaignId,
        employeeIds: [subjectEmployeeId, managerEmployeeId],
      },
    },
    headers: {
      "content-type": "application/json",
    },
  });
  expect(addParticipantsResponse.ok()).toBeTruthy();
  const addParticipantsPayload = (await addParticipantsResponse.json()) as {
    ok?: boolean;
  };
  expect(addParticipantsPayload.ok).toBeTruthy();

  await page.getByTestId("matrix-generate-button").click();
  await expect(page.getByTestId("matrix-generated-count")).not.toContainText(
    "Generated assignments: 0",
  );
  await expect(page.getByTestId("matrix-json-input")).toHaveValue(
    new RegExp(String(subjectEmployeeId)),
  );

  await page.getByTestId("matrix-apply-button").click();
  await expect(page.getByTestId("hr-campaign-error")).toHaveCount(0);

  await page.getByTestId("campaign-start-button").click();
  await expect(page.getByTestId("hr-campaign-error")).toHaveCount(0);
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-01-hr-campaign-start-and-matrix.png`,
  });

  const s5Response = await page.request.post("/api/dev/seed", {
    data: {
      scenario: "S5_campaign_started_no_answers",
    },
  });
  expect(s5Response.ok()).toBeTruthy();
  const s5Seeded = (await s5Response.json()) as {
    ok?: boolean;
    handles?: Record<string, string>;
  };
  expect(s5Seeded.ok).toBeTruthy();

  const s5CampaignId = s5Seeded.handles?.["campaign.main"];
  const s5CompanyId = s5Seeded.handles?.["company.main"];
  const s5HrUserId = s5Seeded.handles?.["user.hr_admin"];
  const s5RaterUserId = s5Seeded.handles?.["user.head_a"];
  const s5QuestionnaireId = s5Seeded.handles?.["questionnaire.main"];
  expect(s5CampaignId).toBeTruthy();
  expect(s5CompanyId).toBeTruthy();
  expect(s5HrUserId).toBeTruthy();
  expect(s5RaterUserId).toBeTruthy();
  expect(s5QuestionnaireId).toBeTruthy();

  await loginWithCompany(page, String(s5RaterUserId), String(s5CompanyId));
  const saveDraftResponse = await page.request.post("/api/questionnaires/draft", {
    data: {
      questionnaireId: s5QuestionnaireId,
      draft: {
        note: "lock trigger",
      },
    },
    headers: {
      "content-type": "application/json",
    },
  });
  expect(saveDraftResponse.ok()).toBeTruthy();
  const saveDraftPayload = (await saveDraftResponse.json()) as { ok?: boolean };
  expect(saveDraftPayload.ok).toBeTruthy();

  await loginWithCompany(page, String(s5HrUserId), String(s5CompanyId));
  await page.goto(`/hr/campaigns?campaignId=${s5CampaignId}`);
  await page.getByTestId("load-campaign-progress").click();
  await expect(page.getByTestId("campaign-lock-state")).not.toContainText("not_locked");
  await expect(page.getByTestId("weights-apply-button")).toBeDisabled();

  const forceLockedResponse = await page.request.post("/api/hr/campaigns/execute", {
    data: {
      action: "campaign.weights.set",
      input: {
        campaignId: s5CampaignId,
        manager: 50,
        peers: 25,
        subordinates: 25,
      },
    },
    headers: {
      "content-type": "application/json",
    },
  });
  expect(forceLockedResponse.status()).toBe(409);
  const forceLockedPayload = (await forceLockedResponse.json()) as {
    ok?: boolean;
    error?: { code?: string };
  };
  expect(forceLockedPayload.ok).toBe(false);
  expect(forceLockedPayload.error?.code).toBe("campaign_locked");

  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-02-hr-campaign-locked.png`,
  });
});

test("FT-0084: HR can trigger AI run from ended campaign", async ({ page }) => {
  const seededResponse = await page.request.post("/api/dev/seed", {
    data: {
      scenario: "S8_campaign_ended",
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
  const hrUserId = seeded.handles?.["user.hr_admin"];
  expect(campaignId).toBeTruthy();
  expect(companyId).toBeTruthy();
  expect(hrUserId).toBeTruthy();

  await loginWithCompany(page, String(hrUserId), String(companyId));
  await page.goto(`/hr/campaigns?campaignId=${campaignId}`);
  await page.getByTestId("campaign-ai-retry-button").click();
  await expect(page.getByTestId("hr-campaign-message")).toContainText("AI job:");
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-03-hr-campaign-ai-retry.png`,
  });
});
