import { InternalAppShell } from "@/components/internal-app-shell";
import { PageErrorState, PageStateScreen } from "@/components/page-state";
import { applyDebugPageDelay } from "@/lib/debug-page-delay";
import { resolveAppOperationContext } from "@/lib/operation-context";
import { getFriendlyErrorCopy } from "@/lib/page-state";
import { redirect } from "next/navigation";

import { HrModelEditor } from "@/features/models-matrix/components/hr-model-editor";
import { buildEmptyModelDraft, getQueryValue } from "@/features/models-matrix/lib/models-matrix";

/**
 * HR model create screen.
 * @screenId SCR-HR-MODEL-CREATE
 * @testIdScope scr-hr-model-create
 */
export default async function NewHrModelPage({
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
      title: "Не удалось открыть создание модели",
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
        currentPath="/hr/models"
        title="Создать модель"
        subtitle="Draft model editor доступен только для HR Admin."
      >
        <PageErrorState
          title="Недостаточно прав для создания модели"
          description="Откройте каталог моделей или переключитесь в компанию, где у вас есть роль HR Admin."
          actions={[{ href: "/hr/models", label: "Вернуться к каталогу", variant: "outline" }]}
        />
      </InternalAppShell>
    );
  }

  const kind = getQueryValue(params.kind) === "levels" ? "levels" : "indicators";

  return (
    <InternalAppShell
      context={resolved.context}
      currentPath="/hr/models"
      title="Создать draft модели"
      subtitle="Выберите режим оценки, опишите groups/competencies и сохраните draft перед publish."
    >
      <div data-testid="scr-hr-model-create-root">
        <HrModelEditor initialDraft={buildEmptyModelDraft(kind)} mode="create" canMutate />
      </div>
    </InternalAppShell>
  );
}
