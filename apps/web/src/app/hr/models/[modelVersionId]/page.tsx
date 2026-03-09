import { InternalAppShell } from "@/components/internal-app-shell";
import { InlineBanner, PageErrorState, PageStateScreen } from "@/components/page-state";
import { Button } from "@/components/ui/button";
import { applyDebugPageDelay } from "@/lib/debug-page-delay";
import { resolveAppOperationContext } from "@/lib/operation-context";
import { getFriendlyErrorCopy } from "@/lib/page-state";
import { createInprocClient } from "@feedback-360/client";
import { redirect } from "next/navigation";

import { HrModelCloneButton } from "@/features/models-matrix/components/hr-model-clone-button";
import { HrModelEditor } from "@/features/models-matrix/components/hr-model-editor";
import { getQueryValue, modelToDraft } from "@/features/models-matrix/lib/models-matrix";

/**
 * HR model detail screen.
 * @docs .memory-bank/spec/ui/screens/hr-model-detail.md
 * @see .memory-bank/spec/ui/screen-registry.md
 * @screenId SCR-HR-MODEL-DETAIL
 * @testIdScope scr-hr-model-detail
 */
export default async function HrModelDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ modelVersionId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ modelVersionId }, query] = await Promise.all([
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
      title: "Не удалось открыть модель",
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
        currentPath="/hr/models"
        title="Модель"
        subtitle="Доступно только HR-ролям."
      >
        <PageErrorState
          title="Недостаточно прав для просмотра модели"
          description="Вернитесь на домашний экран или переключите активную компанию."
          actions={[{ href: "/", label: "Вернуться на главную", variant: "outline" }]}
        />
      </InternalAppShell>
    );
  }

  const client = createInprocClient();
  const model = await client.modelVersionGet({ modelVersionId }, resolved.context);
  if (!model.ok) {
    const state = getFriendlyErrorCopy(model.error, {
      title: "Не удалось загрузить модель",
      description: "Попробуйте открыть страницу чуть позже.",
    });
    return (
      <InternalAppShell
        context={resolved.context}
        currentPath="/hr/models"
        title="Модель"
        subtitle="Detail view для draft и published versions."
      >
        <PageErrorState
          title={state.title}
          description={state.description}
          actions={[{ href: "/hr/models", label: "Вернуться к каталогу", variant: "outline" }]}
        />
      </InternalAppShell>
    );
  }

  const flash = getQueryValue(query.saved)
    ? { tone: "success" as const, description: "Черновик модели сохранён." }
    : getQueryValue(query.published)
      ? { tone: "success" as const, description: "Версия модели опубликована." }
      : getQueryValue(query.cloned)
        ? {
            tone: "success" as const,
            description: "Новый draft создан на основе существующей версии.",
          }
        : getQueryValue(query.error)
          ? { tone: "error" as const, description: "Не удалось выполнить действие над моделью." }
          : undefined;

  const mode =
    model.data.status === "draft" && resolved.context.role === "hr_admin" ? "edit" : "readonly";

  return (
    <InternalAppShell
      context={resolved.context}
      currentPath="/hr/models"
      title={`${model.data.name} · v${model.data.version}`}
      subtitle="Редактор и detail view competency model version."
    >
      <div className="space-y-4" data-testid="scr-hr-model-detail-root">
        {flash ? (
          <InlineBanner
            description={flash.description}
            tone={flash.tone}
            testId="model-detail-flash"
          />
        ) : null}

        {resolved.context.role === "hr_admin" && model.data.status === "published" ? (
          <div className="flex">
            <HrModelCloneButton
              sourceModelVersionId={model.data.modelVersionId}
              returnTo={`/hr/models/${model.data.modelVersionId}`}
              testId="model-detail-clone"
              label="Создать clone draft"
            />
          </div>
        ) : null}

        <HrModelEditor
          initialDraft={modelToDraft(model.data)}
          model={model.data}
          mode={mode}
          canMutate={resolved.context.role === "hr_admin"}
        />
      </div>
    </InternalAppShell>
  );
}
