import { InternalAppShell } from "@/components/internal-app-shell";
import {
  InlineBanner,
  PageEmptyState,
  PageErrorState,
  PageStateScreen,
} from "@/components/page-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { applyDebugPageDelay } from "@/lib/debug-page-delay";
import { resolveAppOperationContext } from "@/lib/operation-context";
import { getFriendlyErrorCopy } from "@/lib/page-state";
import { cn } from "@/lib/utils";
import { createInprocClient } from "@feedback-360/client";
import { redirect } from "next/navigation";

import { HrModelCloneButton } from "@/features/models-matrix/components/hr-model-clone-button";
import {
  formatDateLabel,
  getQueryValue,
  modelKindLabels,
  modelStatusLabels,
} from "@/features/models-matrix/lib/models-matrix";

/**
 * HR models catalog screen.
 * @screenId SCR-HR-MODELS
 * @testIdScope scr-hr-models
 */
export default async function HrModelsPage({
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
      title: "Не удалось открыть каталог моделей",
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
        title="Модели компетенций"
        subtitle="Раздел доступен только HR Admin и HR Reader."
      >
        <PageErrorState
          title="Недостаточно прав для каталога моделей"
          description="Откройте домашний экран или переключите активную компанию, где у вас есть HR-роль."
          actions={[{ href: "/", label: "Вернуться на главную", variant: "outline" }]}
        />
      </InternalAppShell>
    );
  }

  const client = createInprocClient();
  const list = await client.modelVersionList(
    {
      ...(getQueryValue(params.kind)
        ? { kind: getQueryValue(params.kind) as "indicators" | "levels" }
        : {}),
      ...(getQueryValue(params.status)
        ? { status: getQueryValue(params.status) as "draft" | "published" }
        : {}),
      ...(getQueryValue(params.search) ? { search: getQueryValue(params.search) } : {}),
    },
    resolved.context,
  );

  if (!list.ok) {
    const state = getFriendlyErrorCopy(list.error, {
      title: "Не удалось загрузить модели",
      description: "Каталог моделей временно недоступен. Попробуйте позже.",
    });

    return (
      <InternalAppShell
        context={resolved.context}
        currentPath="/hr/models"
        title="Модели компетенций"
        subtitle="Catalog и version hub для HR."
      >
        <PageErrorState
          title={state.title}
          description={state.description}
          actions={[{ href: "/", label: "Вернуться на главную", variant: "outline" }]}
        />
      </InternalAppShell>
    );
  }

  const flash = getQueryValue(params.cloned)
    ? { tone: "success" as const, description: "Создан новый draft на основе выбранной версии." }
    : getQueryValue(params.error)
      ? {
          tone: "error" as const,
          description:
            "Не удалось выполнить действие над моделью. Проверьте статус версии и попробуйте снова.",
        }
      : undefined;

  return (
    <InternalAppShell
      context={resolved.context}
      currentPath="/hr/models"
      title="Модели компетенций"
      subtitle="Version hub: draft/published, фильтры, usage hints и быстрый переход в редактор."
    >
      <div className="space-y-4" data-testid="scr-hr-models-root">
        {flash ? (
          <InlineBanner
            description={flash.description}
            tone={flash.tone}
            testId="model-catalog-flash"
          />
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_320px]">
          <Card className="overflow-hidden rounded-[2rem] border-0 bg-[#2563eb] text-white shadow-[0_20px_50px_-24px_rgba(37,99,235,0.9)]">
            <CardContent className="relative p-8 md:p-10">
              <div className="relative z-10 max-w-2xl space-y-4">
                <div className="inline-flex items-center rounded-full bg-white/12 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-white/80">
                  Competency Models
                </div>
                <div className="space-y-3">
                  <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                    Каталог моделей — это библиотека правил оценки
                  </h2>
                  <p className="max-w-xl text-sm leading-6 text-white/80 md:text-base">
                    Сначала версия модели, затем режим оценки, затем usage в активных кампаниях.
                    Страница остаётся content-first: draft/published и применение видны сразу.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3" data-testid="scr-hr-models-toolbar">
                  {resolved.context.role === "hr_admin" ? (
                    <Button
                      asChild
                      size="lg"
                      className="rounded-xl bg-white px-5 text-primary shadow-none hover:bg-white/90"
                      data-testid="scr-hr-models-create"
                    >
                      <a href="/hr/models/new">Создать draft</a>
                    </Button>
                  ) : null}
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-xl border-white/20 bg-white/10 px-5 text-white hover:bg-white/15 hover:text-white"
                  >
                    <a href="/hr/campaigns">Открыть кампании</a>
                  </Button>
                </div>
              </div>
              <div className="absolute right-6 top-6 hidden h-36 w-36 rounded-[2rem] bg-white/10 lg:block" />
              <div className="absolute bottom-6 right-8 hidden h-24 w-24 rounded-[1.5rem] border border-white/10 bg-white/8 lg:block" />
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-[1.75rem] border border-border/70 bg-card p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Всего версий
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight">{list.data.items.length}</p>
              <p className="mt-2 text-sm text-muted-foreground">Все drafts и published версии.</p>
            </div>
            <div className="rounded-[1.75rem] border border-border/70 bg-card p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Черновики
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight">
                {list.data.items.filter((item) => item.status === "draft").length}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Версии, которые можно продолжать редактировать.
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-border/70 bg-card p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Опубликованы
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight">
                {list.data.items.filter((item) => item.status === "published").length}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Готовы к использованию в новых кампаниях.
              </p>
            </div>
          </div>
        </section>

        <Card className="rounded-[1.75rem] border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold tracking-tight">Фильтры</CardTitle>
            <CardDescription>
              Найдите модель по названию, режиму оценки и статусу версии.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_auto]"
              data-testid="scr-hr-models-filters"
            >
              <Input
                name="search"
                placeholder="Поиск по названию"
                defaultValue={getQueryValue(params.search)}
                data-testid="model-catalog-search"
              />
              <select
                name="kind"
                defaultValue={getQueryValue(params.kind) ?? ""}
                className="flex h-10 rounded-md border bg-background px-3 py-2 text-sm"
                data-testid="model-catalog-kind-filter"
              >
                <option value="">Все режимы</option>
                <option value="indicators">{modelKindLabels.indicators}</option>
                <option value="levels">{modelKindLabels.levels}</option>
              </select>
              <select
                name="status"
                defaultValue={getQueryValue(params.status) ?? ""}
                className="flex h-10 rounded-md border bg-background px-3 py-2 text-sm"
                data-testid="model-catalog-status-filter"
              >
                <option value="">Все статусы</option>
                <option value="draft">{modelStatusLabels.draft}</option>
                <option value="published">{modelStatusLabels.published}</option>
              </select>
              <Button type="submit" variant="outline" className="rounded-xl">
                Применить
              </Button>
            </form>
          </CardContent>
        </Card>

        {list.data.items.length === 0 ? (
          <PageEmptyState
            title="Пока нет моделей компетенций"
            description="Создайте первый draft competency model и затем привяжите его к campaign draft."
            actions={
              resolved.context.role === "hr_admin"
                ? [{ href: "/hr/models/new", label: "Создать draft", variant: "outline" }]
                : [{ href: "/", label: "Вернуться на главную", variant: "outline" }]
            }
            testId="model-catalog-empty"
          />
        ) : (
          <div className="grid gap-4">
            {list.data.items.map((item) => (
              <Card
                key={item.modelVersionId}
                className="rounded-[1.75rem] border-border/70 shadow-sm"
                data-testid={`model-row-${item.modelVersionId}`}
              >
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{item.name}</CardTitle>
                      <CardDescription>
                        v{item.version} · {modelKindLabels[item.kind]} · обновлено{" "}
                        {formatDateLabel(item.updatedAt ?? item.createdAt)}
                      </CardDescription>
                    </div>
                    <div
                      className={cn(
                        "rounded-full border px-3 py-1 text-sm",
                        item.status === "published"
                          ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
                          : "border-primary/20 bg-primary/5 text-primary",
                      )}
                      data-testid={`model-status-${item.modelVersionId}`}
                    >
                      {modelStatusLabels[item.status]}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                  <div className="grid gap-3 text-sm md:grid-cols-3">
                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Режим
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {modelKindLabels[item.kind]}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Active campaigns
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {item.usedByActiveCampaigns ?? 0}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Создана
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {formatDateLabel(item.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      asChild
                      variant="outline"
                      className="rounded-xl"
                      data-testid={`model-open-${item.modelVersionId}`}
                    >
                      <a href={`/hr/models/${item.modelVersionId}`}>Открыть</a>
                    </Button>
                    {resolved.context.role === "hr_admin" ? (
                      <HrModelCloneButton
                        sourceModelVersionId={item.modelVersionId}
                        returnTo="/hr/models"
                        testId={`model-clone-${item.modelVersionId}`}
                      />
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </InternalAppShell>
  );
}
