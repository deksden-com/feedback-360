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
  BarChart3,
  BriefcaseBusiness,
  ClipboardList,
  FolderKanban,
  History,
  Sparkles,
  Users,
} from "lucide-react";
import { redirect } from "next/navigation";

const taskIcons = [ClipboardList, Sparkles, BriefcaseBusiness];
const shortcutIcons = [FolderKanban, Users, Activity, BarChart3];
const activityIcons = [Users, Sparkles, History];

const toneClassNames: Record<string, string> = {
  default: "bg-slate-100 text-slate-500",
  primary: "bg-blue-100 text-blue-600",
  success: "bg-emerald-100 text-emerald-600",
  warning: "bg-amber-100 text-amber-600",
};

/**
 * Role-aware internal home dashboard.
 * @docs .memory-bank/spec/ui/screens/internal-home.md
 * @see .memory-bank/spec/ui/screen-registry.md
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
  const metrics = dashboard.metrics.slice(0, 3);
  const shortcuts = dashboard.shortcuts.slice(0, 3);

  return (
    <InternalAppShell
      context={resolved.context}
      currentPath="/"
      title={dashboard.title}
      subtitle={dashboard.subtitle}
    >
      <div className="space-y-8" data-testid={`home-role-${resolved.context.role}`}>
        <section className="grid gap-6 lg:grid-cols-3" data-testid="scr-app-home-root">
          <Card className="overflow-hidden rounded-xl border-0 bg-gradient-to-br from-primary to-blue-600 text-white shadow-sm lg:col-span-2">
            <CardContent className="relative p-8">
              <div className="relative z-10 max-w-xl space-y-6">
                <div className="space-y-3">
                  <h2 className="text-[2rem] font-bold tracking-tight">{dashboard.introTitle}</h2>
                  <p
                    className="max-w-md text-[15px] leading-7 text-white/85"
                    data-testid="home-intro-description"
                  >
                    {dashboard.introDescription}
                  </p>
                </div>
                <Button
                  asChild
                  className="h-11 rounded-lg bg-white px-6 text-sm font-bold text-primary shadow-none hover:bg-slate-50"
                  data-testid={dashboard.heroCta.testId}
                >
                  <a href={dashboard.heroCta.href}>{dashboard.heroCta.label}</a>
                </Button>
              </div>
              <div className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 translate-x-2 translate-y-2 rounded-[1.75rem] bg-white/10" />
              <div className="pointer-events-none absolute bottom-5 right-7 text-white/10">
                <BarChart3 className="size-28" strokeWidth={1.25} />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-slate-200 bg-white shadow-sm">
            <CardContent className="space-y-4 p-6">
              {metrics.map((metric, index) => (
                <div
                  key={metric.testId}
                  className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0"
                  data-testid={metric.testId}
                >
                  <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                    {metric.title}
                  </span>
                  <div className="flex items-center gap-2">
                    {index === 2 ? (
                      <span className="relative flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
                      </span>
                    ) : null}
                    <span className="text-[2rem] font-bold tracking-tight text-primary">
                      {metric.value}
                    </span>
                  </div>
                </div>
              ))}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-400">Last system sync: 2 minutes ago</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-8 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[1.75rem] font-bold tracking-tight text-slate-950">
                  Current Tasks
                </h3>
                <a href={dashboard.heroCta.href} className="text-sm font-semibold text-primary">
                  View All
                </a>
              </div>
              <div className="space-y-3">
                {dashboard.tasks.map((task, index) => {
                  const Icon = taskIcons[index % taskIcons.length] ?? ClipboardList;
                  const buttonPrimary = index === 0;

                  return (
                    <div
                      key={task.testId}
                      className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm"
                      data-testid={task.testId}
                    >
                      <div
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-full",
                          toneClassNames[task.tone ?? "default"],
                        )}
                      >
                        <Icon className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-950">{task.title}</p>
                        <p className="text-sm text-slate-500">{task.description}</p>
                      </div>
                      <Button
                        asChild
                        variant={buttonPrimary ? "default" : "outline"}
                        className={cn(
                          "h-8 rounded-lg px-4 text-xs font-bold",
                          !buttonPrimary && "border-primary text-primary hover:bg-primary/5",
                        )}
                        data-testid={task.ctaTestId}
                      >
                        <a href={task.href}>{task.ctaLabel}</a>
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <h3 className="text-[1.75rem] font-bold tracking-tight text-slate-950">
                Recent Activity
              </h3>
              <Card className="overflow-hidden rounded-xl border-slate-200 bg-white shadow-sm">
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100">
                    {dashboard.activity.map((item, index) => {
                      const Icon = activityIcons[index % activityIcons.length] ?? Activity;
                      return (
                        <div key={`${item.title}-${index}`} className="flex items-start gap-4 p-4">
                          <div
                            className={cn(
                              "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                              toneClassNames[item.tone ?? "default"],
                            )}
                          >
                            <Icon className="size-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm leading-6 text-slate-700">
                              <span className="font-bold text-slate-950">{item.title}</span>
                              {item.description ? ` ${item.description}` : ""}
                            </p>
                            {item.timestamp ? (
                              <p className="mt-1 text-xs text-slate-400">{item.timestamp}</p>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    className="w-full py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-50"
                  >
                    Load More Activity
                  </button>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-[1.75rem] font-bold tracking-tight text-slate-950">
                Quick Shortcuts
              </h3>
              <div className="grid gap-4">
                {shortcuts.map((shortcut, index) => {
                  const Icon = shortcutIcons[index % shortcutIcons.length] ?? FolderKanban;
                  return (
                    <a
                      key={shortcut.testId}
                      href={shortcut.href}
                      className="group flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-6 text-center transition-all hover:border-primary"
                      data-testid={shortcut.testId}
                    >
                      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
                        <Icon className="size-5" />
                      </div>
                      <span className="font-bold text-slate-950">{shortcut.title}</span>
                      <span className="mt-1 text-xs text-slate-500">{shortcut.description}</span>
                    </a>
                  );
                })}
              </div>
            </div>

            <Card className="rounded-xl border border-dashed border-slate-300 bg-slate-50 shadow-none">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center gap-2">
                  <Activity className="size-4 text-primary" />
                  <h4 className="text-sm font-bold uppercase tracking-tight text-slate-950">
                    System Status
                  </h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">API Health</span>
                    <span className="font-bold text-emerald-500">Stable</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">AI Model</span>
                    <span className="font-medium text-slate-950">Active</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full w-[88%] bg-primary" />
                  </div>
                  <p className="text-[10px] text-slate-400">Database storage: 88% utilized</p>
                </div>
              </CardContent>
            </Card>
          </div>
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
