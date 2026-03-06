import type { MembershipRole } from "@feedback-360/api-contract";
import type { ReactNode } from "react";

import { getInternalNavItems, loadInternalShellMeta } from "@/lib/internal-app-shell";
import type { AppOperationContext } from "@/lib/operation-context";
import { cn } from "@/lib/utils";

import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

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
  const items = getInternalNavItems(role);

  return (
    <nav className={className}>
      {items.map((item) => {
        const active = isActivePath(currentPath, item.href);

        return (
          <Button
            key={item.href}
            asChild
            variant={active ? "secondary" : "ghost"}
            className={cn("justify-start", active && "shadow-xs")}
            data-testid={item.testId}
          >
            <a href={item.href} aria-current={active ? "page" : undefined}>
              {item.label}
            </a>
          </Button>
        );
      })}
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
          <Card className="sticky top-6">
            <CardHeader className="space-y-3">
              <div className="space-y-1">
                <CardTitle className="text-2xl">go360go</CardTitle>
                <CardDescription>Internal 360 feedback workspace</CardDescription>
              </div>
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                <p className="text-muted-foreground">Активная компания</p>
                <p className="font-medium" data-testid="shell-company-name">
                  {meta.companyName}
                </p>
                <p className="text-xs text-muted-foreground" data-testid="shell-role-label">
                  {meta.roleLabel}
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <NavLinks currentPath={currentPath} role={context.role} className="grid gap-1" />
              <div className="flex flex-col gap-2 border-t pt-3">
                <Button asChild variant="outline" data-testid="shell-switch-company">
                  <a href="/select-company">Сменить компанию</a>
                </Button>
                <form action="/api/session/logout" method="post">
                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full"
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
              <div className="space-y-1">
                <p className="text-lg font-semibold">go360go</p>
                <p
                  className="text-sm text-muted-foreground"
                  data-testid="shell-company-name-mobile"
                >
                  {meta.companyName} · {meta.roleLabel}
                </p>
              </div>
              <NavLinks
                currentPath={currentPath}
                role={context.role}
                className="flex flex-wrap gap-2"
              />
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

          <header className="space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
                <p className="text-muted-foreground">{subtitle}</p>
              </div>
              <div className="hidden rounded-lg border bg-background px-4 py-3 text-right text-sm lg:block">
                <p className="text-muted-foreground">Company ID</p>
                <p className="font-mono text-xs" data-testid="shell-company-id">
                  {meta.companyId}
                </p>
              </div>
            </div>
          </header>

          <section className="space-y-4">{children}</section>
        </div>
      </div>
    </div>
  );
};
