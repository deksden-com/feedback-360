import { InternalAppShell } from "@/components/internal-app-shell";
import { PageErrorState, PageStateScreen } from "@/components/page-state";
import { applyDebugPageDelay } from "@/lib/debug-page-delay";
import { resolveAppOperationContext } from "@/lib/operation-context";
import { getFriendlyErrorCopy } from "@/lib/page-state";
import { createInprocClient } from "@feedback-360/client";
import { redirect } from "next/navigation";

import { HrMatrixBuilder } from "@/features/models-matrix/components/hr-matrix-builder";
import { buildMatrixPeople } from "@/features/models-matrix/lib/models-matrix";

export default async function HrCampaignMatrixPage({
  params,
  searchParams,
}: {
  params: Promise<{ campaignId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ campaignId }, query] = await Promise.all([
    params,
    searchParams ?? Promise.resolve<Record<string, string | string[] | undefined>>({}),
  ]);
  await applyDebugPageDelay(query.debugDelayMs);

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
    const state = getFriendlyErrorCopy(resolved.error, {
      title: "Не удалось открыть matrix builder",
      description: "Попробуйте обновить страницу или войти заново.",
    });
    return (
      <PageStateScreen>
        <PageErrorState
          title={state.title}
          description={state.description}
          actions={[{ href: "/auth/login", label: "Перейти ко входу", variant: "outline" }]}
        />
      </PageStateScreen>
    );
  }

  const isHrRole = resolved.context.role === "hr_admin" || resolved.context.role === "hr_reader";
  if (!isHrRole) {
    return (
      <InternalAppShell
        context={resolved.context}
        currentPath="/hr/campaigns"
        title="Matrix builder"
        subtitle="Доступно только HR-ролям."
      >
        <PageErrorState
          title="Недостаточно прав"
          description="Вернитесь на домашний экран или переключите компанию с HR-ролью."
          actions={[{ href: "/", label: "Вернуться на главную", variant: "outline" }]}
        />
      </InternalAppShell>
    );
  }

  const client = createInprocClient();
  const [campaign, employees, departments, matrix, snapshots] = await Promise.all([
    client.campaignGet({ campaignId }, resolved.context),
    client.employeeListActive({}, resolved.context),
    client.departmentList({}, resolved.context),
    client.matrixList({ campaignId }, resolved.context),
    client.campaignSnapshotList({ campaignId }, resolved.context),
  ]);

  if (!campaign.ok || !employees.ok || !departments.ok || !matrix.ok || !snapshots.ok) {
    const firstError = !campaign.ok
      ? campaign.error
      : !employees.ok
        ? employees.error
        : !departments.ok
          ? departments.error
          : !matrix.ok
            ? matrix.error
            : !snapshots.ok
              ? snapshots.error
              : undefined;

    if (!firstError) {
      throw new Error("Matrix builder error state was reached without an operation error.");
    }

    const state = getFriendlyErrorCopy(firstError, {
      title: "Не удалось загрузить matrix builder",
      description: "Проверьте состояние кампании и попробуйте позже.",
    });

    return (
      <InternalAppShell
        context={resolved.context}
        currentPath="/hr/campaigns"
        title="Matrix builder"
        subtitle="Кто кого оценивает в рамках campaign draft/start."
      >
        <PageErrorState
          title={state.title}
          description={state.description}
          actions={[
            {
              href: `/hr/campaigns/${campaignId}`,
              label: "Вернуться к кампании",
              variant: "outline",
            },
          ]}
        />
      </InternalAppShell>
    );
  }

  return (
    <InternalAppShell
      context={resolved.context}
      currentPath="/hr/campaigns"
      title={`Матрица оценивания · ${campaign.data.name}`}
      subtitle="Autogen по оргструктуре, ручные правки и freeze behavior для campaign matrix."
    >
      <HrMatrixBuilder
        role={resolved.context.role}
        campaign={campaign.data}
        employees={buildMatrixPeople(employees.data.items, snapshots.data.items)}
        departments={departments.data.items}
        initialAssignments={matrix.data.assignments}
      />
    </InternalAppShell>
  );
}
