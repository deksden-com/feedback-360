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
  History,
  Sparkles,
  Users,
} from "lucide-react";
import { redirect } from "next/navigation";

const metricIcons = [Users, FolderKanban, Sparkles, BarChart3];
const taskIcons = [ClipboardList, Sparkles, BriefcaseBusiness];
const shortcutIcons = [FolderKanban, Users, Activity, BarChart3];
const activityIcons = [Users, Sparkles, History];

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
      <div className="space-y-8" data-testid={`home-role-${resolved.context.role}`}>
        <section
          className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_320px]"
          data-testid="scr-app-home-root"
        >
          <Card className="overflow-hidden rounded-[2rem] border-0 bg-[#2563eb] text-white shadow-[0_24px_60px_-28px_rgba(37,99,235,0.95)]">
            <CardContent className="relative p-8 md:p-10">
              <div className="relative z-10 max-w-2xl space-y-5">
                <div className="inline-flex items-center rounded-full bg-white/12 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-white/85">
                  {dashboard.roleLabel}
                </div>
                <div className="space-y-3">
                  <h2 className="text-3xl font-semibold tracking-tight md:text-[2.55rem] md:leading-[1.05]">
                    {dashboard.introTitle}
                  </h2>
                  <p
                    className="max-w-xl text-sm leading-6 text-white/85 md:text-[1.02rem]"
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
                  <div className="text-sm text-white/80">
                    Все действия привязаны к активной компании и текущей роли.
                  </div>
                </div>
              </div>
              <div className="absolute right-8 top-8 hidden h-40 w-40 rounded-[2.25rem] bg-white/10 lg:block" />
              <div className="absolute bottom-8 right-10 hidden h-24 w-24 rounded-[1.75rem] border border-white/10 bg-white/10 lg:block" />
              <div className="absolute right-32 top-28 hidden h-14 w-14 rounded-2xl bg-white/8 lg:block" />
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-slate-200/80 bg-white shadow-sm">
            <CardContent className="space-y-5 p-6">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Company snapshot
                </p>
                <p className="text-sm text-slate-500">
                  Ключевые сигналы по текущему рабочему циклу.
                </p>
              </div>
              <div className="space-y-4">
                {dashboard.metrics.map((metric, index) => {
                  const Icon = metricIcons[index % metricIcons.length] ?? BarChart3;
                  return (
                    <div
                      key={metric.testId}
                      className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0"
                      data-testid={metric.testId}
                    >
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {metric.title}
                        </p>
                        <div className="text-[2.5rem] font-semibold tracking-tight text-slate-950">
                          {metric.value}
                        </div>
                        <p className="text-sm leading-5 text-slate-500">{metric.description}</p>
                      </div>
                      <div
                        className={cn(
                          "flex size-11 shrink-0 items-center justify-center rounded-2xl border",
                          toneClassNames[metric.tone ?? "default"],
                        )}
                      >
                        <Icon className="size-5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_320px]">
          <Card className="rounded-[1.9rem] border-slate-200/80 bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
              <div>
                <CardTitle className="text-[1.75rem] font-semibold tracking-tight">
                  Current Tasks
                </CardTitle>
                <p className="mt-1 text-sm text-slate-500">
                  Что сейчас важнее всего сделать в этом рабочем контуре.
                </p>
              </div>
              <a href={dashboard.heroCta.href} className="text-sm font-medium text-primary">
                View all
              </a>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboard.tasks.map((task, index) => {
                const Icon = taskIcons[index % taskIcons.length] ?? ClipboardList;
                return (
                  <div
                    key={task.testId}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-slate-200/80 bg-slate-50/60 p-4"
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
                        <p className="text-base font-semibold text-slate-950">{task.title}</p>
                        <p className="text-sm leading-5 text-slate-500">{task.description}</p>
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

          <Card className="rounded-[1.9rem] border-slate-200/80 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-[1.75rem] font-semibold tracking-tight">
                Quick Shortcuts
              </CardTitle>
              <p className="text-sm text-slate-500">
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
                    className="group block rounded-[1.75rem] border border-slate-200/80 bg-slate-50/60 p-6 text-center transition hover:border-primary/30 hover:bg-primary/5"
                    data-testid={shortcut.testId}
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-full border border-primary/15 bg-primary/5 text-primary">
                        <Icon className="size-5" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-base font-semibold text-slate-950">{shortcut.title}</p>
                        <p className="text-sm leading-5 text-slate-500">{shortcut.description}</p>
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

        <section>
          <Card className="rounded-[1.9rem] border-slate-200/80 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-[1.75rem] font-semibold tracking-tight">
                Recent Activity
              </CardTitle>
              <p className="text-sm text-slate-500">
                Последние сигналы, которые помогают быстрее понять состояние кампаний.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboard.activity.map((item, index) => {
                const Icon = activityIcons[index % activityIcons.length] ?? Activity;
                return (
                  <div
                    key={`${item.title}-${index}`}
                    className="flex items-start gap-4 rounded-[1.25rem] border border-slate-200/80 bg-slate-50/60 p-4"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-slate-950">{item.title}</p>
                        {item.timestamp ? (
                          <span className="text-xs text-slate-400">{item.timestamp}</span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm leading-5 text-slate-500">{item.description}</p>
                    </div>
                  </div>
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
