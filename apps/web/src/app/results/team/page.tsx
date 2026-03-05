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
} from "../_shared";

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

export default async function ResultsTeamDashboardPage({
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
      <ResultsPageLayout
        title="Результаты команды"
        subtitle="Не удалось определить контекст доступа."
      >
        <p className="text-sm text-destructive">{resolved.error.message}</p>
      </ResultsPageLayout>
    );
  }

  if (resolved.context.role !== "manager") {
    return (
      <ResultsPageLayout title="Результаты команды" subtitle="Доступно только для роли Manager.">
        <p className="text-sm text-destructive" data-testid="results-team-forbidden">
          Текущая роль не может открыть team dashboard.
        </p>
      </ResultsPageLayout>
    );
  }

  const params = searchParams ? await searchParams : undefined;
  const campaignId = getQueryValue(params?.campaignId);
  const subjectEmployeeId = getQueryValue(params?.subjectEmployeeId);

  if (!campaignId || !subjectEmployeeId) {
    return (
      <ResultsPageLayout
        title="Результаты команды"
        subtitle="Укажите campaignId и subjectEmployeeId для загрузки результатов сотрудника."
      >
        <form
          className="grid gap-3 rounded-md border p-4"
          method="get"
          data-testid="team-results-form"
        >
          <div className="space-y-2">
            <Label htmlFor="campaignId">Campaign ID</Label>
            <Input id="campaignId" name="campaignId" defaultValue={campaignId} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subjectEmployeeId">Subject employee ID</Label>
            <Input
              id="subjectEmployeeId"
              name="subjectEmployeeId"
              defaultValue={subjectEmployeeId}
            />
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
      </ResultsPageLayout>
    );
  }

  const client = createInprocClient();
  const dashboard = await client.resultsGetTeamDashboard(
    {
      campaignId,
      subjectEmployeeId,
      smallGroupPolicy: "merge_to_other",
      anonymityThreshold: 3,
    },
    resolved.context,
  );

  if (!dashboard.ok) {
    return (
      <ResultsPageLayout title="Результаты команды" subtitle="Не удалось загрузить результаты.">
        <p className="text-sm text-destructive" data-testid="results-team-error">
          {dashboard.error.message}
        </p>
      </ResultsPageLayout>
    );
  }

  return (
    <ResultsPageLayout
      title="Результаты команды"
      subtitle="Витрина руководителя: только агрегаты и обработанные комментарии."
    >
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
