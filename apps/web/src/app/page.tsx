import { InternalAppShell } from "@/components/internal-app-shell";
import { PageEmptyState, PageErrorState, PageStateScreen } from "@/components/page-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { applyDebugPageDelay } from "@/lib/debug-page-delay";
import { loadHomeDashboard } from "@/lib/home-dashboard";
import { resolveAppOperationContext } from "@/lib/operation-context";
import { getFriendlyErrorCopy } from "@/lib/page-state";
import { cn } from "@/lib/utils";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  ClipboardList,
  FolderKanban,
  Sparkles,
  Users,
} from "lucide-react";
import { redirect } from "next/navigation";

const metricIcons = [Users, FolderKanban, Sparkles, BarChart3];
const taskIcons = [ClipboardList, Sparkles, BriefcaseBusiness];
const shortcutIcons = [FolderKanban, Users, Activity, BarChart3];

const toneClassNames: Record<string, string> = {
  default: "border-border/80 bg-card text-card-foreground",
  primary: "border-primary/15 bg-primary/5 text-primary",
  success: "border-emerald-500/15 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300",
  warning: "border-amber-500/15 bg-amber-500/5 text-amber-700 dark:text-amber-300",
};

/**
 * Role-aware internal home dashboard.
 * @screenId SCR-APP-HOME
 * @testIdScope scr-app-home
 */
export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : undefined;
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
      title: "Не удалось открыть workspace",
      description: "Попробуйте обновить страницу или войти в систему снова.",
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

  const dashboard = await loadHomeDashboard(resolved.context);

  return (
    <InternalAppShell
      context={resolved.context}
      currentPath="/"
      title={dashboard.title}
      subtitle={dashboard.subtitle}
    >
      <div className="space-y-6" data-testid={`home-role-${resolved.context.role}`}>
        <section
          className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_340px]"
          data-testid="scr-app-home-root"
        >
          <Card className="overflow-hidden rounded-[2rem] border-0 bg-[#2563eb] text-white shadow-[0_20px_50px_-24px_rgba(37,99,235,0.9)]">
            <CardContent className="relative p-8 md:p-10">
              <div className="relative z-10 max-w-2xl space-y-5">
                <div className="inline-flex items-center rounded-full bg-white/12 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-white/80">
                  {dashboard.roleLabel}
                </div>
                <div className="space-y-3">
                  <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                    {dashboard.introTitle}
                  </h2>
                  <p
                    className="max-w-xl text-sm leading-6 text-white/80 md:text-base"
                    data-testid="home-intro-description"
                  >
                    {dashboard.introDescription}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    asChild
                    size="lg"
                    className="rounded-xl bg-white px-5 text-primary shadow-none hover:bg-white/90"
                    data-testid={dashboard.heroCta.testId}
                  >
                    <a href={dashboard.heroCta.href}>{dashboard.heroCta.label}</a>
                  </Button>
                  <div className="text-sm text-white/75">
                    Все действия работают в текущем company context.
                  </div>
                </div>
              </div>
              <div className="absolute right-6 top-6 hidden h-36 w-36 rounded-[2rem] bg-white/10 lg:block" />
              <div className="absolute bottom-6 right-8 hidden h-24 w-24 rounded-[1.5rem] border border-white/10 bg-white/8 lg:block" />
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {dashboard.metrics.map((metric, index) => {
              const Icon = metricIcons[index % metricIcons.length] ?? BarChart3;
              return (
                <Card
                  key={metric.testId}
                  className="rounded-[1.75rem] border-border/70 shadow-sm"
                  data-testid={metric.testId}
                >
                  <CardContent className="flex items-start justify-between gap-3 p-5">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {metric.title}
                      </p>
                      <div className="text-3xl font-semibold tracking-tight">{metric.value}</div>
                      <p className="text-sm leading-5 text-muted-foreground">
                        {metric.description}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-2xl border",
                        toneClassNames[metric.tone ?? "default"],
                      )}
                    >
                      <Icon className="size-5" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_320px]">
          <div className="space-y-6">
            <Card className="rounded-[1.75rem] border-border/70 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
                <div>
                  <CardTitle className="text-2xl font-semibold tracking-tight">
                    Current Tasks
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Что сейчас важнее всего сделать в этом рабочем контуре.
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboard.tasks.map((task, index) => {
                  const Icon = taskIcons[index % taskIcons.length] ?? ClipboardList;
                  return (
                    <div
                      key={task.testId}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-border/70 bg-background p-4"
                      data-testid={task.testId}
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div
                          className={cn(
                            "mt-1 flex size-11 shrink-0 items-center justify-center rounded-2xl border",
                            toneClassNames[task.tone ?? "default"],
                          )}
                        >
                          <Icon className="size-5" />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <p className="text-base font-semibold">{task.title}</p>
                          <p className="text-sm leading-5 text-muted-foreground">
                            {task.description}
                          </p>
                        </div>
                      </div>
                      <Button asChild className="rounded-xl" data-testid={task.ctaTestId}>
                        <a href={task.href}>
                          {task.ctaLabel}
                          <ArrowRight className="ml-2 size-4" />
                        </a>
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem] border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold tracking-tight">
                  Recent Context
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Важные пояснения и сигналы, которые помогают работать с системой увереннее.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboard.activity.map((item, index) => (
                  <div
                    key={`${item.title}-${index}`}
                    className="rounded-[1.25rem] border border-border/70 bg-muted/20 p-4"
                  >
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-[1.75rem] border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold tracking-tight">
                Quick Shortcuts
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Частые переходы в ключевые рабочие поверхности.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboard.shortcuts.map((shortcut, index) => {
                const Icon = shortcutIcons[index % shortcutIcons.length] ?? FolderKanban;
                return (
                  <a
                    key={shortcut.testId}
                    href={shortcut.href}
                    className="group block rounded-[1.5rem] border border-border/70 bg-background p-5 transition hover:border-primary/30 hover:bg-primary/5"
                    data-testid={shortcut.testId}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/5 text-primary">
                        <Icon className="size-5" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-base font-semibold">{shortcut.title}</p>
                        <p className="text-sm leading-5 text-muted-foreground">
                          {shortcut.description}
                        </p>
                        <div className="inline-flex items-center text-sm font-medium text-primary">
                          {shortcut.ctaLabel}
                          <ArrowRight className="ml-2 size-4 transition group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </div>
                  </a>
                );
              })}
            </CardContent>
          </Card>
        </section>

        {dashboard.emptyState ? (
          <PageEmptyState
            title={dashboard.emptyState.title}
            description={dashboard.emptyState.description}
            testId="home-empty-state"
          />
        ) : null}
      </div>
    </InternalAppShell>
  );
}
