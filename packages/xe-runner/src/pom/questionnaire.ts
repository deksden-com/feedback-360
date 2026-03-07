import { type Page, expect } from "@playwright/test";

export class QuestionnairePagePom {
  constructor(private readonly page: Page) {}

  async goto(questionnaireId: string) {
    await this.page.goto(`/questionnaires/${questionnaireId}`);
    await expect(this.page.getByTestId("questionnaire-progress-card")).toBeVisible();
  }

  async selectIndicator(indicatorId: string, value: 1 | 2 | 3 | 4 | 5 | "NA") {
    await this.page.getByTestId(`indicator-input-${indicatorId}-${String(value)}`).check({
      force: true,
    });
  }

  async fillCompetencyComment(competencyId: string, value: string) {
    await this.page.getByTestId(`competency-comment-${competencyId}`).fill(value);
  }

  async fillFinalComment(value: string) {
    await this.page.getByTestId("questionnaire-final-comment").fill(value);
  }

  async saveDraft() {
    await this.page.getByTestId("save-draft-button").click();
    await expect(this.page.getByTestId("questionnaire-flash-saved")).toBeVisible();
  }

  async submit() {
    await this.page.getByTestId("submit-questionnaire-button").click();
    await expect(this.page).toHaveURL(/\/questionnaires\?submitted=1$/);
  }
}
