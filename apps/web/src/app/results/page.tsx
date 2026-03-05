import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resolveAppOperationContext } from "@/lib/operation-context";
import { createInprocClient } from "@feedback-360/client";
import { redirect } from "next/navigation";

import {
  ResultsCompetenciesCard,
  ResultsGroupCard,
  ResultsOpenTextCard,
  ResultsPageLayout,
  ResultsSummaryCard,
} from "./_shared";

const getQueryValue = (value: string | string[] | undefined): string | undefined => {
  if (typeof value === "string") {
    return value.trim().length > 0 ? value.trim() : undefined;
  }
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0] ?? "";
    return first.trim().length > 0 ? first.trim() : undefined;
  }
  return undefined;
};

export default async function ResultsMyDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await resolveAppOperationContext();
  if (!resolved.ok) {
    if (resolved.error.code === "unauthenticated") {
      redirect("/auth/login");
    }
    if (resolved.error.code === "active_company_required") {
      redirect("/select-company");
    }
  }

  if (!resolved.ok) {
    return (
      <ResultsPageLayout title="Мои результаты" subtitle="Не удалось определить контекст доступа.">
        <p className="text-sm text-destructive">{resolved.error.message}</p>
      </ResultsPageLayout>
    );
  }

  const params = searchParams ? await searchParams : undefined;
  const campaignId = getQueryValue(params?.campaignId);
  const client = createInprocClient();

  const assignedQuestionnaires = await client.questionnaireListAssigned({}, resolved.context);
  const suggestedCampaignIds = assignedQuestionnaires.ok
    ? [...new Set(assignedQuestionnaires.data.items.map((item) => item.campaignId))]
    : [];

  if (!campaignId) {
    return (
      <ResultsPageLayout
        title="Мои результаты"
        subtitle="Укажите campaignId для загрузки результатов по кампании."
      >
        <form
          className="grid gap-3 rounded-md border p-4"
          method="get"
          data-testid="my-results-form"
        >
          <div className="space-y-2">
            <Label htmlFor="campaignId">Campaign ID</Label>
            <Input id="campaignId" name="campaignId" placeholder="19000000-..." />
          </div>
          <div>
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              Открыть результаты
            </button>
          </div>
        </form>
        {suggestedCampaignIds.length > 0 ? (
          <div className="rounded-md border p-4 text-sm" data-testid="my-results-suggestions">
            <p className="font-medium">Доступные кампании из назначенных анкет:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestedCampaignIds.map((id) => (
                <a
                  key={id}
                  className="rounded border px-2 py-1 font-mono text-xs hover:bg-muted"
                  href={`/results?campaignId=${encodeURIComponent(id)}`}
                >
                  {id}
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </ResultsPageLayout>
    );
  }

  const dashboard = await client.resultsGetMyDashboard(
    {
      campaignId,
      smallGroupPolicy: "merge_to_other",
      anonymityThreshold: 3,
    },
    resolved.context,
  );

  if (!dashboard.ok) {
    return (
      <ResultsPageLayout title="Мои результаты" subtitle="Не удалось загрузить результаты.">
        <p className="text-sm text-destructive" data-testid="results-my-error">
          {dashboard.error.message}
        </p>
      </ResultsPageLayout>
    );
  }

  return (
    <ResultsPageLayout title="Мои результаты" subtitle="Агрегаты по завершённой кампании 360.">
      <ResultsSummaryCard
        campaignId={dashboard.data.campaignId}
        subjectEmployeeId={dashboard.data.subjectEmployeeId}
        overallScore={dashboard.data.overallScore}
        modelKind={dashboard.data.modelKind}
      />
      <ResultsGroupCard data={dashboard.data} />
      <ResultsCompetenciesCard data={dashboard.data} />
      <ResultsOpenTextCard items={dashboard.data.openText} showRawText={false} />
    </ResultsPageLayout>
  );
}
