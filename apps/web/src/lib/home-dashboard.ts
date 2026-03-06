import type { MembershipRole } from "@feedback-360/api-contract";
import { createInprocClient } from "@feedback-360/client";

import { getRoleLabel } from "./internal-app-shell";
import type { AppOperationContext } from "./operation-context";

export type HomeDashboardCard = {
  title: string;
  value: string;
  description: string;
  href: string;
  ctaLabel: string;
  testId: string;
  ctaTestId: string;
};

export type HomeDashboardData = {
  title: string;
  subtitle: string;
  introTitle: string;
  introDescription: string;
  roleLabel: string;
  cards: HomeDashboardCard[];
  highlights: string[];
  emptyState?: {
    title: string;
    description: string;
  };
};

const getQuestionnaireSummary = async (context: AppOperationContext) => {
  const client = createInprocClient();
  const result = await client.questionnaireListAssigned({}, context);
  if (!result.ok) {
    return {
      total: 0,
      drafts: 0,
      pending: 0,
      submitted: 0,
      campaignCount: 0,
    };
  }

  const total = result.data.items.length;
  const drafts = result.data.items.filter((item) => item.status === "in_progress").length;
  const pending = result.data.items.filter((item) => item.status === "not_started").length;
  const submitted = result.data.items.filter((item) => item.status === "submitted").length;
  const campaignCount = new Set(result.data.items.map((item) => item.campaignId)).size;

  return {
    total,
    drafts,
    pending,
    submitted,
    campaignCount,
  };
};

const getEmployeeSummary = async (context: AppOperationContext) => {
  const client = createInprocClient();
  const result = await client.employeeListActive({}, context);
  if (!result.ok) {
    return {
      activeEmployees: 0,
    };
  }

  return {
    activeEmployees: result.data.items.length,
  };
};

const buildEmployeeDashboard = async (context: AppOperationContext): Promise<HomeDashboardData> => {
  const summary = await getQuestionnaireSummary(context);

  return {
    title: "Старт сотрудника",
    subtitle: "Ваши анкеты, результаты и ближайшие действия в контексте активной компании.",
    introTitle: "Что сделать дальше",
    introDescription:
      summary.total > 0
        ? "Откройте назначенные анкеты, сохраните черновик и вернитесь к результатам после завершения кампании."
        : "Сейчас активных анкет нет. Здесь же появятся новые задачи и доступ к итоговым результатам.",
    roleLabel: getRoleLabel(context.role),
    cards: [
      {
        title: "Назначенные анкеты",
        value: String(summary.total),
        description: `Не начато: ${summary.pending} · Черновики: ${summary.drafts} · Отправлено: ${summary.submitted}`,
        href: "/questionnaires",
        ctaLabel: "Открыть анкеты",
        testId: "home-card-questionnaires",
        ctaTestId: "home-cta-questionnaires",
      },
      {
        title: "Черновики",
        value: String(summary.drafts),
        description: "Вернитесь к анкетам, которые уже начаты, и завершите их до дедлайна.",
        href: "/questionnaires",
        ctaLabel: "Продолжить заполнение",
        testId: "home-card-drafts",
        ctaTestId: "home-cta-drafts",
      },
      {
        title: "Результаты",
        value: String(summary.campaignCount),
        description: "Откройте агрегированные результаты и сравните самооценку с обратной связью.",
        href: "/results",
        ctaLabel: "Открыть результаты",
        testId: "home-card-results",
        ctaTestId: "home-cta-results",
      },
    ],
    highlights: [
      "Страница остаётся в одном shell, поэтому company context не теряется между анкетами и результатами.",
      "Самооценка и внешняя обратная связь остаются разделёнными: анкеты — в работе, результаты — после кампании.",
    ],
    ...(summary.total === 0
      ? {
          emptyState: {
            title: "Пока нет активных задач",
            description:
              "Когда HR добавит вас в кампанию 360, новые анкеты появятся в разделе «Мои анкеты».",
          },
        }
      : {}),
  };
};

