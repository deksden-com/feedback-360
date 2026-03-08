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
  ArrowLeftRight,
  Bell,
  BriefcaseBusiness,
  FolderKanban,
  HelpCircle,
  Home,
  LayoutDashboard,
  LogOut,
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
  const items = sections.flatMap((section) => section.items);
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
      <div className="grid gap-5">
        {sections.map((section) => (
          <div key={section.key} className="space-y-1.5" data-testid={`nav-section-${section.key}`}>
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
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
                      "h-11 justify-start rounded-xl px-3 text-sm font-medium text-slate-600 shadow-none hover:bg-slate-100 hover:text-slate-900",
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
    <div className="min-h-dvh bg-[#f6f6f8]" data-testid="internal-app-shell">
      <div className="flex min-h-dvh">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
                <Sparkles className="size-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-lg font-bold tracking-tight">go360go</p>
                <p className="text-xs text-slate-500">{meta.roleLabel} portal</p>
              </div>
            </div>
          </div>

          <div className="flex-1 px-4 py-4">
            <NavLinks currentPath={currentPath} role={context.role} className="grid gap-1" />
          </div>

          <div className="mt-auto border-t border-slate-200 px-4 py-4">
            <details
              className="group rounded-xl"
              data-testid="shell-account-menu"
              name="shell-account-menu"
            >
              <summary
                className="flex cursor-pointer list-none items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-slate-50 [&::-webkit-details-marker]:hidden"
                data-testid="shell-company-card"
              >
                <Avatar className="size-9 rounded-full bg-primary/15 text-primary">
                  <AvatarLabel>{meta.accountInitials}</AvatarLabel>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold" data-testid="shell-company-name">
                    {meta.companyName}
                  </p>
                  <p className="truncate text-xs text-slate-500" data-testid="shell-account-meta">
                    {meta.roleLabel} · {meta.accountLabel}
                  </p>
                </div>
                <LogOut className="size-4 text-slate-300 transition group-open:rotate-180" />
              </summary>
              <div className="mt-2 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="space-y-1">
                  <p className="truncate text-sm font-semibold" data-testid="shell-account-name">
                    {meta.accountLabel}
                  </p>
                  <p className="truncate text-xs text-slate-500">{meta.accountMeta}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" className="h-9 rounded-lg px-3 text-xs">
                    <a href="/select-company" data-testid="shell-switch-company-sidebar">
                      Сменить компанию
                    </a>
                  </Button>
                  <form action="/api/session/logout" method="post" className="flex-1">
                    <Button
                      type="submit"
                      variant="secondary"
                      className="h-9 w-full rounded-lg bg-slate-900 px-3 text-xs text-white hover:bg-slate-800"
                      data-testid="shell-sign-out-desktop"
                    >
                      <LogOut className="size-4" />
                      Выйти
                    </Button>
                  </form>
                </div>
              </div>
            </details>
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

          <div className="border-b border-slate-200 bg-white">
            <div className="flex min-h-16 items-center justify-between gap-4 px-4 md:px-6 lg:px-8">
              <div className="hidden min-w-0 flex-1 md:flex">
                <div className="flex h-10 w-full max-w-xs items-center gap-3 rounded-lg bg-slate-100 px-4 text-sm text-slate-400">
                  <Search className="size-4" />
                  <span>Search campaigns, people, questionnaires…</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href="/select-company"
                  className="hidden items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-primary md:flex"
                  data-testid="shell-switch-company"
                >
                  <span data-testid="active-company-name">{meta.companyName}</span>
                  <ArrowLeftRight className="size-4 text-slate-400" />
                </a>
                <div className="hidden h-6 w-px bg-slate-200 md:block" />
                <button
                  type="button"
                  className="hidden size-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 md:inline-flex"
                  aria-label="Уведомления"
                >
                  <Bell className="size-4" />
                </button>
                <button
                  type="button"
                  className="hidden size-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 md:inline-flex"
                  aria-label="Помощь"
                >
                  <HelpCircle className="size-4" />
                </button>
                <div className="hidden items-center gap-3 md:flex">
                  <Avatar className="size-9 rounded-full bg-primary/15 text-primary">
                    <AvatarLabel>{meta.accountInitials}</AvatarLabel>
                  </Avatar>
                  <div className="hidden min-w-0 lg:block">
                    <p
                      className="truncate text-sm font-semibold"
                      data-testid="shell-account-name-desktop"
                    >
                      {meta.accountLabel}
                    </p>
                    <p
                      className="truncate text-xs text-slate-500"
                      data-testid="shell-account-role-desktop"
                    >
                      {meta.roleLabel}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section className="space-y-8 px-4 py-8 md:px-6 lg:px-8">
            <div className="space-y-1">
              <h1 className="text-4xl font-black tracking-tight text-slate-950">{title}</h1>
              <p className="text-base text-slate-500">{subtitle}</p>
            </div>
            {children}
          </section>
        </div>
      </div>
    </div>
  );
};
