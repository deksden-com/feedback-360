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
 * @docs .memory-bank/spec/ui/screens/hr-campaign-create.md
 * @see .memory-bank/spec/ui/screen-registry.md
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
      <div className="space-y-4" data-testid="scr-hr-campaign-create-root">
        <div className="overflow-hidden rounded-[2rem] border-0 bg-[#2563eb] text-white shadow-[0_20px_50px_-24px_rgba(37,99,235,0.9)]">
          <div className="relative p-8 md:p-10">
            <div className="relative z-10 max-w-2xl space-y-4">
              <div className="inline-flex items-center rounded-full bg-white/12 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-white/80">
                Campaign Create
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  Кампания начинается с аккуратного draft
                </h2>
                <p className="max-w-xl text-sm leading-6 text-white/80 md:text-base">
                  Выберите модель, даты, таймзону и веса групп. После сохранения вы перейдёте в
                  detail dashboard, где уже настраивается operational work.
                </p>
              </div>
            </div>
            <div className="absolute right-6 top-6 hidden h-36 w-36 rounded-[2rem] bg-white/10 lg:block" />
            <div className="absolute bottom-6 right-8 hidden h-24 w-24 rounded-[1.5rem] border border-white/10 bg-white/8 lg:block" />
          </div>
        </div>
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
