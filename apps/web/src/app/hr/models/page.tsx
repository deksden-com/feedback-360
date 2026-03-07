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

        <div className="flex flex-wrap gap-2" data-testid="scr-hr-models-toolbar">
          <form className="flex flex-wrap gap-2" data-testid="scr-hr-models-filters">
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
            <Button type="submit" variant="outline">
              Применить
            </Button>
          </form>
          {resolved.context.role === "hr_admin" ? (
            <Button asChild data-testid="scr-hr-models-create">
              <a href="/hr/models/new">Создать draft</a>
            </Button>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Всего версий</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">{list.data.items.length}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Черновики</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">
              {list.data.items.filter((item) => item.status === "draft").length}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Опубликованы</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">
              {list.data.items.filter((item) => item.status === "published").length}
            </CardContent>
          </Card>
        </div>

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
              <Card key={item.modelVersionId} data-testid={`model-row-${item.modelVersionId}`}>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <CardDescription>
                        v{item.version} · {modelKindLabels[item.kind]} · обновлено{" "}
                        {formatDateLabel(item.updatedAt ?? item.createdAt)}
                      </CardDescription>
                    </div>
                    <div
                      className="rounded-full border px-3 py-1 text-sm"
                      data-testid={`model-status-${item.modelVersionId}`}
                    >
                      {modelStatusLabels[item.status]}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                  <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
                    <p>
                      Режим:{" "}
                      <span className="font-medium text-foreground">
                        {modelKindLabels[item.kind]}
                      </span>
                    </p>
                    <p>
                      Active campaigns:{" "}
                      <span className="font-medium text-foreground">
                        {item.usedByActiveCampaigns ?? 0}
                      </span>
                    </p>
                    <p>
                      Создана:{" "}
                      <span className="font-medium text-foreground">
                        {formatDateLabel(item.createdAt)}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      asChild
                      variant="outline"
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
