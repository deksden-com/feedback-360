import { InternalAppShell } from "@/components/internal-app-shell";
import { PageEmptyState, PageErrorState, PageStateScreen } from "@/components/page-state";
import { applyDebugPageDelay } from "@/lib/debug-page-delay";
import { resolveAppOperationContext } from "@/lib/operation-context";
import { getFriendlyErrorCopy } from "@/lib/page-state";
import { createInprocClient } from "@feedback-360/client";
import { redirect } from "next/navigation";

import { HrCampaignDraftForm, getDraftFormValues } from "../_draft-form";

const getQueryValue = (value: string | string[] | undefined): string | undefined => {
  if (typeof value === "string") {
    return value.trim().length > 0 ? value.trim() : undefined;
  }
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "string" && first.trim().length > 0 ? first.trim() : undefined;
  }
  return undefined;
};

/**
 * HR campaign create screen.
 * @screenId SCR-HR-CAMPAIGN-CREATE
 * @testIdScope scr-hr-campaign-create
 */
export default async function NewHrCampaignPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  await applyDebugPageDelay(params?.debugDelayMs);

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
      title: "Не удалось открыть создание кампании",
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

  if (resolved.context.role !== "hr_admin") {
    return (
      <InternalAppShell
        context={resolved.context}
        currentPath="/hr/campaigns"
        title="Создание кампании"
        subtitle="Draft configuration доступен только HR Admin."
      >
        <PageErrorState
          title="Недостаточно прав для создания кампании"
          description="Откройте список кампаний или переключитесь в компанию, где у вас есть роль HR Admin."
          actions={[{ href: "/hr/campaigns", label: "Вернуться к кампаниям", variant: "outline" }]}
        />
      </InternalAppShell>
    );
  }

  const client = createInprocClient();
  const models = await client.modelVersionList({}, resolved.context);
  if (!models.ok) {
    const state = getFriendlyErrorCopy(models.error, {
      title: "Не удалось загрузить модели компетенций",
      description: "Список моделей временно недоступен. Попробуйте обновить страницу позже.",
    });

    return (
      <InternalAppShell
        context={resolved.context}
        currentPath="/hr/campaigns"
        title="Создание кампании"
        subtitle="Сначала выбираем модель, затем сохраняем draft и переходим к detail dashboard."
      >
        <PageErrorState
          title={state.title}
          description={state.description}
          actions={[{ href: "/hr/campaigns", label: "Вернуться к списку", variant: "outline" }]}
        />
      </InternalAppShell>
    );
  }

  if (models.data.items.length === 0) {
    return (
      <InternalAppShell
        context={resolved.context}
        currentPath="/hr/campaigns"
        title="Создание кампании"
        subtitle="Перед созданием campaign draft нужна хотя бы одна версия competency model."
      >
        <PageEmptyState
          title="Нет доступных competency models"
          description="Создайте модель компетенций через CLI или следующий HR GUI-эпик, затем вернитесь к созданию кампании."
          actions={[{ href: "/hr/campaigns", label: "Вернуться к кампаниям", variant: "outline" }]}
        />
      </InternalAppShell>
    );
  }

  const selectedModelId =
    getQueryValue(params.modelVersionId) ?? models.data.items[0]?.modelVersionId;
  const values = {
    ...getDraftFormValues(),
    modelVersionId: selectedModelId ?? "",
  };

  return (
    <InternalAppShell
      context={resolved.context}
      currentPath="/hr/campaigns"
      title="Создать draft кампании"
      subtitle="Draft-first flow: создаём кампанию, затем открываем detail dashboard для запуска и daily operations."
    >
      <div data-testid="scr-hr-campaign-create-root">
        <HrCampaignDraftForm
          mode="create"
          values={values}
          models={models.data.items}
          returnTo="/hr/campaigns/new"
          errorCode={getQueryValue(params.error)}
        />
      </div>
    </InternalAppShell>
  );
}
