import type { MembershipRole } from "@feedback-360/api-contract";
import { createInprocClient } from "@feedback-360/client";

import type { AppOperationContext } from "@/features/identity-tenancy/lib/operation-context";
import { getRoleLabel } from "./internal-app-shell";

export type HomeDashboardMetric = {
  title: string;
  value: string;
  description: string;
  testId: string;
  tone?: "default" | "primary" | "success" | "warning";
};

export type HomeDashboardAction = {
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  testId: string;
  ctaTestId: string;
  tone?: "default" | "primary" | "success" | "warning";
};

export type HomeDashboardActivityItem = {
  title: string;
  description: string;
  tone?: "default" | "primary" | "success" | "warning";
};

export type HomeDashboardData = {
  title: string;
  subtitle: string;
  introTitle: string;
  introDescription: string;
  roleLabel: string;
  heroCta: {
    href: string;
    label: string;
    testId: string;
  };
  metrics: HomeDashboardMetric[];
  tasks: HomeDashboardAction[];
  shortcuts: HomeDashboardAction[];
  activity: HomeDashboardActivityItem[];
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

const getCampaignSummary = async (context: AppOperationContext) => {
  const client = createInprocClient();
  const result = await client.campaignList({}, context);
  if (!result.ok) {
    return {
      total: 0,
      active: 0,
      aiProcessing: 0,
      completed: 0,
    };
  }

  const total = result.data.items.length;
  const active = result.data.items.filter(
    (item) => item.status === "started" || item.status === "ended",
  ).length;
  const aiProcessing = result.data.items.filter((item) => item.status === "processing_ai").length;
  const completed = result.data.items.filter((item) => item.status === "completed").length;

  return {
    total,
    active,
    aiProcessing,
    completed,
  };
};

const getModelSummary = async (context: AppOperationContext) => {
  const client = createInprocClient();
  const result = await client.modelVersionList({}, context);
  if (!result.ok) {
    return {
      total: 0,
      draft: 0,
      published: 0,
    };
  }

  const total = result.data.items.length;
  const draft = result.data.items.filter((item) => item.status === "draft").length;
  const published = result.data.items.filter((item) => item.status === "published").length;

  return {
    total,
    draft,
    published,
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
    heroCta: {
      href: "/questionnaires",
      label: "Открыть анкеты",
      testId: "home-hero-cta",
    },
    metrics: [
      {
        title: "Назначенные анкеты",
        value: String(summary.total),
        description: `Не начато: ${summary.pending} · Черновики: ${summary.drafts} · Отправлено: ${summary.submitted}`,
        testId: "home-card-questionnaires",
        tone: "primary",
      },
      {
        title: "Черновики",
        value: String(summary.drafts),
        description: "Вернитесь к анкетам, которые уже начаты, и завершите их до дедлайна.",
        testId: "home-card-drafts",
        tone: summary.drafts > 0 ? "warning" : "default",
      },
      {
        title: "Результаты",
        value: String(summary.campaignCount),
        description: "Откройте агрегированные результаты и сравните самооценку с обратной связью.",
        testId: "home-card-results",
        tone: "success",
      },
    ],
    tasks: [
      {
        title: "Проверить назначенные анкеты",
        description:
          summary.pending > 0
            ? `У вас ${summary.pending} новых анкет, которые ещё не начаты.`
            : "Все назначенные анкеты уже открыты или отправлены.",
        href: "/questionnaires",
        ctaLabel: "Открыть анкеты",
        testId: "home-task-questionnaires",
        ctaTestId: "home-task-cta-questionnaires",
        tone: "primary",
      },
      {
        title: "Вернуться к черновикам",
        description:
          summary.drafts > 0
            ? `Есть ${summary.drafts} анкет(ы), сохранённых как черновик.`
            : "Черновиков нет — можно следить за итогами кампании.",
        href: "/questionnaires",
        ctaLabel: "Продолжить",
        testId: "home-task-drafts",
        ctaTestId: "home-task-cta-drafts",
        tone: summary.drafts > 0 ? "warning" : "default",
      },
    ],
    shortcuts: [
      {
        title: "Мои анкеты",
        description: "Список всех форм, в которых вы участвуете как оценивающий.",
        href: "/questionnaires",
        ctaLabel: "Открыть",
        testId: "home-shortcut-questionnaires",
        ctaTestId: "home-shortcut-cta-questionnaires",
      },
      {
        title: "Мои результаты",
        description: "Агрегированные результаты завершённых кампаний и gap analysis.",
        href: "/results",
        ctaLabel: "Посмотреть",
        testId: "home-shortcut-results",
        ctaTestId: "home-shortcut-cta-results",
      },
    ],
    activity: [
      {
        title: "Компания уже выбрана",
        description: "Все анкеты и результаты открываются в активном company context.",
      },
      {
        title: "Самооценка отделена от итогового результата",
        description: "Self feedback нужен для сравнения разрывов, но не влияет на общий score.",
      },
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
    heroCta: {
      href: "/results/team",
      label: "Открыть команду",
      testId: "home-hero-cta",
    },
    metrics: [
      {
        title: "Мои анкеты",
        value: String(summary.total),
        description: `Не начато: ${summary.pending} · Черновики: ${summary.drafts} · Отправлено: ${summary.submitted}`,
        testId: "home-card-questionnaires",
        tone: "primary",
      },
      {
        title: "Результаты команды",
        value: "Team",
        description:
          "Откройте manager dashboard, чтобы просматривать агрегаты сотрудников по завершённым кампаниям.",
        testId: "home-card-team-results",
        tone: "success",
      },
      {
        title: "Мои результаты",
        value: String(summary.campaignCount),
        description:
          "Сверьте собственные результаты и разрывы между самооценкой и внешней обратной связью.",
        testId: "home-card-results",
        tone: "default",
      },
    ],
    tasks: [
      {
        title: "Закрыть свои анкеты",
        description:
          summary.total > summary.submitted
            ? "Сначала отправьте формы, в которых вы выступаете оценщиком."
            : "Все ваши формы уже отправлены.",
        href: "/questionnaires",
        ctaLabel: "К анкетам",
        testId: "home-task-questionnaires",
        ctaTestId: "home-task-cta-questionnaires",
        tone: "primary",
      },
      {
        title: "Проверить результаты команды",
        description: "После завершения кампаний откройте агрегаты подчинённых в manager view.",
        href: "/results/team",
        ctaLabel: "Открыть",
        testId: "home-task-team-results",
        ctaTestId: "home-task-cta-team-results",
        tone: "success",
      },
    ],
    shortcuts: [
      {
        title: "Команда",
        description: "Manager dashboard с переключением между сотрудниками.",
        href: "/results/team",
        ctaLabel: "Открыть",
        testId: "home-shortcut-team",
        ctaTestId: "home-shortcut-cta-team",
      },
      {
        title: "Личный отчёт",
        description: "Ваш собственный 360 dashboard и разрывы между группами.",
        href: "/results",
        ctaLabel: "Посмотреть",
        testId: "home-shortcut-results",
        ctaTestId: "home-shortcut-cta-results",
      },
    ],
    activity: [
      {
        title: "Manager view остаётся безопасным",
        description: "Экран команды показывает только разрешённые агрегаты без raw comments.",
      },
      {
        title: "Questionnaire flow не дублируется на home",
        description:
          "Домашний экран ведёт в существующие рабочие маршруты, не ломая core workflow.",
      },
    ],
  };
};

const buildHrDashboard = async (context: AppOperationContext): Promise<HomeDashboardData> => {
  const employeeSummary = await getEmployeeSummary(context);
  const campaignSummary = await getCampaignSummary(context);
  const modelSummary = await getModelSummary(context);
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
    heroCta: {
      href: "/hr/campaigns",
      label: isAdmin ? "Открыть активные кампании" : "Открыть workbench",
      testId: "home-hero-cta",
    },
    metrics: [
      {
        title: "Активные сотрудники",
        value: String(employeeSummary.activeEmployees),
        description: "Текущий размер HR-справочника в активной компании.",
        testId: "home-card-active-employees",
        tone: "default",
      },
      {
        title: "Активные кампании",
        value: String(campaignSummary.active),
        description: `Всего кампаний: ${campaignSummary.total} · Завершено: ${campaignSummary.completed}`,
        testId: "home-card-hr-campaigns",
        tone: "primary",
      },
      {
        title: "AI и модели",
        value: `${campaignSummary.aiProcessing}/${modelSummary.published}`,
        description: `AI processing: ${campaignSummary.aiProcessing} · Published models: ${modelSummary.published}`,
        testId: "home-card-hr-ai-models",
        tone: campaignSummary.aiProcessing > 0 ? "warning" : "success",
      },
    ],
    tasks: [
      {
        title: "Перейти к активным кампаниям",
        description:
          campaignSummary.active > 0
            ? `Сейчас в работе ${campaignSummary.active} кампаний.`
            : "Активных кампаний нет — можно подготовить следующий цикл.",
        href: "/hr/campaigns",
        ctaLabel: isAdmin ? "Открыть кампании" : "Просмотреть",
        testId: "home-task-hr-campaigns",
        ctaTestId: "home-task-cta-hr-campaigns",
        tone: "primary",
      },
      {
        title:
          campaignSummary.aiProcessing > 0
            ? "Проверить AI-обработку"
            : "Подготовить следующую модель",
        description:
          campaignSummary.aiProcessing > 0
            ? `В AI processing находится ${campaignSummary.aiProcessing} кампаний.`
            : modelSummary.draft > 0
              ? `Есть ${modelSummary.draft} draft-моделей, готовых к публикации.`
              : "Каталог моделей можно использовать для следующего цикла оценки.",
        href: campaignSummary.aiProcessing > 0 ? "/hr/notifications" : "/hr/models",
        ctaLabel: campaignSummary.aiProcessing > 0 ? "Открыть центр" : "Открыть модели",
        testId: "home-task-hr-secondary",
        ctaTestId: "home-task-cta-hr-secondary",
        tone: campaignSummary.aiProcessing > 0 ? "warning" : "default",
      },
      {
        title: isAdmin ? "Подготовить сотрудников и оргструктуру" : "Проверить контекст компании",
        description: isAdmin
          ? "Справочник сотрудников и оргструктура — первый шаг перед новой кампанией."
          : "Вы можете просматривать сотрудников, оргструктуру и результаты в текущем company context.",
        href: "/hr/employees",
        ctaLabel: isAdmin ? "Открыть people" : "Открыть справочник",
        testId: "home-task-hr-people",
        ctaTestId: "home-task-cta-hr-people",
        tone: "default",
      },
    ],
    shortcuts: [
      {
        title: isAdmin ? "Create campaign" : "Campaign workbench",
        description: isAdmin
          ? "Создать новый цикл оценки и перейти к draft configuration."
          : "Открыть список кампаний и их текущее состояние.",
        href: "/hr/campaigns",
        ctaLabel: isAdmin ? "К кампаниям" : "Открыть",
        testId: "home-shortcut-campaigns",
        ctaTestId: "home-shortcut-cta-campaigns",
      },
      {
        title: isAdmin ? "Add employee" : "Employees",
        description: isAdmin
          ? "Добавить сотрудника и затем привязать его к оргструктуре."
          : "Просмотреть сотрудников и их текущие профили.",
        href: isAdmin ? "/hr/employees/new" : "/hr/employees",
        ctaLabel: isAdmin ? "Добавить" : "Открыть",
        testId: "home-shortcut-employees",
        ctaTestId: "home-shortcut-cta-employees",
      },
      {
        title: "View reports",
        description: "Перейти к HR workbench результатов и сравнить кампании/сотрудников.",
        href: "/results/hr",
        ctaLabel: "Открыть",
        testId: "home-shortcut-results",
        ctaTestId: "home-shortcut-cta-results",
      },
    ],
    activity: [
      {
        title: "Campaign lifecycle остаётся в workbench",
        description:
          "Домашний экран подсказывает, что делать дальше, но не переносит сюда бизнес-логику кампаний.",
      },
      {
        title: "HR Reader получает тот же контекст, но без write-actions",
        description: "UI не обещает действий, которых роль не может выполнить.",
      },
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
