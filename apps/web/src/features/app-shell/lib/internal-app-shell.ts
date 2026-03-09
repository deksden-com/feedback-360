import type { MembershipRole } from "@feedback-360/api-contract";
import { createInprocClient } from "@feedback-360/client";

import type { AppOperationContext } from "@/features/identity-tenancy/lib/operation-context";

/**
 * Workspace shell metadata and navigation composition.
 * @docs .memory-bank/spec/ui/screens/internal-home.md
 * @see .memory-bank/spec/ui/screen-registry.md
 */
export type InternalNavItem = {
  href: string;
  label: string;
  testId: string;
};

export type InternalNavSection = {
  key: string;
  label: string;
  items: InternalNavItem[];
};

const roleLabels: Record<MembershipRole, string> = {
  hr_admin: "HR-администратор",
  hr_reader: "HR-читатель",
  manager: "Руководитель",
  employee: "Сотрудник",
};

export const getRoleLabel = (role: MembershipRole): string => roleLabels[role] ?? role;

const getShortUserId = (userId: string): string => {
  if (userId.length <= 14) {
    return userId;
  }

  return `${userId.slice(0, 8)}…${userId.slice(-4)}`;
};

const getRoleInitials = (role: MembershipRole): string => {
  if (role === "hr_admin" || role === "hr_reader") {
    return "HR";
  }

  if (role === "manager") {
    return "MN";
  }

  return "EM";
};

export const getInternalNavSections = (role: MembershipRole): InternalNavSection[] => {
  const workspace: InternalNavItem[] = [
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

  const sections: InternalNavSection[] = [
    {
      key: "workspace",
      label: "Workspace",
      items: workspace,
    },
  ];

  if (role === "manager") {
    sections.push({
      key: "team",
      label: "Команда",
      items: [
        {
          href: "/results/team",
          label: "Результаты команды",
          testId: "nav-results-team",
        },
      ],
    });
  }

  if (role === "hr_admin" || role === "hr_reader") {
    sections.push(
      {
        key: "people",
        label: "Люди и структура",
        items: [
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
        ],
      },
      {
        key: "campaigns",
        label: "Кампании и итоги",
        items: [
          {
            href: "/hr/campaigns",
            label: "HR кампании",
            testId: "nav-hr-campaigns",
          },
          {
            href: "/results/hr",
            label: "HR результаты",
            testId: "nav-results-hr",
          },
          {
            href: "/hr/notifications",
            label: "Уведомления",
            testId: "nav-hr-notifications",
          },
        ],
      },
      {
        key: "ops",
        label: "Платформа",
        items: [
          {
            href: "/ops",
            label: "Ops",
            testId: "nav-ops",
          },
        ],
      },
    );
  }

  return sections;
};

export const getInternalNavItems = (role: MembershipRole): InternalNavItem[] => {
  return getInternalNavSections(role).flatMap((section) => section.items);
};

export const loadInternalShellMeta = async (
  context: AppOperationContext,
): Promise<{
  companyName: string;
  companyId: string;
  roleLabel: string;
  accountLabel: string;
  accountMeta: string;
  accountInitials: string;
  companySummary: string;
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
    accountLabel: `Аккаунт ${getShortUserId(context.userId)}`,
    accountMeta: `User ID: ${context.userId}`,
    accountInitials: getRoleInitials(context.role),
    companySummary: `${activeMembership?.companyName ?? "Активная компания"} · ${getRoleLabel(context.role)}`,
  };
};
