import type {
  NotificationDeliveryDiagnosticsOutput,
  NotificationReminderPreviewOutput,
} from "@feedback-360/api-contract";

export const weekdayOptions = [
  { value: 1, label: "Пн" },
  { value: 2, label: "Вт" },
  { value: 3, label: "Ср" },
  { value: 4, label: "Чт" },
  { value: 5, label: "Пт" },
  { value: 6, label: "Сб" },
  { value: 7, label: "Вс" },
] as const;

export const deliveryStatusLabels: Record<string, string> = {
  pending: "Ожидает",
  sent: "Отправлено",
  failed: "Ошибка",
  dead_letter: "Dead letter",
  retry_scheduled: "Ретрай запланирован",
};

export const formatNotificationDateTime = (value: string | null | undefined): string => {
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

export const formatWeekdaySummary = (value: number[]): string => {
  return weekdayOptions
    .filter((option) => value.includes(option.value))
    .map((option) => option.label)
    .join(", ");
};

export const describeReminderPreview = (preview: NotificationReminderPreviewOutput): string => {
  return `Следующий запуск: ${preview.nextRunAt ? formatNotificationDateTime(preview.nextRunAt) : "не найден"} · локально ${preview.localDateBucket} ${String(preview.localHour).padStart(2, "0")}:00 · TZ ${preview.effectiveTimezone}`;
};

export const summarizeDeliveryStats = (
  items: NotificationDeliveryDiagnosticsOutput["items"],
): Array<{ label: string; value: number }> => {
  return [
    { label: "Всего", value: items.length },
    { label: "Отправлено", value: items.filter((item) => item.status === "sent").length },
    {
      label: "В ретрае",
      value: items.filter((item) => item.status === "retry_scheduled").length,
    },
    {
      label: "Ошибки",
      value: items.filter((item) => item.status === "failed" || item.status === "dead_letter")
        .length,
    },
  ];
};
