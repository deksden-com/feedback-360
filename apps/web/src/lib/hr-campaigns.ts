import type {
  CampaignGetOutput,
  CampaignLifecycleStatus,
  CampaignListItem,
} from "@feedback-360/api-contract";

export const campaignStatusLabels: Record<CampaignLifecycleStatus, string> = {
  draft: "Черновик",
  started: "Запущена",
  ended: "Завершена",
  processing_ai: "AI обрабатывает",
  ai_failed: "AI завершился ошибкой",
  completed: "Готова",
};

export const campaignStatusOrder: CampaignLifecycleStatus[] = [
  "draft",
  "started",
  "ended",
  "processing_ai",
  "ai_failed",
  "completed",
];

export const formatCampaignDateTimeInput = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const formatCampaignDateTimeLabel = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
};

export const getCampaignStatusCount = (
  items: CampaignListItem[],
  status?: CampaignLifecycleStatus,
): number => {
  if (!status) {
    return items.length;
  }
  return items.filter((item) => item.status === status).length;
};

export const canEditCampaignDraft = (campaign: CampaignGetOutput): boolean => {
  return campaign.status === "draft";
};

export const canRetryAiForCampaign = (campaign: CampaignGetOutput): boolean => {
  return campaign.status === "ended" || campaign.status === "ai_failed";
};

export const getCampaignActionHint = (campaign: CampaignGetOutput): string => {
  if (campaign.status === "draft") {
    return "Draft можно редактировать и запускать. После запуска откроется progress и operational panel.";
  }

  if (campaign.lockedAt) {
    return "После первого draft-save в любой анкете веса и матрица фиксируются для всей кампании.";
  }

  if (campaign.status === "started") {
    return "Кампания запущена. Можно следить за прогрессом и остановить её досрочно.";
  }

  if (campaign.status === "ended") {
    return "Анкеты уже read-only. Следующий шаг — AI post-processing или просмотр итогов.";
  }

  if (campaign.status === "ai_failed") {
    return "AI завершился ошибкой. Можно повторить запуск после проверки состояния кампании.";
  }

  if (campaign.status === "processing_ai") {
    return "AI job уже обрабатывает кампанию. Повторный запуск недоступен до завершения.";
  }

  return "Кампания завершена и готова к просмотру результатов.";
};
