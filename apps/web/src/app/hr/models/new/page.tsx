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
      <div className="space-y-4" data-testid="scr-hr-model-create-root">
        <div className="overflow-hidden rounded-[2rem] border-0 bg-[#2563eb] text-white shadow-[0_20px_50px_-24px_rgba(37,99,235,0.9)]">
          <div className="relative p-8 md:p-10">
            <div className="relative z-10 max-w-2xl space-y-4">
              <div className="inline-flex items-center rounded-full bg-white/12 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-white/80">
                Model Create
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  Новый draft модели — основа будущих кампаний
                </h2>
                <p className="max-w-xl text-sm leading-6 text-white/80 md:text-base">
                  Сначала выбираем режим оценки, потом описываем группы и компетенции.
                  Опубликованная версия должна оставаться прозрачной и пригодной для reuse в
                  campaign drafts.
                </p>
              </div>
            </div>
            <div className="absolute right-6 top-6 hidden h-36 w-36 rounded-[2rem] bg-white/10 lg:block" />
            <div className="absolute bottom-6 right-8 hidden h-24 w-24 rounded-[1.5rem] border border-white/10 bg-white/8 lg:block" />
          </div>
        </div>
        <HrModelEditor initialDraft={buildEmptyModelDraft(kind)} mode="create" canMutate />
      </div>
    </InternalAppShell>
  );
}
