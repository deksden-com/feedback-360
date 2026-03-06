import type {
  OpsAiDiagnosticsListOutput,
  OpsAuditListOutput,
  OpsHealthGetOutput,
} from "@feedback-360/api-contract";

export const formatOpsDateTime = (value: string | null | undefined): string => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Kaliningrad",
  }).format(date);
};

export const healthToneClasses: Record<OpsHealthGetOutput["checks"][number]["status"], string> = {
  healthy: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-rose-200 bg-rose-50 text-rose-900",
};

export const aiStatusLabel = (status: string): string => {
  switch (status) {
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    case "queued":
      return "Queued";
    default:
      return status;
  }
};

export const summarizeAiDiagnostics = (items: OpsAiDiagnosticsListOutput["items"]) => [
  { label: "Всего jobs", value: items.length },
  { label: "Completed", value: items.filter((item) => item.status === "completed").length },
  { label: "Failed", value: items.filter((item) => item.status === "failed").length },
  {
    label: "Duplicate webhooks",
    value: items.filter((item) => (item.receipt?.deliveryCount ?? 0) > 1).length,
  },
];

export const summarizeAuditTrail = (items: OpsAuditListOutput["items"]) => [
  { label: "Всего событий", value: items.length },
  { label: "Release", value: items.filter((item) => item.source === "release").length },
  { label: "UI", value: items.filter((item) => item.source === "ui").length },
  { label: "Webhook", value: items.filter((item) => item.source === "webhook").length },
];
