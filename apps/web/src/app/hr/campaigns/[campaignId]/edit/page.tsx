import { InternalAppShell } from "@/components/internal-app-shell";
import { PageErrorState, PageStateScreen } from "@/components/page-state";
import { applyDebugPageDelay } from "@/lib/debug-page-delay";
import { canEditCampaignDraft, getCampaignActionHint } from "@/lib/hr-campaigns";
import { resolveAppOperationContext } from "@/lib/operation-context";
import { getFriendlyErrorCopy } from "@/lib/page-state";
import { createInprocClient } from "@feedback-360/client";
import { redirect } from "next/navigation";

import { HrCampaignDraftForm, getDraftFormValues } from "../../_draft-form";

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
 * HR campaign draft edit screen.
 * @screenId SCR-HR-CAMPAIGN-EDIT
 * @testIdScope scr-hr-campaign-edit
 */
export default async function EditHrCampaignPage({
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
      title: "Не удалось открыть редактирование кампании",
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
        title="Редактирование draft кампании"
        subtitle="Draft configuration доступен только HR Admin."
      >
        <PageErrorState
          title="Недостаточно прав для редактирования кампании"
          description="Откройте detail dashboard кампании в режиме просмотра или переключитесь на роль HR Admin."
          actions={[
            {
              href: `/hr/campaigns/${campaignId}`,
              label: "Открыть detail page",
              variant: "outline",
            },
          ]}
        />
      </InternalAppShell>
    );
  }

  const client = createInprocClient();
  const [campaign, models] = await Promise.all([
    client.campaignGet({ campaignId }, resolved.context),
    client.modelVersionList({}, resolved.context),
  ]);

  if (!campaign.ok) {
    const state = getFriendlyErrorCopy(campaign.error, {
      title: "Не удалось загрузить кампанию",
      description: "Campaign detail временно недоступен. Попробуйте открыть её позже.",
    });

    return (
      <InternalAppShell
        context={resolved.context}
        currentPath="/hr/campaigns"
        title="Редактирование draft кампании"
        subtitle="Открываем сохранённый draft и меняем базовую конфигурацию до запуска."
      >
        <PageErrorState
          title={state.title}
          description={state.description}
          actions={[{ href: "/hr/campaigns", label: "Вернуться к списку", variant: "outline" }]}
        />
      </InternalAppShell>
    );
  }

  if (!models.ok) {
    const state = getFriendlyErrorCopy(models.error, {
      title: "Не удалось загрузить модели компетенций",
      description: "Без списка моделей нельзя безопасно показать draft form.",
    });

    return (
      <InternalAppShell
        context={resolved.context}
        currentPath="/hr/campaigns"
        title="Редактирование draft кампании"
        subtitle={getCampaignActionHint(campaign.data)}
      >
        <PageErrorState
          title={state.title}
          description={state.description}
          actions={[
            {
              href: `/hr/campaigns/${campaignId}`,
              label: "Вернуться к detail page",
              variant: "outline",
            },
          ]}
        />
      </InternalAppShell>
    );
  }

  if (!canEditCampaignDraft(campaign.data)) {
    return redirect(`/hr/campaigns/${campaignId}?error=campaign_started_immutable`);
  }

  return (
    <InternalAppShell
      context={resolved.context}
      currentPath="/hr/campaigns"
      title="Редактировать draft кампании"
      subtitle={getCampaignActionHint(campaign.data)}
    >
      <div data-testid="scr-hr-campaign-edit-root">
        <HrCampaignDraftForm
          mode="edit"
          values={getDraftFormValues(campaign.data)}
          models={models.data.items}
          returnTo={`/hr/campaigns/${campaignId}/edit`}
          errorCode={getQueryValue(query.error)}
        />
      </div>
    </InternalAppShell>
  );
}
