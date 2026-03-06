import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { type Page, expect, test } from "@playwright/test";
const artifactsDir = resolve(
  process.cwd(),
  "../..",
  ".memory-bank/evidence/EP-014/FT-0143/2026-03-06",
);

const loginWithCompany = async (page: Page, values: { userId: string; companyId: string }) => {
  const loginResponse = await page.request.post("/api/dev/test-login", {
    data: { userId: values.userId },
  });
  expect(loginResponse.ok()).toBeTruthy();

  const companyResponse = await page.request.post("/api/session/active-company", {
    data: { companyId: values.companyId },
  });
  expect(companyResponse.ok()).toBeTruthy();
};

const capture = async (page: Page, fileName: string) => {
  await mkdir(artifactsDir, { recursive: true });
  await page.screenshot({
    path: `${artifactsDir}/${fileName}`,
    timeout: 15_000,
    fullPage: true,
  });
};

test.beforeAll(async () => {
  await mkdir(artifactsDir, { recursive: true });
});

test("FT-0143: HR campaigns surfaces remain healthy after slice refactor", async ({ page }) => {
  test.setTimeout(240_000);

  const seededResponse = await page.request.post("/api/dev/seed", {
    data: {
      scenario: "S7_campaign_started_some_submitted",
    },
  });
  expect(seededResponse.ok()).toBeTruthy();

  const seeded = (await seededResponse.json()) as {
    handles?: Record<string, string>;
  };

  const companyId = seeded.handles?.["company.main"];
  const hrAdminUserId = seeded.handles?.["user.hr_admin"];
  const campaignId = seeded.handles?.["campaign.main"];

  if (!companyId || !hrAdminUserId || !campaignId) {
    throw new Error("Missing required seed handles for FT-0143 HR regression.");
  }

  await loginWithCompany(page, {
    userId: hrAdminUserId,
    companyId,
  });

  await page.goto("/hr/campaigns");
  await expect(page.getByTestId("internal-app-shell")).toBeVisible();
  await expect(page.getByTestId(`campaign-list-row-${campaignId}`)).toBeVisible();
  await capture(page, "step-01-hr-campaign-list.png");

  await page.goto(`/hr/campaigns/${campaignId}`);
  await expect(page.getByTestId("campaign-detail-overview")).toBeVisible();
  await capture(page, "step-02-hr-campaign-detail.png");
});

test("FT-0143: questionnaire flow still opens through feature-area shims", async ({ page }) => {
  test.setTimeout(240_000);

  const seededResponse = await page.request.post("/api/dev/seed", {
    data: {
      scenario: "S5_campaign_started_no_answers",
    },
  });
  expect(seededResponse.ok()).toBeTruthy();

  const seeded = (await seededResponse.json()) as {
    handles?: Record<string, string>;
  };

  const companyId = seeded.handles?.["company.main"];
  const userId = seeded.handles?.["user.head_a"];
  const questionnaireId = seeded.handles?.["questionnaire.main"];

  if (!companyId || !userId || !questionnaireId) {
    throw new Error("Missing required seed handles for FT-0143 questionnaire regression.");
  }

  await loginWithCompany(page, {
    userId,
    companyId,
  });

  await page.goto("/questionnaires");
  await expect(page.getByTestId(`questionnaire-row-${questionnaireId}`)).toBeVisible();
  await page.goto(`/questionnaires/${questionnaireId}`);
  await expect(page.getByTestId("questionnaire-progress-card")).toBeVisible({ timeout: 15_000 });
  await capture(page, "step-03-questionnaire-detail.png");
});

test("FT-0143: results surfaces still load after refactor", async ({ page }) => {
  test.setTimeout(240_000);

  const seededResponse = await page.request.post("/api/dev/seed", {
    data: {
      scenario: "S9_campaign_completed_with_ai",
    },
  });
  expect(seededResponse.ok()).toBeTruthy();

  const seeded = (await seededResponse.json()) as {
    handles?: Record<string, string>;
  };

  const companyId = seeded.handles?.["company.main"];
  const employeeUserId = seeded.handles?.["user.staff_a1"];
  const managerUserId = seeded.handles?.["user.head_a"];
  const campaignId = seeded.handles?.["campaign.main"];
  const subjectEmployeeId = seeded.handles?.["employee.subject_main"];

  if (!companyId || !employeeUserId || !managerUserId || !campaignId || !subjectEmployeeId) {
    throw new Error("Missing required seed handles for FT-0143 results regression.");
  }

  await loginWithCompany(page, {
    userId: employeeUserId,
    companyId,
  });

  await page.goto(`/results?campaignId=${campaignId}`);
  await expect(page.getByTestId("results-summary")).toBeVisible();
  await capture(page, "step-04-results-my-dashboard.png");

  await loginWithCompany(page, {
    userId: managerUserId,
    companyId,
  });

  await page.goto(`/results/team?campaignId=${campaignId}&subjectEmployeeId=${subjectEmployeeId}`);
  await expect(page.getByTestId("results-summary")).toBeVisible();
  await capture(page, "step-05-results-team-dashboard.png");
});
