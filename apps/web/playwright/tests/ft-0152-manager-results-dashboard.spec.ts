import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { type Page, expect, test } from "@playwright/test";

const artifactsDir = resolve(
  process.cwd(),
  "../..",
  ".memory-bank/evidence/EP-015/FT-0152/2026-03-06",
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

test("FT-0152: manager sees structured team results with merge explanations and no raw text", async ({
  page,
}) => {
  test.setTimeout(120_000);

  const seededResponse = await page.request.post("/api/dev/seed", {
    data: {
      scenario: "S9_campaign_completed_with_ai",
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
  const subjectEmployeeId = seeded.handles?.["employee.subject_main"];
  const managerUserId = seeded.handles?.["user.head_a"];

  expect(campaignId).toBeTruthy();
  expect(companyId).toBeTruthy();
  expect(subjectEmployeeId).toBeTruthy();
  expect(managerUserId).toBeTruthy();

  await loginWithCompany(page, String(managerUserId), String(companyId));
  await page.goto(`/results/team?campaignId=${campaignId}&subjectEmployeeId=${subjectEmployeeId}`);

  await expect(page.getByTestId("scr-results-manager-root")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole("heading", { name: "Результаты команды" })).toBeVisible();
  await expect(page.getByTestId("results-team-toolbar")).toBeVisible();
  await expect(page.getByTestId("results-team-subject-switcher")).toBeVisible();
  await expect(page.getByTestId(`results-team-subject-${subjectEmployeeId}`)).toBeVisible();
  await expect(page.getByTestId("results-group-card-peers")).toContainText("Объединено");
  await expect(page.getByTestId("results-group-card-other")).toBeVisible();
  await expect(page.getByTestId(/^open-text-raw-/)).toHaveCount(0);
  await expect(page.getByTestId(/^open-text-processed-/).first()).toBeVisible();

  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-01-manager-team-results-dashboard.png`,
  });
});
