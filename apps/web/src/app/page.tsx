import { InternalAppShell } from "@/components/internal-app-shell";
import { PageEmptyState, PageErrorState, PageStateScreen } from "@/components/page-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { applyDebugPageDelay } from "@/lib/debug-page-delay";
import { loadHomeDashboard } from "@/lib/home-dashboard";
import { resolveAppOperationContext } from "@/lib/operation-context";
import { getFriendlyErrorCopy } from "@/lib/page-state";
import { redirect } from "next/navigation";

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
      <div className="space-y-5" data-testid={`home-role-${resolved.context.role}`}>
        <Card
          className="overflow-hidden border-border/80 shadow-sm"
          data-testid="scr-app-home-root"
        >
          <CardHeader className="space-y-3 border-b bg-muted/25">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              {dashboard.introTitle}
            </CardTitle>
            <p className="max-w-2xl text-sm text-muted-foreground">{dashboard.introDescription}</p>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
              <div className="rounded-2xl border border-border/80 bg-background p-4 text-sm">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Активная роль
                </p>
                <p className="mt-2 text-lg font-semibold" data-testid="home-role-label">
                  {dashboard.roleLabel}
                </p>
                <p className="mt-2 text-muted-foreground" data-testid="home-intro-description">
                  {dashboard.introDescription}
                </p>
              </div>
              <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-primary">
                Все действия открываются в текущем company context.
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-3">
          {dashboard.cards.map((card) => (
            <Card key={card.testId} data-testid={card.testId}>
              <CardHeader className="space-y-2">
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <CardTitle className="text-3xl font-semibold tracking-tight">
                  {card.value}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{card.description}</p>
                <Button asChild data-testid={card.ctaTestId}>
                  <a href={card.href}>{card.ctaLabel}</a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Почему это полезно</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground">
            {dashboard.highlights.map((highlight) => (
              <div key={highlight} className="rounded-md border bg-muted/20 p-3">
                {highlight}
              </div>
            ))}
          </CardContent>
        </Card>

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