const buildManagerDashboard = async (context: AppOperationContext): Promise<HomeDashboardData> => {
  const summary = await getQuestionnaireSummary(context);

  return {
    title: "Старт руководителя",
    subtitle:
      "Контур руководителя: собственные анкеты, результаты команды и обзор следующего шага.",
    introTitle: "Что важно руководителю",
    introDescription:
      "Сначала закройте свои анкеты как оценивающий, затем переходите к агрегатам команды без потери anonymity правил.",
    roleLabel: getRoleLabel(context.role),
    cards: [
      {
        title: "Мои анкеты",
        value: String(summary.total),
        description: `Не начато: ${summary.pending} · Черновики: ${summary.drafts} · Отправлено: ${summary.submitted}`,
        href: "/questionnaires",
        ctaLabel: "Открыть мои анкеты",
        testId: "home-card-questionnaires",
        ctaTestId: "home-cta-questionnaires",
      },
      {
        title: "Результаты команды",
        value: "Team",
        description:
          "Откройте manager dashboard, чтобы просматривать агрегаты сотрудников по завершённым кампаниям.",
        href: "/results/team",
        ctaLabel: "Открыть команду",
        testId: "home-card-team-results",
        ctaTestId: "home-cta-team-results",
      },
      {
        title: "Мои результаты",
        value: String(summary.campaignCount),
        description:
          "Сверьте собственные результаты и разрывы между самооценкой и внешней обратной связью.",
        href: "/results",
        ctaLabel: "Открыть мои результаты",
        testId: "home-card-results",
        ctaTestId: "home-cta-results",
      },
    ],
    highlights: [
      "Team dashboard остаётся read-only и показывает только разрешённые агрегаты без raw comments.",
      "Primary CTA ведут в уже существующие рабочие маршруты, поэтому home не дублирует бизнес-логику.",
    ],
  };
};

const buildHrDashboard = async (context: AppOperationContext): Promise<HomeDashboardData> => {
  const employeeSummary = await getEmployeeSummary(context);
  const isAdmin = context.role === "hr_admin";

  return {
    title: isAdmin ? "HR workspace" : "HR reader workspace",
    subtitle:
      "Основные HR surfaces: активные сотрудники, витрина результатов и рабочее место кампаний.",
    introTitle: isAdmin ? "Контур HR-администратора" : "Контур HR-читателя",
    introDescription: isAdmin
      ? "Управляйте кампаниями 360 и быстро переходите к operational surfaces из одного home dashboard."
      : "Просматривайте результаты и состояние контура без действий, которые доступны только HR Admin.",
    roleLabel: getRoleLabel(context.role),
    cards: [
      {
        title: "Активные сотрудники",
        value: String(employeeSummary.activeEmployees),
        description: "Текущий размер HR-справочника в активной компании.",
        href: "/hr/campaigns",
        ctaLabel: isAdmin ? "Перейти к workbench" : "Открыть HR surfaces",
        testId: "home-card-active-employees",
        ctaTestId: "home-cta-active-employees",
      },
      {
        title: "HR кампании",
        value: isAdmin ? "Manage" : "View",
        description: isAdmin
          ? "Создавайте, запускайте и отслеживайте кампании 360 из HR workbench."
          : "Просматривайте состояние HR campaign surfaces в read-only режиме.",
        href: "/hr/campaigns",
        ctaLabel: "Открыть кампании",
        testId: "home-card-hr-campaigns",
        ctaTestId: "home-cta-hr-campaigns",
      },
      {
        title: "HR результаты",
        value: "360",
        description: "Откройте витрину результатов HR с доступом к полному набору агрегатов.",
        href: "/results/hr",
        ctaLabel: "Открыть результаты",
        testId: "home-card-hr-results",
        ctaTestId: "home-cta-hr-results",
      },
    ],
    highlights: [
      "Home dashboard не подменяет lifecycle кампаний: действия остаются в `/hr/campaigns` и проверяются backend-операциями.",
      "HR Reader видит тот же navigation frame, но не получает обещаний на write-actions, которых у роли нет.",
    ],
  };
};

export const loadHomeDashboard = async (
  context: AppOperationContext,
): Promise<HomeDashboardData> => {
  switch (context.role as MembershipRole) {
    case "manager":
      return buildManagerDashboard(context);
    case "hr_admin":
    case "hr_reader":
      return buildHrDashboard(context);
    default:
      return buildEmployeeDashboard(context);
  }
};
