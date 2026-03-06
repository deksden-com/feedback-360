import { InternalAppShell } from "@/components/internal-app-shell";
import { PageEmptyState, PageErrorState, PageStateScreen } from "@/components/page-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { applyDebugPageDelay } from "@/lib/debug-page-delay";
import { loadHomeDashboard } from "@/lib/home-dashboard";
import { resolveAppOperationContext } from "@/lib/operation-context";
import { getFriendlyErrorCopy } from "@/lib/page-state";
import { redirect } from "next/navigation";

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
      <div className="space-y-4" data-testid={`home-role-${resolved.context.role}`}>
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              {dashboard.introTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border p-4 text-sm">
              <p className="text-muted-foreground">Активная роль</p>
              <p className="font-medium" data-testid="home-role-label">
                {dashboard.roleLabel}
              </p>
              <p className="mt-2 text-muted-foreground" data-testid="home-intro-description">
                {dashboard.introDescription}
              </p>
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
