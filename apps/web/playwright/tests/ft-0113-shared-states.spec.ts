import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { type Page, expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100";
const artifactsDir = resolve(
  process.cwd(),
  "../..",
  ".memory-bank/evidence/EP-011/FT-0113/2026-03-06",
);

const applySessionCookies = async (page: Page, values: { userId: string; companyId: string }) => {
  const cookieUrl = new URL(baseUrl);
  await page.context().clearCookies();
  await page.context().addCookies([
    {
      name: "go360go_user_id",
      value: values.userId,
      domain: cookieUrl.hostname,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
    {
      name: "go360go_active_company_id",
      value: values.companyId,
      domain: cookieUrl.hostname,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
};

const capture = async (page: Page, fileName: string) => {
  await mkdir(artifactsDir, { recursive: true });
  await page.screenshot({
    path: `${artifactsDir}/${fileName}`,
    timeout: 15_000,
  });
};

test("FT-0113: questionnaires empty state explains the next step", async ({ page }) => {
  test.setTimeout(90_000);

  const seededResponse = await page.request.post("/api/dev/seed", {
    data: {
      scenario: "S1_company_min",
    },
  });
  expect(seededResponse.ok()).toBeTruthy();

  const seeded = (await seededResponse.json()) as {
    ok?: boolean;
    handles?: Record<string, string>;
  };

  const companyId = seeded.handles?.["company.main"];
  const hrAdminUserId = seeded.handles?.["user.hr_admin"];
  if (!companyId || !hrAdminUserId) {
    throw new Error("Missing required seed handles for FT-0113 empty state.");
  }

  await applySessionCookies(page, {
    userId: hrAdminUserId,
    companyId,
  });

  await page.goto("/questionnaires");
  await expect(page.getByTestId("questionnaire-empty")).toBeVisible();
  await expect(page.getByTestId("questionnaire-empty")).toContainText("Нет назначенных анкет");
  await expect(page.getByTestId("questionnaire-empty")).toContainText(
    "Когда вас добавят в матрицу оценивания",
  );
  await expect(page.getByRole("link", { name: "Перейти на главную" })).toBeVisible();
  await capture(page, "step-01-questionnaires-empty-state.png");
});

test("FT-0113: error state stays friendly and does not leak backend details", async ({ page }) => {
  test.setTimeout(90_000);

  const seededResponse = await page.request.post("/api/dev/seed", {
    data: {
      scenario: "S7_campaign_started_some_submitted",
    },
  });
  expect(seededResponse.ok()).toBeTruthy();

  const seeded = (await seededResponse.json()) as {
    ok?: boolean;
    handles?: Record<string, string>;
  };

  const companyId = seeded.handles?.["company.main"];
  const employeeUserId = seeded.handles?.["user.staff_a1"];
  if (!companyId || !employeeUserId) {
    throw new Error("Missing required seed handles for FT-0113 error state.");
  }

  await applySessionCookies(page, {
    userId: employeeUserId,
    companyId,
  });

  await page.goto("/results?campaignId=00000000-0000-0000-0000-000000000000");
  await expect(page.getByTestId("results-my-error")).toBeVisible();
  await expect(page.getByTestId("results-my-error")).toContainText("Данные не найдены");
  await expect(page.getByTestId("results-my-error")).toContainText(
    "ссылка устарела или нужные данные больше недоступны",
  );
  await expect(page.locator("body")).not.toContainText("Failed query:");
  await expect(page.locator("body")).not.toContainText("select ");
  await capture(page, "step-02-results-error-state.png");
});

test("FT-0113: shared loading state is shown during a delayed page transition", async ({
  page,
}) => {
  test.setTimeout(90_000);

  const seededResponse = await page.request.post("/api/dev/seed", {
    data: {
      scenario: "S1_company_min",
    },
  });
  expect(seededResponse.ok()).toBeTruthy();

  const seeded = (await seededResponse.json()) as {
    ok?: boolean;
    handles?: Record<string, string>;
  };

  const companyId = seeded.handles?.["company.main"];
  const hrAdminUserId = seeded.handles?.["user.hr_admin"];
  if (!companyId || !hrAdminUserId) {
    throw new Error("Missing required seed handles for FT-0113 loading state.");
  }

  await applySessionCookies(page, {
    userId: hrAdminUserId,
    companyId,
  });

  await page.goto("/");
  const navigation = page.goto("/questionnaires?debugDelayMs=1500");
  await expect(page.getByTestId("page-loading-state")).toBeVisible();
  await capture(page, "step-03-shared-loading-state.png");
  await navigation;
  await expect(page.getByTestId("questionnaire-empty")).toBeVisible();
});
