import { runSeedScenario } from "@feedback-360/db";
import { type APIRequestContext, type Page, expect } from "@playwright/test";

type SeedResponse = {
  scenario?: string;
  handles?: Record<string, string>;
};

export const seedScenario = async (
  _request: APIRequestContext,
  scenario: string,
): Promise<Record<string, string>> => {
  const payload = (await runSeedScenario({
    scenario: scenario as Parameters<typeof runSeedScenario>[0]["scenario"],
  })) as SeedResponse;
  expect(payload.scenario).toBe(scenario);
  expect(payload.handles).toBeDefined();

  return payload.handles ?? {};
};

export const loginAsUser = async (page: Page, userId: string): Promise<void> => {
  const response = await page.request.post("/api/dev/test-login", {
    data: {
      userId,
    },
  });

  expect(response.ok()).toBeTruthy();
};

export const setActiveCompany = async (page: Page, companyId: string): Promise<void> => {
  const response = await page.request.post("/api/session/active-company", {
    data: {
      companyId,
    },
  });

  expect(response.ok()).toBeTruthy();
};

export const loginWithCompany = async (
  page: Page,
  userId: string,
  companyId: string,
): Promise<void> => {
  await loginAsUser(page, userId);
  await setActiveCompany(page, companyId);
};
