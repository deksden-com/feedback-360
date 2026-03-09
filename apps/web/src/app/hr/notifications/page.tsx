import { InternalAppShell } from "@/components/internal-app-shell";
import { PageErrorState, PageStateScreen } from "@/components/page-state";
import { applyDebugPageDelay } from "@/lib/debug-page-delay";
import { resolveAppOperationContext } from "@/lib/operation-context";
import { getFriendlyErrorCopy } from "@/lib/page-state";
import { createOperationError } from "@feedback-360/api-contract";
import { createInprocClient } from "@feedback-360/client";
import { redirect } from "next/navigation";

import { HrNotificationCenter } from "@/features/notifications-center/components/hr-notification-center";

/**
 * HR notification center screen.
 * @docs .memory-bank/spec/ui/screens/hr-notifications.md
 * @see .memory-bank/spec/ui/screen-registry.md
 * @screenId SCR-HR-NOTIFICATIONS
 * @testIdScope scr-hr-notifications
 */
export default async function HrNotificationsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  await applyDebugPageDelay(params.debugDelayMs);

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
      title: "Не удалось открыть notification center",
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
        currentPath="/hr/notifications"
        title="Notification center"
        subtitle="Раздел доступен только HR Admin и HR Reader."
      >
        <PageErrorState
          title="Недостаточно прав для notification center"
          description="Откройте домашний экран или переключите активную компанию, где у вас есть HR-роль."
          actions={[{ href: "/", label: "Вернуться на главную", variant: "outline" }]}
        />
      </InternalAppShell>
    );
  }

  const client = createInprocClient();
  const [campaigns, settings, templates] = await Promise.all([
    client.campaignList({}, resolved.context),
    client.notificationReminderSettingsGet(resolved.context),
    client.notificationTemplateCatalog(resolved.context),
  ]);

  if (!campaigns.ok || !settings.ok || !templates.ok) {
    const error = !campaigns.ok
      ? campaigns.error
      : !settings.ok
        ? settings.error
        : !templates.ok
          ? templates.error
          : createOperationError("invalid_input", "Notification center load failed.");
    const state = getFriendlyErrorCopy(error, {
      title: "Не удалось загрузить notification center",
      description: "Проверьте доступность данных и попробуйте позже.",
    });

    return (
      <InternalAppShell
        context={resolved.context}
        currentPath="/hr/notifications"
        title="Notification center"
        subtitle={state.description}
      >
        <PageErrorState
          title={state.title}
          description={state.description}
          actions={[{ href: "/", label: "Вернуться на главную", variant: "outline" }]}
        />
      </InternalAppShell>
    );
  }

  const defaultCampaignId = campaigns.data.items[0]?.campaignId;
  const [preview, templatePreview, deliveries] = await Promise.all([
    client.notificationReminderPreview(
      defaultCampaignId ? { campaignId: defaultCampaignId } : {},
      resolved.context,
    ),
    templates.data.items[0]
      ? client.notificationTemplatePreview(
          {
            templateKey: templates.data.items[0].templateKey,
            ...(defaultCampaignId ? { campaignId: defaultCampaignId } : {}),
          },
          resolved.context,
        )
      : Promise.resolve({
          ok: true as const,
          data: null,
        }),
    client.notificationDeliveryDiagnostics({}, resolved.context),
  ]);

  if (!preview.ok || !deliveries.ok || !templatePreview.ok) {
    const error = !preview.ok
      ? preview.error
      : !deliveries.ok
        ? deliveries.error
        : !templatePreview.ok
          ? templatePreview.error
          : createOperationError("invalid_input", "Notification center preview failed.");
    const state = getFriendlyErrorCopy(error, {
      title: "Не удалось собрать notification center",
      description: "Preview или diagnostics временно недоступны.",
    });

    return (
      <InternalAppShell
        context={resolved.context}
        currentPath="/hr/notifications"
        title="Notification center"
        subtitle={state.description}
      >
        <PageErrorState
          title={state.title}
          description={state.description}
          actions={[{ href: "/hr/notifications", label: "Обновить страницу", variant: "outline" }]}
        />
      </InternalAppShell>
    );
  }

  return (
    <InternalAppShell
      context={resolved.context}
      currentPath="/hr/notifications"
      title="Notification center"
      subtitle="Reminder cadence, template preview и outbox diagnostics для HR/Admin."
    >
      <div data-testid="scr-hr-notifications-root">
        <HrNotificationCenter
          role={resolved.context.role}
          campaigns={campaigns.data.items}
          initialSettings={settings.data}
          initialPreview={preview.data}
          initialTemplates={templates.data.items}
          initialTemplatePreview={templatePreview.data}
          initialDeliveries={deliveries.data}
        />
      </div>
    </InternalAppShell>
  );
}
