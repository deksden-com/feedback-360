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
import { Card, CardContent } from "@/components/ui/card";
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  FolderKanban,
  HelpCircle,
  Home,
  LayoutDashboard,
  Megaphone,
  Network,
  Search,
  Settings2,
  Sparkles,
  Users,
} from "lucide-react";

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
  const iconMap: Record<string, typeof Home> = {
    "/": LayoutDashboard,
    "/questionnaires": BriefcaseBusiness,
    "/results": Sparkles,
    "/results/team": Users,
    "/hr/employees": Users,
    "/hr/org": Network,
    "/hr/models": FolderKanban,
    "/hr/campaigns": FolderKanban,
    "/results/hr": Sparkles,
    "/hr/notifications": Megaphone,
    "/ops": Settings2,
  };

  return (
    <nav className={className}>
      <div className="space-y-5">
        {sections.map((section) => (
          <div key={section.key} className="space-y-2" data-testid={`nav-section-${section.key}`}>
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
              {section.label}
            </p>
            <div className="grid gap-1">
              {section.items.map((item) => {
                const active = isActivePath(currentPath, item.href);
                const Icon = iconMap[item.href] ?? Home;

                return (
                  <Button
                    key={item.href}
                    asChild
                    variant={active ? "secondary" : "ghost"}
                    className={cn(
                      "h-11 justify-start rounded-2xl px-3 text-sm",
                      active &&
                        "bg-primary/10 text-primary shadow-none hover:bg-primary/10 hover:text-primary",
                    )}
                    data-testid={item.testId}
                  >
                    <a href={item.href} aria-current={active ? "page" : undefined}>
                      <Icon className="mr-3 size-4 shrink-0" />
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
    <div className="min-h-dvh bg-slate-50/80" data-testid="internal-app-shell">
      <div className="flex min-h-dvh">
        <aside className="hidden w-[228px] shrink-0 border-r border-slate-200/80 bg-white lg:flex lg:flex-col">
          <div className="border-b border-slate-200/80 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-white shadow-sm">
                <Sparkles className="size-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-lg font-semibold tracking-tight">go360go</p>
                <p className="text-sm text-muted-foreground">{meta.roleLabel} workspace</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 px-4 py-5">
            <div
              className="rounded-3xl border border-slate-200/80 bg-slate-50 px-4 py-3"
              data-testid="shell-company-card"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Building2 className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
                    Active workspace
                  </p>
                  <p className="truncate text-sm font-semibold" data-testid="shell-company-name">
                    {meta.companyName}
                  </p>
                </div>
              </div>
            </div>

            <NavLinks currentPath={currentPath} role={context.role} className="grid gap-1" />
          </div>

          <div className="mt-auto border-t border-slate-200/80 px-4 py-4">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-3 shadow-sm">
              <div className="flex items-center gap-3">
                <Avatar className="size-11 rounded-2xl bg-primary/10 text-primary">
                  <AvatarLabel>{meta.accountInitials}</AvatarLabel>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold" data-testid="shell-account-name">
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
              <div className="mt-4 grid gap-2">
                <Button
                  asChild
                  variant="outline"
                  className="h-10 justify-start rounded-2xl"
                  data-testid="shell-switch-company"
                >
                  <a href="/select-company">Сменить компанию</a>
                </Button>
                <form action="/api/session/logout" method="post">
                  <Button
                    type="submit"
                    variant="outline"
                    className="h-10 w-full justify-start rounded-2xl"
                    data-testid="shell-sign-out"
                  >
                    Выйти
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <Card className="m-4 border-slate-200/80 lg:hidden">
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

          <div className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
            <div className="flex min-h-[72px] items-center justify-between gap-4 px-4 md:px-6 lg:px-8">
              <div className="hidden min-w-0 flex-1 md:flex">
                <div className="flex h-11 w-full max-w-sm items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-muted-foreground">
                  <Search className="size-4" />
                  <span>Search campaigns, people, questionnaires…</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 md:flex">
                  <span>{meta.companyName}</span>
                </div>
                <button
                  type="button"
                  className="hidden size-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 md:inline-flex"
                  aria-label="Уведомления"
                >
                  <Bell className="size-4" />
                </button>
                <button
                  type="button"
                  className="hidden size-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 md:inline-flex"
                  aria-label="Помощь"
                >
                  <HelpCircle className="size-4" />
                </button>
                <details className="group relative" data-testid="shell-account-menu">
                  <summary className="flex list-none cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left shadow-sm">
                    <Avatar className="size-10 rounded-2xl bg-primary/10 text-primary">
                      <AvatarLabel>{meta.accountInitials}</AvatarLabel>
                    </Avatar>
                    <div className="hidden min-w-0 md:block">
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
                  </summary>
                  <div className="absolute right-0 top-[calc(100%+12px)] z-20 hidden w-72 rounded-3xl border border-slate-200 bg-white p-4 shadow-xl group-open:block">
                    <div className="space-y-1 border-b border-slate-100 pb-3">
                      <p className="text-sm font-semibold">{meta.companyName}</p>
                      <p className="text-xs text-muted-foreground" data-testid="shell-company-id">
                        {meta.accountMeta}
                      </p>
                    </div>
                    <div className="mt-3 grid gap-2">
                      <Button asChild variant="outline" className="h-10 justify-start rounded-2xl">
                        <a href="/select-company">Сменить компанию</a>
                      </Button>
                      <form action="/api/session/logout" method="post">
                        <Button
                          type="submit"
                          variant="outline"
                          className="h-10 w-full justify-start rounded-2xl"
                          data-testid="shell-sign-out-desktop"
                        >
                          Выйти из аккаунта
                        </Button>
                      </form>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </div>

          <section className="space-y-6 px-4 py-6 md:px-6 lg:px-8">
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
              <p className="text-sm text-slate-500 md:text-base">{subtitle}</p>
            </div>
            {children}
          </section>
        </div>
      </div>
    </div>
  );
};
