import { type Page, expect } from "@playwright/test";

export class EmployeeResultsPagePom {
  constructor(private readonly page: Page) {}

  async goto(campaignId: string) {
    await this.page.goto(`/results?campaignId=${encodeURIComponent(campaignId)}`);
    await expect(this.page.getByTestId("results-summary")).toBeVisible();
  }

  async readOverallScore(): Promise<string> {
    return (await this.page.getByTestId("results-overall-score").textContent())?.trim() ?? "";
  }
}

export class ManagerResultsPagePom {
  constructor(private readonly page: Page) {}

  async goto(campaignId: string, subjectEmployeeId: string) {
    await this.page.goto(
      `/results/team?campaignId=${encodeURIComponent(campaignId)}&subjectEmployeeId=${encodeURIComponent(subjectEmployeeId)}`,
    );
    await expect(this.page.getByTestId("results-summary")).toBeVisible();
  }
}

export class HrResultsPagePom {
  constructor(private readonly page: Page) {}

  async goto(campaignId: string, subjectEmployeeId: string) {
    await this.page.goto(
      `/results/hr?campaignId=${encodeURIComponent(campaignId)}&subjectEmployeeId=${encodeURIComponent(subjectEmployeeId)}`,
    );
    await expect(this.page.getByTestId("results-summary")).toBeVisible();
  }
}
