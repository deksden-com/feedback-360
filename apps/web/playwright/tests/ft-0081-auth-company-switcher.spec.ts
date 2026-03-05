import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

test("FT-0081: login context and company switcher flow", async ({ page }) => {
  const artifactsDir = resolve(
    process.cwd(),
    "../..",
    ".memory-bank/evidence/EP-008/FT-0081/2026-03-05",
  );
  await mkdir(artifactsDir, { recursive: true });

  const seededResponse = await page.request.post("/api/dev/seed", {
    data: {
      scenario: "S1_multi_tenant_min",
    },
  });
  expect(seededResponse.ok()).toBeTruthy();
  const seeded = (await seededResponse.json()) as {
    ok?: boolean;
    handles?: Record<string, string>;
  };
  expect(seeded.ok).toBeTruthy();

  const userId = seeded.handles?.["user.shared"];
  const companyAId = seeded.handles?.["company.a"];
  const companyBId = seeded.handles?.["company.b"];
  expect(userId).toBeTruthy();
  expect(companyAId).toBeTruthy();
  expect(companyBId).toBeTruthy();

  const loginResponse = await page.request.post("/api/dev/test-login", {
    data: {
      userId,
    },
  });
  expect(loginResponse.ok()).toBeTruthy();

  await page.goto("/select-company");
  await expect(page.getByRole("heading", { name: "Выберите компанию" })).toBeVisible();
  await expect(page.getByText("Acme 360 A")).toBeVisible();
  await expect(page.getByText("Acme 360 B")).toBeVisible();
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-01-company-switcher-initial.png`,
  });

  await page.getByTestId(`select-company-${companyAId}`).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByTestId("active-company-name")).toContainText("Acme 360 A");
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-02-active-company-a.png`,
  });

  await page.goto("/select-company");
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-03-company-switcher-before-b.png`,
  });
  await page.getByTestId(`select-company-${companyBId}`).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByTestId("active-company-name")).toContainText("Acme 360 B");
  await page.screenshot({
    fullPage: true,
    path: `${artifactsDir}/step-04-active-company-b.png`,
  });
});
