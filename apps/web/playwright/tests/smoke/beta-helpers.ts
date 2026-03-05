import { type APIRequestContext, type Page, expect } from "@playwright/test";

type SeedResponse = {
  ok?: boolean;
  handles?: Record<string, string>;
};

export const seedScenario = async (
  request: APIRequestContext,
  scenario: string,
): Promise<Record<string, string>> => {
  const response = await request.post("/api/dev/seed", {
    data: {
      scenario,
    },
  });

  expect(response.ok()).toBeTruthy();

  const payload = (await response.json()) as SeedResponse;
  expect(payload.ok).toBeTruthy();
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
