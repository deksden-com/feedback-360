import type { MembershipRole } from "@feedback-360/api-contract";
import type { ReactNode } from "react";

import {
  getInternalNavSections,
  loadInternalShellMeta,
} from "@/features/app-shell/lib/internal-app-shell";
import type { AppOperationContext } from "@/features/identity-tenancy/lib/operation-context";
import { cn } from "@/lib/utils";

import { Avatar, AvatarLabel } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const isActivePath = (currentPath: string, href: string): boolean => {
  if (href === "/") {
    return currentPath === "/";
  }

  return currentPath === href || currentPath.startsWith(`${href}/`);
};

const NavLinks = ({
  currentPath,
  role,
  className,
}: {
  currentPath: string;
  role: MembershipRole;
  className?: string;
}) => {
  const sections = getInternalNavSections(role);

  return (
    <nav className={className}>
      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.key} className="space-y-2" data-testid={`nav-section-${section.key}`}>
            <p className="px-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {section.label}
            </p>
            <div className="grid gap-1">
              {section.items.map((item) => {
                const active = isActivePath(currentPath, item.href);

                return (
                  <Button
                    key={item.href}
                    asChild
                    variant={active ? "secondary" : "ghost"}
                    className={cn("justify-start rounded-xl", active && "shadow-xs")}
                    data-testid={item.testId}
                  >
                    <a href={item.href} aria-current={active ? "page" : undefined}>
                      {item.label}
                    </a>
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
};

export const InternalAppShell = async ({
  context,
  currentPath,
  title,
  subtitle,
  children,
}: {
  context: AppOperationContext;
  currentPath: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) => {
  const meta = await loadInternalShellMeta(context);

  return (
    <div className="min-h-dvh bg-muted/20" data-testid="internal-app-shell">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6 lg:flex-row">
        <aside className="hidden w-full max-w-xs shrink-0 lg:block">
          <Card className="sticky top-6 overflow-hidden border-border/80 shadow-sm">
            <CardHeader className="space-y-4 border-b bg-card/95 backdrop-blur">
              <div className="space-y-2">
                <div className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                  go360go workspace
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-2xl">go360go</CardTitle>
                  <CardDescription>
                    Оценка 360°, оргструктура и результаты в одном контексте.
                  </CardDescription>
                </div>
              </div>
              <div
                className="rounded-2xl border border-border/80 bg-muted/40 p-4 text-sm"
                data-testid="shell-company-card"
              >
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Активная компания
                </p>
                <p className="mt-2 font-semibold" data-testid="shell-company-name">
                  {meta.companyName}
                </p>
                <p className="mt-1 text-xs text-muted-foreground" data-testid="shell-role-label">
                  {meta.companySummary}
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <NavLinks currentPath={currentPath} role={context.role} className="grid gap-1" />
              <div className="space-y-2 border-t pt-4">
                <div className="rounded-2xl border border-border/80 bg-muted/30 p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10 rounded-xl bg-primary/10 text-primary">
                      <AvatarLabel>{meta.accountInitials}</AvatarLabel>
                    </Avatar>
                    <div className="min-w-0">
                      <p
                        className="truncate text-sm font-semibold"
                        data-testid="shell-account-name"
                      >
                        {meta.accountLabel}
                      </p>
                      <p
                        className="truncate text-xs text-muted-foreground"
                        data-testid="shell-account-meta"
                      >
                        {meta.roleLabel}
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="w-full rounded-xl"
                  data-testid="shell-switch-company"
                >
                  <a href="/select-company">Сменить компанию</a>
                </Button>
                <form action="/api/session/logout" method="post">
                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full rounded-xl"
                    data-testid="shell-sign-out"
                  >
                    Выйти
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </aside>

        <div className="min-w-0 flex-1 space-y-4">
          <Card className="lg:hidden">
            <CardContent className="space-y-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-lg font-semibold">go360go</p>
                  <p
                    className="text-sm text-muted-foreground"
                    data-testid="shell-company-name-mobile"
                  >
                    {meta.companySummary}
                  </p>
                </div>
                <Avatar className="size-10 rounded-xl bg-primary/10 text-primary">
                  <AvatarLabel>{meta.accountInitials}</AvatarLabel>
                </Avatar>
              </div>
              <NavLinks currentPath={currentPath} role={context.role} className="grid gap-3" />
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" data-testid="shell-switch-company-mobile">
                  <a href="/select-company">Сменить компанию</a>
                </Button>
                <form action="/api/session/logout" method="post">
                  <Button type="submit" variant="outline" data-testid="shell-sign-out-mobile">
                    Выйти
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>

          <header className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4 rounded-[1.75rem] border border-border/80 bg-card/95 p-5 shadow-sm">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                    {meta.roleLabel}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-border/80 bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
                    {meta.companyName}
                  </span>
                </div>
                <div className="space-y-1">
                  <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
                  <p className="max-w-3xl text-sm text-muted-foreground md:text-base">{subtitle}</p>
                </div>
              </div>
              <details
                className="group hidden min-w-[260px] lg:block"
                data-testid="shell-account-menu"
              >
                <summary className="flex list-none cursor-pointer items-center justify-between gap-3 rounded-2xl border border-border/80 bg-muted/20 px-4 py-3 text-left transition hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-11 rounded-2xl bg-primary/10 text-primary">
                      <AvatarLabel>{meta.accountInitials}</AvatarLabel>
                    </Avatar>
                    <div className="min-w-0">
                      <p
                        className="truncate text-sm font-semibold"
                        data-testid="shell-account-name-desktop"
                      >
                        {meta.accountLabel}
                      </p>
                      <p
                        className="truncate text-xs text-muted-foreground"
                        data-testid="shell-account-role-desktop"
                      >
                        {meta.roleLabel}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground transition group-open:rotate-180">
                    ⌄
                  </span>
                </summary>
                <div className="mt-3 rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
                  <div className="space-y-1 border-b pb-3">
                    <p className="text-sm font-semibold">{meta.companyName}</p>
                    <p className="text-xs text-muted-foreground" data-testid="shell-company-id">
                      {meta.accountMeta}
                    </p>
                  </div>
                  <div className="mt-3 grid gap-2">
                    <Button asChild variant="outline" className="w-full justify-start rounded-xl">
                      <a href="/select-company">Сменить компанию</a>
                    </Button>
                    <form action="/api/session/logout" method="post">
                      <Button
                        type="submit"
                        variant="outline"
                        className="w-full justify-start rounded-xl"
                        data-testid="shell-sign-out-desktop"
                      >
                        Выйти из аккаунта
                      </Button>
                    </form>
                  </div>
                </div>
              </details>
            </div>
          </header>

          <section className="space-y-4">{children}</section>
        </div>
      </div>
    </div>
  );
};
