import { InternalAppShell } from "@/components/internal-app-shell";
import { InlineBanner, PageErrorState, PageStateScreen } from "@/components/page-state";
import { Avatar, AvatarLabel } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resolveAppOperationContext } from "@/lib/operation-context";
import { getFriendlyErrorCopy } from "@/lib/page-state";
import { createInprocClient } from "@feedback-360/client";
import { redirect } from "next/navigation";

import {
  getDisplayInitials,
  getEmployeeDisplayName,
  getQueryValue,
  getRoleLabel,
} from "@/features/people-org/lib/people-org";

/**
 * Employee detail and provisioning surface for HR roles.
 * @screenId SCR-HR-EMPLOYEE-DETAIL
 * @testIdScope scr-hr-employee-detail
 */
export default async function EmployeeProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ employeeId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ employeeId }, query] = await Promise.all([
    params,
    searchParams ?? Promise.resolve<Record<string, string | string[] | undefined>>({}),
  ]);
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
      title: "Не удалось открыть профиль сотрудника",
      description: "Попробуйте обновить страницу или войти заново.",
    });

    return (
      <PageStateScreen>
        <PageErrorState title={state.title} description={state.description} />
      </PageStateScreen>
    );
  }

  const isHrRole = resolved.context.role === "hr_admin" || resolved.context.role === "hr_reader";
  if (!isHrRole) {
    return (
      <InternalAppShell
        context={resolved.context}
        currentPath="/hr/employees"
        title="Профиль сотрудника"
        subtitle="Раздел доступен только для ролей HR Admin и HR Reader."
      >
        <PageErrorState
          title="Недостаточно прав"
          description="Откройте доступный для вашей роли рабочий раздел."
          actions={[{ href: "/", label: "Вернуться на главную", variant: "outline" }]}
        />
      </InternalAppShell>
    );
  }

  const client = createInprocClient();
  const [profile, departments, managers] = await Promise.all([
    client.employeeProfileGet({ employeeId }, resolved.context),
    client.departmentList({ includeInactive: true }, resolved.context),
    client.employeeListActive({}, resolved.context),
  ]);

  if (!profile.ok || !departments.ok || !managers.ok) {
    const error = !profile.ok
      ? profile.error
      : !departments.ok
        ? departments.error
        : !managers.ok
          ? managers.error
          : undefined;
    if (!error) {
      redirect("/hr/employees");
    }
    const state = getFriendlyErrorCopy(error, {
      title: "Не удалось загрузить профиль сотрудника",
      description: "Employee profile, departments или manager options временно недоступны.",
    });

    return (
      <InternalAppShell
        context={resolved.context}
        currentPath="/hr/employees"
        title="Профиль сотрудника"
        subtitle="Детали сотрудника, история оргизменений и company access."
      >
        <PageErrorState
          title={state.title}
          description={state.description}
          actions={[
            { href: "/hr/employees", label: "Вернуться к справочнику", variant: "outline" },
          ]}
        />
      </InternalAppShell>
    );
  }

  const flash = getQueryValue(query.flash);
  const managerOptions = managers.data.items.filter((item) => item.employeeId !== employeeId);
  const profileName = getEmployeeDisplayName(profile.data);

  return (
    <InternalAppShell
      context={resolved.context}
      currentPath="/hr/employees"
      title={profileName}
      subtitle="Профиль сотрудника: HR record, access provisioning и история оргизменений."
    >
      <div className="space-y-5" data-testid="scr-hr-employee-detail-root">
        {flash === "saved" ? (
          <InlineBanner
            description="Изменения профиля сохранены."
            tone="success"
            testId="employee-profile-flash-saved"
          />
        ) : flash === "provisioned" ? (
          <InlineBanner
            description="Доступ и company role обновлены."
            tone="success"
            testId="employee-profile-flash-provisioned"
          />
        ) : flash === "moved" ? (
          <InlineBanner
            description="Сотрудник перемещён в новое подразделение."
            tone="success"
            testId="employee-profile-flash-moved"
          />
        ) : flash === "manager" ? (
          <InlineBanner
            description="Руководитель обновлён."
            tone="success"
            testId="employee-profile-flash-manager"
          />
        ) : null}

        <Card className="overflow-hidden border-border/80 shadow-sm">
          <CardHeader className="gap-4 border-b bg-muted/25">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-4">
                <Avatar className="size-14 rounded-3xl bg-primary/10 text-primary">
                  <AvatarLabel>{getDisplayInitials(profileName)}</AvatarLabel>
                </Avatar>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl">{profileName}</CardTitle>
                    <CardDescription className="text-sm">
                      {profile.data.currentPositionTitle ?? "Должность не указана"} ·{" "}
                      {profile.data.currentDepartmentName ?? "Без подразделения"}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full border border-border/80 bg-background px-3 py-1 text-xs font-medium text-foreground">
                      {getRoleLabel(profile.data.membershipRole) ?? "Нет доступа"}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-border/80 bg-background px-3 py-1 text-xs text-muted-foreground">
                      {profile.data.currentManagerName ?? "Руководитель не назначен"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2" data-testid="scr-hr-employee-detail-toolbar">
                <Button asChild variant="outline">
                  <a href="/hr/employees">К справочнику</a>
                </Button>
                <Button asChild variant="outline">
                  <a href={`/hr/org?employeeId=${employeeId}`}>Открыть в оргструктуре</a>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 pt-6 md:grid-cols-4">
            <div className="rounded-2xl border border-border/80 bg-background p-4">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="mt-2 text-lg font-semibold">{profile.data.email}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-background p-4">
              <p className="text-sm text-muted-foreground">Подразделение</p>
              <p className="mt-2 text-lg font-semibold">
                {profile.data.currentDepartmentName ?? "—"}
              </p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-background p-4">
              <p className="text-sm text-muted-foreground">Руководитель</p>
              <p className="mt-2 text-lg font-semibold">{profile.data.currentManagerName ?? "—"}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-background p-4">
              <p className="text-sm text-muted-foreground">User link</p>
              <p className="mt-2 text-lg font-semibold">{profile.data.userId ?? "Не привязан"}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <Card data-testid="employee-profile-summary">
            <CardHeader>
              <CardTitle className="text-xl">Текущий профиль</CardTitle>
              <CardDescription>HR-справочник и текущий оргконтекст сотрудника.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium" data-testid="employee-profile-email">
                  {profile.data.email}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Company role</p>
                <p className="font-medium" data-testid="employee-profile-role">
                  {getRoleLabel(profile.data.membershipRole) ?? "Нет доступа"}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Подразделение</p>
                <p className="font-medium">{profile.data.currentDepartmentName ?? "—"}</p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Руководитель</p>
                <p className="font-medium">{profile.data.currentManagerName ?? "—"}</p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Должность</p>
                <p className="font-medium">{profile.data.currentPositionTitle ?? "—"}</p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">User link</p>
                <p className="font-medium">{profile.data.userId ?? "Не привязан"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Быстрые действия</CardTitle>
              <CardDescription>
                Перейдите к оргредактору или обновите access в рамках компании.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Employee управляет HR-профилем, а User отвечает за вход и memberships.</p>
              <p>
                После старта кампаний historical snapshots не меняются, даже если здесь обновить
                сотрудника.
              </p>
            </CardContent>
          </Card>
        </div>

        {resolved.context.role === "hr_admin" ? (
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Редактировать HR-профиль</CardTitle>
                <CardDescription>
                  Контакты, статус и Telegram placeholders сотрудника.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  action="/api/hr/employees/upsert"
                  method="post"
                  className="grid gap-4"
                  data-testid="employee-profile-form"
                >
                  <input type="hidden" name="employeeId" value={profile.data.employeeId} />
                  <input
                    type="hidden"
                    name="returnTo"
                    value={`/hr/employees/${profile.data.employeeId}`}
                  />
                  <div className="grid gap-2">
                    <Label htmlFor="employee-email">Email</Label>
                    <Input
                      id="employee-email"
                      name="email"
                      type="email"
                      defaultValue={profile.data.email}
                      required
                      data-testid="employee-profile-email-input"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="employee-first-name">Имя</Label>
                      <Input
                        id="employee-first-name"
                        name="firstName"
                        defaultValue={profile.data.firstName ?? ""}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="employee-last-name">Фамилия</Label>
                      <Input
                        id="employee-last-name"
                        name="lastName"
                        defaultValue={profile.data.lastName ?? ""}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="employee-phone">Телефон</Label>
                      <Input
                        id="employee-phone"
                        name="phone"
                        defaultValue={profile.data.phone ?? ""}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="employee-telegram-user-id">Telegram user id</Label>
                      <Input
                        id="employee-telegram-user-id"
                        name="telegramUserId"
                        defaultValue={profile.data.telegramUserId ?? ""}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="employee-telegram-chat-id">Telegram chat id</Label>
                    <Input
                      id="employee-telegram-chat-id"
                      name="telegramChatId"
                      defaultValue={profile.data.telegramChatId ?? ""}
                    />
                  </div>
                  <div className="flex items-center gap-3 rounded-md border px-3 py-2">
                    <input
                      id="employee-is-active"
                      name="isActive"
                      type="checkbox"
                      defaultChecked={profile.data.isActive}
                      value="true"
                    />
                    <Label htmlFor="employee-is-active">Сотрудник активен в справочнике</Label>
                  </div>
                  <Button type="submit" data-testid="employee-profile-save">
                    Сохранить профиль
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Provision access</CardTitle>
                <CardDescription>
                  Привяжите или обновите User account и company role для этого сотрудника.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  action="/api/hr/employees/provision"
                  method="post"
                  className="grid gap-4"
                  data-testid="employee-provision-form"
                >
                  <input type="hidden" name="employeeId" value={profile.data.employeeId} />
                  <input
                    type="hidden"
                    name="returnTo"
                    value={`/hr/employees/${profile.data.employeeId}`}
                  />
                  <div className="grid gap-2">
                    <Label htmlFor="provision-user-id">User id</Label>
                    <Input
                      id="provision-user-id"
                      name="userId"
                      defaultValue={profile.data.userId ?? crypto.randomUUID()}
                      data-testid="employee-provision-user-id"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="provision-email">Login email</Label>
                    <Input
                      id="provision-email"
                      name="email"
                      type="email"
                      defaultValue={profile.data.email}
                      data-testid="employee-provision-email"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="provision-role">Company role</Label>
                    <select
                      id="provision-role"
                      name="role"
                      defaultValue={profile.data.membershipRole ?? "employee"}
                      className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                      data-testid="employee-provision-role"
                    >
                      <option value="employee">Сотрудник</option>
                      <option value="manager">Руководитель</option>
                      <option value="hr_reader">HR Reader</option>
                      <option value="hr_admin">HR Admin</option>
                    </select>
                  </div>
                  <Button type="submit" data-testid="employee-provision-submit">
                    Обновить доступ
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">История подразделений</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3" data-testid="employee-profile-department-history">
              {profile.data.departmentHistory.map((item, index) => (
                <div
                  key={`${item.departmentId}:${item.startAt}:${index}`}
                  className="rounded-lg border p-3 text-sm"
                >
                  <p className="font-medium">{item.departmentName ?? item.departmentId}</p>
                  <p className="text-muted-foreground">
                    {item.startAt} → {item.endAt ?? "сейчас"}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">История руководителя</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3" data-testid="employee-profile-manager-history">
              {profile.data.managerHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Связь с руководителем пока не задана.
                </p>
              ) : (
                profile.data.managerHistory.map((item, index) => (
                  <div
                    key={`${item.managerEmployeeId}:${item.startAt}:${index}`}
                    className="rounded-lg border p-3 text-sm"
                  >
                    <p className="font-medium">{item.managerName ?? item.managerEmployeeId}</p>
                    <p className="text-muted-foreground">
                      {item.startAt} → {item.endAt ?? "сейчас"}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">История должности</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3" data-testid="employee-profile-position-history">
              {profile.data.positionHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">Должность пока не задана.</p>
              ) : (
                profile.data.positionHistory.map((item, index) => (
                  <div
                    key={`${item.title}:${item.startAt}:${index}`}
                    className="rounded-lg border p-3 text-sm"
                  >
                    <p className="font-medium">{item.title}</p>
                    <p className="text-muted-foreground">
                      {item.startAt} → {item.endAt ?? "сейчас"}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {resolved.context.role === "hr_admin" ? (
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Move to department</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  action="/api/hr/org/move"
                  method="post"
                  className="grid gap-4"
                  data-testid="employee-move-form"
                >
                  <input type="hidden" name="employeeId" value={profile.data.employeeId} />
                  <input
                    type="hidden"
                    name="returnTo"
                    value={`/hr/employees/${profile.data.employeeId}`}
                  />
                  <div className="grid gap-2">
                    <Label htmlFor="move-department-id">Новое подразделение</Label>
                    <select
                      id="move-department-id"
                      name="toDepartmentId"
                      defaultValue={profile.data.currentDepartmentId ?? ""}
                      className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                      data-testid="employee-move-department"
                    >
                      {departments.data.items.map((department) => (
                        <option key={department.departmentId} value={department.departmentId}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button type="submit" data-testid="employee-move-submit">
                    Переместить
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Set manager</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  action="/api/hr/org/manager"
                  method="post"
                  className="grid gap-4"
                  data-testid="employee-manager-form"
                >
                  <input type="hidden" name="employeeId" value={profile.data.employeeId} />
                  <input
                    type="hidden"
                    name="returnTo"
                    value={`/hr/employees/${profile.data.employeeId}`}
                  />
                  <div className="grid gap-2">
                    <Label htmlFor="manager-employee-id">Руководитель</Label>
                    <select
                      id="manager-employee-id"
                      name="managerEmployeeId"
                      defaultValue={
                        profile.data.currentManagerEmployeeId ?? managerOptions[0]?.employeeId ?? ""
                      }
                      className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                      data-testid="employee-manager-select"
                    >
                      {managerOptions.map((manager) => (
                        <option key={manager.employeeId} value={manager.employeeId}>
                          {getEmployeeDisplayName(manager)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button type="submit" data-testid="employee-manager-submit">
                    Назначить руководителя
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </InternalAppShell>
  );
}
