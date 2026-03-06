import type { MembershipRole } from "@feedback-360/api-contract";
import { createInprocClient } from "@feedback-360/client";

import type { AppOperationContext } from "@/features/identity-tenancy/lib/operation-context";

export type InternalNavItem = {
  href: string;
  label: string;
  testId: string;
};

const roleLabels: Record<MembershipRole, string> = {
  hr_admin: "HR-администратор",
  hr_reader: "HR-читатель",
  manager: "Руководитель",
  employee: "Сотрудник",
};

export const getRoleLabel = (role: MembershipRole): string => roleLabels[role] ?? role;

export const getInternalNavItems = (role: MembershipRole): InternalNavItem[] => {
  const items: InternalNavItem[] = [
    {
      href: "/",
      label: "Главная",
      testId: "nav-home",
    },
    {
      href: "/questionnaires",
      label: "Мои анкеты",
      testId: "nav-questionnaires",
    },
    {
      href: "/results",
      label: "Мои результаты",
      testId: "nav-results",
    },
  ];

  if (role === "manager") {
    items.push({
      href: "/results/team",
      label: "Результаты команды",
      testId: "nav-results-team",
    });
  }

  if (role === "hr_admin" || role === "hr_reader") {
    items.push(
      {
        href: "/hr/employees",
        label: "Сотрудники",
        testId: "nav-hr-employees",
      },
      {
        href: "/hr/org",
        label: "Оргструктура",
        testId: "nav-hr-org",
      },
      {
        href: "/hr/models",
        label: "Модели",
        testId: "nav-hr-models",
      },
      {
        href: "/results/hr",
        label: "HR результаты",
        testId: "nav-results-hr",
      },
      {
        href: "/hr/campaigns",
        label: "HR кампании",
        testId: "nav-hr-campaigns",
      },
      {
        href: "/hr/notifications",
        label: "Уведомления",
        testId: "nav-hr-notifications",
      },
    );
  }

  return items;
};

export const loadInternalShellMeta = async (
  context: AppOperationContext,
): Promise<{
  companyName: string;
  companyId: string;
  roleLabel: string;
}> => {
  const client = createInprocClient();
  const memberships = await client.membershipList(
    {},
    {
      userId: context.userId,
    },
  );

  const activeMembership = memberships.ok
    ? memberships.data.items.find((item) => item.companyId === context.companyId)
    : undefined;

  return {
    companyName: activeMembership?.companyName ?? context.companyId,
    companyId: context.companyId,
    roleLabel: getRoleLabel(context.role),
  };
};
