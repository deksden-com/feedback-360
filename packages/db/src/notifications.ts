import { createOperationError } from "@feedback-360/api-contract";
import { and, asc, count, eq, inArray, isNull, lte, ne, or, sql } from "drizzle-orm";

import { createDb, createPool } from "./db";
import {
  campaignAssignments,
  campaignParticipants,
  campaigns,
  companies,
  employees,
  notificationAttempts,
  notificationOutbox,
  notificationSettings,
  questionnaires,
} from "./schema";

export type NotificationsGenerateRemindersInput = {
  companyId: string;
  campaignId: string;
  now?: Date;
};

export type NotificationsGenerateRemindersOutput = {
  campaignId: string;
  dateBucket: string;
  candidateRecipients: number;
  generated: number;
  deduplicated: number;
};

export type NotificationsDispatchProvider = "stub" | "resend";

export type NotificationsDispatchOutboxInput = {
  companyId: string;
  campaignId?: string;
  limit?: number;
  provider?: NotificationsDispatchProvider;
  now?: Date;
};

export type NotificationsDispatchOutboxOutput = {
  provider: NotificationsDispatchProvider;
  processed: number;
  sent: number;
  failed: number;
  attemptsLogged: number;
  remainingPending: number;
};

export type NotificationReminderSettings = {
  companyId: string;
  reminderScheduledHour: number;
  quietHoursStart: number;
  quietHoursEnd: number;
  reminderWeekdays: number[];
  locale: "ru";
  updatedAt: Date;
};

export type NotificationReminderSettingsUpsertInput = {
  companyId: string;
  reminderScheduledHour: number;
  quietHoursStart: number;
  quietHoursEnd: number;
  reminderWeekdays: number[];
};

export type NotificationReminderPreviewInput = {
  companyId: string;
  campaignId?: string;
  now?: Date;
  draftSettings?: {
    reminderScheduledHour?: number;
    quietHoursStart?: number;
    quietHoursEnd?: number;
    reminderWeekdays?: number[];
  };
};

export type NotificationReminderPreviewOutput = {
  companyId: string;
  campaignId?: string;
  effectiveTimezone: string;
  companyTimezone: string;
  campaignTimezone?: string;
  reminderScheduledHour: number;
  quietHoursStart: number;
  quietHoursEnd: number;
  reminderWeekdays: number[];
  nextRunAt: Date | null;
  localDateBucket: string;
  localWeekday: number;
  localHour: number;
};

export type NotificationTemplateCatalogItem = {
  templateKey: "campaign_invite@v1" | "campaign_reminder@v1";
  locale: "ru";
  version: "v1";
  channel: "email";
  title: string;
  description: string;
  variables: string[];
};

export type NotificationTemplatePreviewOutput = NotificationTemplateCatalogItem & {
  subject: string;
  text: string;
  html: string;
};

export type NotificationDeliveryDiagnosticsInput = {
  companyId: string;
  campaignId?: string;
  status?: "pending" | "sent" | "failed" | "dead_letter" | "retry_scheduled";
  channel?: "email";
};

export type NotificationDeliveryDiagnosticsOutput = {
  items: Array<{
    outboxId: string;
    campaignId: string;
    campaignName: string;
    recipientEmployeeId: string;
    recipientLabel: string;
    toEmail: string;
    eventType: string;
    templateKey: string;
    channel: "email";
    status: string;
    attempts: number;
    nextRetryAt: Date | null;
    lastError: string | null;
    idempotencyKey: string;
    attemptsHistory: Array<{
      attemptNo: number;
      provider: string;
      status: string;
      errorMessage: string | null;
      requestedAt: Date;
    }>;
  }>;
};

const resolveDeliveryStatus = (row: {
  status: string;
  nextRetryAt: Date | null;
  attempts: number;
}): "pending" | "sent" | "failed" | "dead_letter" | "retry_scheduled" => {
  if (row.status === "pending" && row.nextRetryAt && row.attempts > 0) {
    return "retry_scheduled";
  }

  if (
    row.status === "pending" ||
    row.status === "sent" ||
    row.status === "failed" ||
    row.status === "dead_letter"
  ) {
    return row.status;
  }

  return "failed";
};

type TxLike = Pick<ReturnType<typeof createDb>, "select" | "insert">;

type OutboxStatus = "pending" | "sent" | "failed" | "dead_letter";

type EmailTemplateRender = {
  subject: string;
  html: string;
  text: string;
};

type EmailSendResult =
  | {
      ok: true;
      providerMessageId: string;
    }
  | {
      ok: false;
      errorMessage: string;
      retryable: boolean;
    };

const MAX_ATTEMPTS = 10;
const BASE_RETRY_DELAY_MS = 60_000;
const MAX_RETRY_DELAY_MS = 24 * 60 * 60 * 1000;
const QUIET_HOURS_START = 8;
const QUIET_HOURS_END = 20;
const DEFAULT_REMINDER_HOUR = 10;
const REMINDER_WEEKDAYS = [1, 3, 5] as const;
const DEFAULT_NOTIFICATION_LOCALE = "ru" as const;

type ReminderScheduleEvaluationReason =
  | "ok"
  | "outside_quiet_hours"
  | "outside_weekly_schedule"
  | "outside_scheduled_hour";

export type ReminderScheduleEvaluationOutput = {
  shouldGenerate: boolean;
  reason: ReminderScheduleEvaluationReason;
  timezone: string;
  localDateBucket: string;
  localWeekday: number;
  localHour: number;
};

const weekdayFromIntl = (value: string): number => {
  const normalized = value.slice(0, 3).toLowerCase();
  switch (normalized) {
    case "mon":
      return 1;
    case "tue":
      return 2;
    case "wed":
      return 3;
    case "thu":
      return 4;
    case "fri":
      return 5;
    case "sat":
      return 6;
    case "sun":
      return 7;
    default:
      return 0;
  }
};

const isTimeZoneValid = (value: string): boolean => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
};

const resolveReminderTimezone = (campaignTimezone: string, companyTimezone: string): string => {
  const candidateCampaign = campaignTimezone.trim();
  if (candidateCampaign.length > 0 && isTimeZoneValid(candidateCampaign)) {
    return candidateCampaign;
  }

  const candidateCompany = companyTimezone.trim();
  if (candidateCompany.length > 0 && isTimeZoneValid(candidateCompany)) {
    return candidateCompany;
  }

  return "UTC";
};

const normalizeReminderWeekdays = (value: unknown): number[] => {
  if (!Array.isArray(value)) {
    return [...REMINDER_WEEKDAYS];
  }

  const normalized = value
    .map((item) => (typeof item === "number" ? item : Number(item)))
    .filter((item) => Number.isInteger(item) && item >= 1 && item <= 7);

  return normalized.length > 0
    ? [...new Set(normalized)].sort((left, right) => left - right)
    : [...REMINDER_WEEKDAYS];
};

const normalizeHour = (value: number | undefined, fallback: number): number => {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return fallback;
  }
  return Math.min(Math.max(value, 0), 23);
};

const normalizeQuietEnd = (value: number | undefined, start: number): number => {
  const normalized = normalizeHour(value, QUIET_HOURS_END);
  return normalized > start ? normalized : Math.min(start + 1, 23);
};

const buildDefaultReminderSettings = (companyId: string): NotificationReminderSettings => ({
  companyId,
  reminderScheduledHour: DEFAULT_REMINDER_HOUR,
  quietHoursStart: QUIET_HOURS_START,
  quietHoursEnd: QUIET_HOURS_END,
  reminderWeekdays: [...REMINDER_WEEKDAYS],
  locale: DEFAULT_NOTIFICATION_LOCALE,
  updatedAt: new Date(0),
});

export const evaluateReminderSchedule = (input: {
  now: Date;
  timezone: string;
  reminderScheduledHour?: number;
  quietHoursStart?: number;
  quietHoursEnd?: number;
  reminderWeekdays?: number[];
}): ReminderScheduleEvaluationOutput => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: input.timezone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(input.now);
  const partRecord = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const localWeekday = weekdayFromIntl(partRecord.weekday ?? "");
  const localHour = Number(partRecord.hour ?? "0");
  const localDateBucket = `${partRecord.year ?? "1970"}-${partRecord.month ?? "01"}-${partRecord.day ?? "01"}`;
  const quietHoursStart = normalizeHour(input.quietHoursStart, QUIET_HOURS_START);
  const quietHoursEnd = normalizeQuietEnd(input.quietHoursEnd, quietHoursStart);
  const reminderScheduledHour = normalizeHour(input.reminderScheduledHour, DEFAULT_REMINDER_HOUR);
  const reminderWeekdays = normalizeReminderWeekdays(input.reminderWeekdays);

  if (localHour < quietHoursStart || localHour >= quietHoursEnd) {
    return {
      shouldGenerate: false,
      reason: "outside_quiet_hours",
      timezone: input.timezone,
      localDateBucket,
      localWeekday,
      localHour,
    };
  }

  if (!reminderWeekdays.includes(localWeekday)) {
    return {
      shouldGenerate: false,
      reason: "outside_weekly_schedule",
      timezone: input.timezone,
      localDateBucket,
      localWeekday,
      localHour,
    };
  }

  if (localHour !== reminderScheduledHour) {
    return {
      shouldGenerate: false,
      reason: "outside_scheduled_hour",
      timezone: input.timezone,
      localDateBucket,
      localWeekday,
      localHour,
    };
  }

  return {
    shouldGenerate: true,
    reason: "ok",
    timezone: input.timezone,
    localDateBucket,
    localWeekday,
    localHour,
  };
};

export const getNotificationReminderSettings = async (
  companyId: string,
): Promise<NotificationReminderSettings> => {
  const pool = createPool();
  try {
    const db = createDb(pool);
    const row = await db.query.notificationSettings.findFirst({
      where: eq(notificationSettings.companyId, companyId),
    });

    if (!row) {
      return buildDefaultReminderSettings(companyId);
    }

    return {
      companyId,
      reminderScheduledHour: normalizeHour(row.reminderScheduledHour, DEFAULT_REMINDER_HOUR),
      quietHoursStart: normalizeHour(row.quietHoursStart, QUIET_HOURS_START),
      quietHoursEnd: normalizeQuietEnd(row.quietHoursEnd, row.quietHoursStart),
      reminderWeekdays: normalizeReminderWeekdays(row.reminderWeekdays),
      locale: DEFAULT_NOTIFICATION_LOCALE,
      updatedAt: row.updatedAt,
    };
  } finally {
    await pool.end();
  }
};

export const upsertNotificationReminderSettings = async (
  input: NotificationReminderSettingsUpsertInput,
): Promise<NotificationReminderSettings> => {
  const now = new Date();
  const reminderScheduledHour = normalizeHour(input.reminderScheduledHour, DEFAULT_REMINDER_HOUR);
  const quietHoursStart = normalizeHour(input.quietHoursStart, QUIET_HOURS_START);
  const quietHoursEnd = normalizeQuietEnd(input.quietHoursEnd, quietHoursStart);
  const reminderWeekdays = normalizeReminderWeekdays(input.reminderWeekdays);

  const pool = createPool();
  try {
    const db = createDb(pool);
    await db
      .insert(notificationSettings)
      .values({
        companyId: input.companyId,
        reminderScheduledHour,
        quietHoursStart,
        quietHoursEnd,
        reminderWeekdays,
        locale: DEFAULT_NOTIFICATION_LOCALE,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: notificationSettings.companyId,
        set: {
          reminderScheduledHour,
          quietHoursStart,
          quietHoursEnd,
          reminderWeekdays,
          locale: DEFAULT_NOTIFICATION_LOCALE,
          updatedAt: now,
        },
      });

    return {
      companyId: input.companyId,
      reminderScheduledHour,
      quietHoursStart,
      quietHoursEnd,
      reminderWeekdays,
      locale: DEFAULT_NOTIFICATION_LOCALE,
      updatedAt: now,
    };
  } finally {
    await pool.end();
  }
};

const findNextReminderRun = (input: {
  now: Date;
  timezone: string;
  reminderScheduledHour: number;
  quietHoursStart: number;
  quietHoursEnd: number;
  reminderWeekdays: number[];
  campaignStartAt?: Date;
  campaignEndAt?: Date;
}): NotificationReminderPreviewOutput["nextRunAt"] => {
  const start =
    input.campaignStartAt && input.campaignStartAt > input.now ? input.campaignStartAt : input.now;
  const startMs = start.getTime();
  const endMs = input.campaignEndAt?.getTime() ?? startMs + 1000 * 60 * 60 * 24 * 30;

  for (let offset = 0; offset <= 24 * 30; offset += 1) {
    const candidate = new Date(startMs + offset * 60 * 60 * 1000);
    if (candidate.getTime() > endMs) {
      break;
    }

    const evaluation = evaluateReminderSchedule({
      now: candidate,
      timezone: input.timezone,
      reminderScheduledHour: input.reminderScheduledHour,
      quietHoursStart: input.quietHoursStart,
      quietHoursEnd: input.quietHoursEnd,
      reminderWeekdays: input.reminderWeekdays,
    });

    if (evaluation.shouldGenerate) {
      return candidate;
    }
  }

  return null;
};

export const previewNotificationReminderSchedule = async (
  input: NotificationReminderPreviewInput,
): Promise<NotificationReminderPreviewOutput> => {
  const settings = input.draftSettings
    ? {
        ...(await getNotificationReminderSettings(input.companyId)),
        ...(input.draftSettings.reminderScheduledHour !== undefined
          ? { reminderScheduledHour: input.draftSettings.reminderScheduledHour }
          : {}),
        ...(input.draftSettings.quietHoursStart !== undefined
          ? { quietHoursStart: input.draftSettings.quietHoursStart }
          : {}),
        ...(input.draftSettings.quietHoursEnd !== undefined
          ? { quietHoursEnd: input.draftSettings.quietHoursEnd }
          : {}),
        ...(input.draftSettings.reminderWeekdays !== undefined
          ? { reminderWeekdays: input.draftSettings.reminderWeekdays }
          : {}),
      }
    : await getNotificationReminderSettings(input.companyId);

  const now = input.now ?? new Date();
  const pool = createPool();
  try {
    const db = createDb(pool);
    const company = await db.query.companies.findFirst({
      where: eq(companies.id, input.companyId),
    });
    if (!company) {
      throw createOperationError("not_found", "Company not found.");
    }

    const campaign = input.campaignId
      ? await db.query.campaigns.findFirst({
          where: and(eq(campaigns.companyId, input.companyId), eq(campaigns.id, input.campaignId)),
        })
      : null;
    if (input.campaignId && !campaign) {
      throw createOperationError("not_found", "Campaign not found.");
    }

    const effectiveTimezone = resolveReminderTimezone(
      campaign?.timezone ?? company.timezone,
      company.timezone,
    );
    const currentEvaluation = evaluateReminderSchedule({
      now,
      timezone: effectiveTimezone,
      reminderScheduledHour: settings.reminderScheduledHour,
      quietHoursStart: settings.quietHoursStart,
      quietHoursEnd: settings.quietHoursEnd,
      reminderWeekdays: settings.reminderWeekdays,
    });
    const nextRunAt = findNextReminderRun({
      now,
      timezone: effectiveTimezone,
      reminderScheduledHour: settings.reminderScheduledHour,
      quietHoursStart: settings.quietHoursStart,
      quietHoursEnd: settings.quietHoursEnd,
      reminderWeekdays: settings.reminderWeekdays,
      ...(campaign ? { campaignStartAt: campaign.startAt, campaignEndAt: campaign.endAt } : {}),
    });

    return {
      companyId: input.companyId,
      ...(campaign ? { campaignId: campaign.id, campaignTimezone: campaign.timezone } : {}),
      companyTimezone: company.timezone,
      effectiveTimezone,
      reminderScheduledHour: settings.reminderScheduledHour,
      quietHoursStart: settings.quietHoursStart,
      quietHoursEnd: settings.quietHoursEnd,
      reminderWeekdays: settings.reminderWeekdays,
      nextRunAt,
      localDateBucket: currentEvaluation.localDateBucket,
      localWeekday: currentEvaluation.localWeekday,
      localHour: currentEvaluation.localHour,
    };
  } finally {
    await pool.end();
  }
};

const notificationTemplateCatalog: NotificationTemplateCatalogItem[] = [
  {
    templateKey: "campaign_invite@v1",
    locale: "ru",
    version: "v1",
    channel: "email",
    title: "Приглашение в кампанию",
    description: "Первое письмо при старте кампании и включении сотрудника в процесс оценки.",
    variables: ["campaignName", "recipientEmployeeId", "invitedAt"],
  },
  {
    templateKey: "campaign_reminder@v1",
    locale: "ru",
    version: "v1",
    channel: "email",
    title: "Напоминание о незавершённых анкетах",
    description:
      "Повторное уведомление по расписанию, если у сотрудника остались не-submitted анкеты.",
    variables: ["campaignName", "recipientEmployeeId", "pendingCount", "dateBucket", "timezone"],
  },
];

export const listNotificationTemplateCatalog = async (): Promise<
  NotificationTemplateCatalogItem[]
> => {
  return notificationTemplateCatalog;
};

export const previewNotificationTemplate = async (input: {
  templateKey: NotificationTemplateCatalogItem["templateKey"];
  campaignId?: string;
  companyId: string;
}): Promise<NotificationTemplatePreviewOutput> => {
  const templateMeta = notificationTemplateCatalog.find(
    (item) => item.templateKey === input.templateKey,
  );
  if (!templateMeta) {
    throw createOperationError("not_found", "Template not found.");
  }

  const pool = createPool();
  try {
    const db = createDb(pool);
    const campaign = input.campaignId
      ? await db.query.campaigns.findFirst({
          where: and(eq(campaigns.companyId, input.companyId), eq(campaigns.id, input.campaignId)),
        })
      : null;

    const payload =
      input.templateKey === "campaign_invite@v1"
        ? {
            campaignName: campaign?.name ?? "Q1 Campaign",
            recipientEmployeeId: "employee-preview",
            invitedAt: new Date("2026-03-06T10:00:00.000Z").toISOString(),
          }
        : {
            campaignName: campaign?.name ?? "Q1 Campaign",
            recipientEmployeeId: "employee-preview",
            pendingCount: 3,
            dateBucket: "2026-03-06",
            timezone: campaign?.timezone ?? "Europe/Kaliningrad",
          };
    const rendered = renderTemplate({
      templateKey: input.templateKey,
      payload,
    });

    return {
      ...templateMeta,
      ...rendered,
    };
  } finally {
    await pool.end();
  }
};

export const listNotificationDeliveryDiagnostics = async (
  input: NotificationDeliveryDiagnosticsInput,
): Promise<NotificationDeliveryDiagnosticsOutput> => {
  const pool = createPool();
  try {
    const db = createDb(pool);
    const rows = await db
      .select({
        outboxId: notificationOutbox.id,
        campaignId: notificationOutbox.campaignId,
        campaignName: campaigns.name,
        recipientEmployeeId: notificationOutbox.recipientEmployeeId,
        recipientFirstName: employees.firstName,
        recipientLastName: employees.lastName,
        toEmail: notificationOutbox.toEmail,
        eventType: notificationOutbox.eventType,
        templateKey: notificationOutbox.templateKey,
        channel: notificationOutbox.channel,
        status: notificationOutbox.status,
        attempts: notificationOutbox.attempts,
        nextRetryAt: notificationOutbox.nextRetryAt,
        lastError: notificationOutbox.lastError,
        idempotencyKey: notificationOutbox.idempotencyKey,
      })
      .from(notificationOutbox)
      .innerJoin(campaigns, eq(campaigns.id, notificationOutbox.campaignId))
      .innerJoin(employees, eq(employees.id, notificationOutbox.recipientEmployeeId))
      .where(
        and(
          eq(notificationOutbox.companyId, input.companyId),
          input.campaignId ? eq(notificationOutbox.campaignId, input.campaignId) : undefined,
          input.channel ? eq(notificationOutbox.channel, input.channel) : undefined,
        ),
      )
      .orderBy(asc(notificationOutbox.createdAt));

    const filteredRows = input.status
      ? rows.filter((row) => resolveDeliveryStatus(row) === input.status)
      : rows;

    const outboxIds = filteredRows.map((row) => row.outboxId);
    const attempts =
      outboxIds.length === 0
        ? []
        : await db
            .select({
              outboxId: notificationAttempts.outboxId,
              attemptNo: notificationAttempts.attemptNo,
              provider: notificationAttempts.provider,
              status: notificationAttempts.status,
              errorMessage: notificationAttempts.errorMessage,
              requestedAt: notificationAttempts.requestedAt,
            })
            .from(notificationAttempts)
            .where(inArray(notificationAttempts.outboxId, outboxIds))
            .orderBy(asc(notificationAttempts.outboxId), asc(notificationAttempts.attemptNo));

    return {
      items: filteredRows.map((row) => ({
        outboxId: row.outboxId,
        campaignId: row.campaignId,
        campaignName: row.campaignName,
        recipientEmployeeId: row.recipientEmployeeId,
        recipientLabel:
          [row.recipientFirstName, row.recipientLastName].filter(Boolean).join(" ") || row.toEmail,
        toEmail: row.toEmail,
        eventType: row.eventType,
        templateKey: row.templateKey,
        channel: "email",
        status: resolveDeliveryStatus(row),
        attempts: row.attempts,
        nextRetryAt: row.nextRetryAt,
        lastError: row.lastError,
        idempotencyKey: row.idempotencyKey,
        attemptsHistory: attempts
          .filter((attempt) => attempt.outboxId === row.outboxId)
          .map((attempt) => ({
            attemptNo: attempt.attemptNo,
            provider: attempt.provider,
            status: attempt.status,
            errorMessage: attempt.errorMessage,
            requestedAt: attempt.requestedAt,
          })),
      })),
    };
  } finally {
    await pool.end();
  }
};

export const enqueueCampaignInvitesOnStartInDb = async (
  tx: TxLike,
  input: {
    companyId: string;
    campaignId: string;
    campaignName: string;
    now: Date;
  },
): Promise<{
  candidateRecipients: number;
  generated: number;
  deduplicated: number;
}> => {
  const participantRows = await tx
    .select({
      employeeId: campaignParticipants.employeeId,
    })
    .from(campaignParticipants)
    .where(
      and(
        eq(campaignParticipants.companyId, input.companyId),
        eq(campaignParticipants.campaignId, input.campaignId),
      ),
    );

  const assignmentRows = await tx
    .select({
      raterEmployeeId: campaignAssignments.raterEmployeeId,
      subjectEmployeeId: campaignAssignments.subjectEmployeeId,
    })
    .from(campaignAssignments)
    .where(
      and(
        eq(campaignAssignments.companyId, input.companyId),
        eq(campaignAssignments.campaignId, input.campaignId),
      ),
    );

  const recipientEmployeeIds = new Set<string>();
  for (const row of participantRows) {
    recipientEmployeeIds.add(row.employeeId);
  }
  for (const row of assignmentRows) {
    recipientEmployeeIds.add(row.raterEmployeeId);
    recipientEmployeeIds.add(row.subjectEmployeeId);
  }

  if (recipientEmployeeIds.size === 0) {
    return {
      candidateRecipients: 0,
      generated: 0,
      deduplicated: 0,
    };
  }

  const recipientRows = await tx
    .select({
      employeeId: employees.id,
      toEmail: employees.email,
    })
    .from(employees)
    .where(
      and(
        eq(employees.companyId, input.companyId),
        eq(employees.isActive, true),
        inArray(employees.id, [...recipientEmployeeIds]),
      ),
    );

  let generated = 0;
  let deduplicated = 0;
  for (const recipient of recipientRows) {
    const idempotencyKey = buildInviteIdempotencyKey(input.campaignId, recipient.employeeId);
    const inserted = await tx
      .insert(notificationOutbox)
      .values({
        companyId: input.companyId,
        campaignId: input.campaignId,
        recipientEmployeeId: recipient.employeeId,
        channel: "email",
        eventType: "campaign_invite",
        templateKey: "campaign_invite@v1",
        locale: "ru",
        toEmail: recipient.toEmail,
        payloadJson: {
          campaignId: input.campaignId,
          campaignName: input.campaignName,
          recipientEmployeeId: recipient.employeeId,
          invitedAt: input.now.toISOString(),
        },
        status: "pending",
        idempotencyKey,
        attempts: 0,
        nextRetryAt: null,
        createdAt: input.now,
        updatedAt: input.now,
      })
      .onConflictDoNothing()
      .returning({
        id: notificationOutbox.id,
      });

    if (inserted.length > 0) {
      generated += 1;
    } else {
      deduplicated += 1;
    }
  }

  return {
    candidateRecipients: recipientRows.length,
    generated,
    deduplicated,
  };
};

const buildReminderIdempotencyKey = (
  campaignId: string,
  recipientEmployeeId: string,
  dateBucket: string,
): string =>
  `campaign:${campaignId}:event:campaign_reminder:employee:${recipientEmployeeId}:day:${dateBucket}`;

const buildInviteIdempotencyKey = (campaignId: string, recipientEmployeeId: string): string =>
  `campaign:${campaignId}:event:campaign_invite:employee:${recipientEmployeeId}`;

const parsePayload = (value: unknown): Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
};

const asPositiveInteger = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed >= 0) {
      return parsed;
    }
  }
  return fallback;
};

const asBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") {
      return true;
    }
    if (normalized === "false") {
      return false;
    }
  }
  return fallback;
};

const buildRetryDelayMs = (attemptNo: number): number => {
  const exponent = Math.max(attemptNo - 1, 0);
  const delay = BASE_RETRY_DELAY_MS * 2 ** exponent;
  return Math.min(delay, MAX_RETRY_DELAY_MS);
};

const buildNextRetryAt = (now: Date, attemptNo: number): Date => {
  return new Date(now.getTime() + buildRetryDelayMs(attemptNo));
};

const renderTemplate = (input: {
  templateKey: string;
  payload: Record<string, unknown>;
}): EmailTemplateRender => {
  if (input.templateKey === "campaign_reminder@v1") {
    const campaignName =
      typeof input.payload.campaignName === "string" && input.payload.campaignName.length > 0
        ? input.payload.campaignName
        : "Кампания 360";
    const pendingCount = asPositiveInteger(input.payload.pendingCount, 0);
    const subject = `Напоминание: ${campaignName}`;
    const text = `У вас ${pendingCount} незавершённых анкет(ы) в кампании «${campaignName}».`;
    const html = `<p>${text}</p>`;
    return { subject, text, html };
  }

  if (input.templateKey === "campaign_invite@v1") {
    const campaignName =
      typeof input.payload.campaignName === "string" && input.payload.campaignName.length > 0
        ? input.payload.campaignName
        : "Кампания 360";
    const subject = `Приглашение в ${campaignName}`;
    const text = `Вы приглашены в «${campaignName}».`;
    const html = `<p>${text}</p>`;
    return { subject, text, html };
  }

  throw createOperationError("invalid_input", "Unsupported notification template key.", {
    templateKey: input.templateKey,
  });
};

const sendByProvider = async (input: {
  provider: NotificationsDispatchProvider;
  toEmail: string;
  template: EmailTemplateRender;
  outboxId: string;
  attemptNo: number;
  payload: Record<string, unknown>;
}): Promise<EmailSendResult> => {
  if (input.provider === "stub") {
    const permanentFailure = asBoolean(input.payload.__stubPermanentFailure, false);
    if (permanentFailure) {
      return {
        ok: false,
        errorMessage: "Stub provider permanent failure.",
        retryable: false,
      };
    }

    const failUntilAttempt = asPositiveInteger(input.payload.__stubFailUntilAttempt, 0);
    if (input.attemptNo <= failUntilAttempt) {
      return {
        ok: false,
        errorMessage: `Stub provider transient failure at attempt ${input.attemptNo}.`,
        retryable: true,
      };
    }

    return {
      ok: true,
      providerMessageId: `stub:${input.outboxId}`,
    };
  }

  const resendApiKey =
    process.env.RESEND_API_KEY ??
    process.env.RESEND_BETA_API_KEY ??
    process.env.RESEND_PROD_API_KEY;
  if (!resendApiKey) {
    return {
      ok: false,
      errorMessage: "Resend API key is not configured.",
      retryable: false,
    };
  }

  const fromAddress = process.env.RESEND_FROM ?? "go360go <noreply@go360go.ru>";
  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [input.toEmail],
        subject: input.template.subject,
        html: input.template.html,
        text: input.template.text,
      }),
    });
  } catch (error) {
    return {
      ok: false,
      errorMessage: `Resend request failed: ${error instanceof Error ? error.message : String(error)}`,
      retryable: true,
    };
  }

  if (!response.ok) {
    const responseText = await response.text();
    const retryable = response.status >= 500 || response.status === 429;
    return {
      ok: false,
      errorMessage: `Resend send failed (${response.status}): ${responseText.slice(0, 500)}`,
      retryable,
    };
  }

  const payload = (await response.json()) as { id?: unknown };
  const providerMessageId =
    typeof payload.id === "string" ? payload.id : `resend:${input.outboxId}`;
  return {
    ok: true,
    providerMessageId,
  };
};

export const generateReminderOutbox = async (
  input: NotificationsGenerateRemindersInput,
): Promise<NotificationsGenerateRemindersOutput> => {
  const now = input.now ?? new Date();

  const pool = createPool();
  try {
    const db = createDb(pool);
    return await db.transaction(async (tx) => {
      const campaignRows = await tx
        .select({
          campaignId: campaigns.id,
          status: campaigns.status,
          name: campaigns.name,
          startAt: campaigns.startAt,
          endAt: campaigns.endAt,
          campaignTimezone: campaigns.timezone,
          companyTimezone: companies.timezone,
        })
        .from(campaigns)
        .innerJoin(companies, eq(companies.id, campaigns.companyId))
        .where(and(eq(campaigns.id, input.campaignId), eq(campaigns.companyId, input.companyId)))
        .limit(1);

      const campaign = campaignRows[0];
      if (!campaign) {
        throw createOperationError("not_found", "Campaign not found in active company.", {
          campaignId: input.campaignId,
          companyId: input.companyId,
        });
      }

      if (campaign.status !== "started") {
        throw createOperationError(
          "invalid_transition",
          "Reminders can be generated only for started campaign.",
          {
            campaignId: input.campaignId,
            status: campaign.status,
          },
        );
      }

      const storedSettings = await tx.query.notificationSettings.findFirst({
        where: eq(notificationSettings.companyId, input.companyId),
      });
      const effectiveSettings = storedSettings
        ? {
            reminderScheduledHour: normalizeHour(
              storedSettings.reminderScheduledHour,
              DEFAULT_REMINDER_HOUR,
            ),
            quietHoursStart: normalizeHour(storedSettings.quietHoursStart, QUIET_HOURS_START),
            quietHoursEnd: normalizeQuietEnd(
              storedSettings.quietHoursEnd,
              storedSettings.quietHoursStart,
            ),
            reminderWeekdays: normalizeReminderWeekdays(storedSettings.reminderWeekdays),
          }
        : buildDefaultReminderSettings(input.companyId);

      const resolvedTimezone = resolveReminderTimezone(
        campaign.campaignTimezone,
        campaign.companyTimezone,
      );
      const scheduleEvaluation = evaluateReminderSchedule({
        now,
        timezone: resolvedTimezone,
        reminderScheduledHour: effectiveSettings.reminderScheduledHour,
        quietHoursStart: effectiveSettings.quietHoursStart,
        quietHoursEnd: effectiveSettings.quietHoursEnd,
        reminderWeekdays: effectiveSettings.reminderWeekdays,
      });
      const dateBucket = scheduleEvaluation.localDateBucket;

      if (now < campaign.startAt || now > campaign.endAt || !scheduleEvaluation.shouldGenerate) {
        return {
          campaignId: input.campaignId,
          dateBucket,
          candidateRecipients: 0,
          generated: 0,
          deduplicated: 0,
        };
      }

      const pendingRows = await tx
        .select({
          recipientEmployeeId: questionnaires.raterEmployeeId,
          toEmail: employees.email,
          pendingCount: sql<number>`count(*)::int`,
        })
        .from(questionnaires)
        .innerJoin(
          employees,
          and(
            eq(employees.id, questionnaires.raterEmployeeId),
            eq(employees.companyId, questionnaires.companyId),
          ),
        )
        .where(
          and(
            eq(questionnaires.companyId, input.companyId),
            eq(questionnaires.campaignId, input.campaignId),
            ne(questionnaires.status, "submitted"),
            eq(employees.isActive, true),
          ),
        )
        .groupBy(questionnaires.raterEmployeeId, employees.email);

      let generated = 0;
      let deduplicated = 0;

      for (const row of pendingRows) {
        const idempotencyKey = buildReminderIdempotencyKey(
          input.campaignId,
          row.recipientEmployeeId,
          dateBucket,
        );

        const inserted = await tx
          .insert(notificationOutbox)
          .values({
            companyId: input.companyId,
            campaignId: input.campaignId,
            recipientEmployeeId: row.recipientEmployeeId,
            channel: "email",
            eventType: "campaign_reminder",
            templateKey: "campaign_reminder@v1",
            locale: "ru",
            toEmail: row.toEmail,
            payloadJson: {
              campaignId: input.campaignId,
              campaignName: campaign.name,
              recipientEmployeeId: row.recipientEmployeeId,
              pendingCount: asPositiveInteger(row.pendingCount, 0),
              dateBucket,
              timezone: resolvedTimezone,
            },
            status: "pending",
            idempotencyKey,
            attempts: 0,
            nextRetryAt: null,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoNothing()
          .returning({
            id: notificationOutbox.id,
          });

        if (inserted.length > 0) {
          generated += 1;
        } else {
          deduplicated += 1;
        }
      }

      return {
        campaignId: input.campaignId,
        dateBucket,
        candidateRecipients: pendingRows.length,
        generated,
        deduplicated,
      };
    });
  } finally {
    await pool.end();
  }
};

export const dispatchNotificationOutbox = async (
  input: NotificationsDispatchOutboxInput,
): Promise<NotificationsDispatchOutboxOutput> => {
  const now = input.now ?? new Date();
  const provider = input.provider ?? "stub";
  const limit = input.limit ?? 100;

  const pool = createPool();
  try {
    const db = createDb(pool);
    return await db.transaction(async (tx) => {
      const queue = await tx
        .select({
          outboxId: notificationOutbox.id,
          campaignId: notificationOutbox.campaignId,
          recipientEmployeeId: notificationOutbox.recipientEmployeeId,
          toEmail: notificationOutbox.toEmail,
          templateKey: notificationOutbox.templateKey,
          payloadJson: notificationOutbox.payloadJson,
          status: notificationOutbox.status,
          attempts: notificationOutbox.attempts,
          nextRetryAt: notificationOutbox.nextRetryAt,
        })
        .from(notificationOutbox)
        .where(
          and(
            eq(notificationOutbox.companyId, input.companyId),
            or(
              and(
                eq(notificationOutbox.status, "pending"),
                or(
                  isNull(notificationOutbox.nextRetryAt),
                  lte(notificationOutbox.nextRetryAt, now),
                ),
              ),
              and(
                eq(notificationOutbox.status, "failed"),
                lte(notificationOutbox.nextRetryAt, now),
              ),
            ),
            input.campaignId ? eq(notificationOutbox.campaignId, input.campaignId) : undefined,
            lte(notificationOutbox.attempts, MAX_ATTEMPTS - 1),
          ),
        )
        .orderBy(asc(notificationOutbox.createdAt))
        .limit(limit);

      let sent = 0;
      let failed = 0;
      let attemptsLogged = 0;

      for (const row of queue) {
        const attemptNo = row.attempts + 1;
        const payload = parsePayload(row.payloadJson);
        const template = renderTemplate({
          templateKey: row.templateKey,
          payload,
        });
        const sendResult = await sendByProvider({
          provider,
          toEmail: row.toEmail,
          template,
          outboxId: row.outboxId,
          attemptNo,
          payload,
        });

        if (sendResult.ok) {
          await tx
            .update(notificationOutbox)
            .set({
              status: "sent" satisfies OutboxStatus,
              attempts: attemptNo,
              lastError: null,
              nextRetryAt: null,
              sentAt: now,
              updatedAt: now,
            })
            .where(eq(notificationOutbox.id, row.outboxId));

          await tx.insert(notificationAttempts).values({
            companyId: input.companyId,
            outboxId: row.outboxId,
            attemptNo,
            provider,
            status: "sent",
            providerMessageId: sendResult.providerMessageId,
            requestedAt: now,
            createdAt: now,
          });

          sent += 1;
          attemptsLogged += 1;
          continue;
        }

        const isDeadLetter = sendResult.retryable && attemptNo >= MAX_ATTEMPTS;
        const shouldRetry = sendResult.retryable && !isDeadLetter;
        const nextRetryAt = shouldRetry ? buildNextRetryAt(now, attemptNo) : null;

        await tx
          .update(notificationOutbox)
          .set({
            status: (isDeadLetter
              ? "dead_letter"
              : shouldRetry
                ? "pending"
                : "failed") satisfies OutboxStatus,
            attempts: attemptNo,
            lastError: sendResult.errorMessage,
            nextRetryAt,
            updatedAt: now,
          })
          .where(eq(notificationOutbox.id, row.outboxId));

        await tx.insert(notificationAttempts).values({
          companyId: input.companyId,
          outboxId: row.outboxId,
          attemptNo,
          provider,
          status: isDeadLetter ? "dead_letter" : shouldRetry ? "retry_scheduled" : "failed",
          errorMessage: sendResult.errorMessage,
          requestedAt: now,
          createdAt: now,
        });

        failed += 1;
        attemptsLogged += 1;
      }

      const remainingPendingRow = await tx
        .select({
          value: count(),
        })
        .from(notificationOutbox)
        .where(
          and(
            eq(notificationOutbox.companyId, input.companyId),
            eq(notificationOutbox.status, "pending"),
            input.campaignId ? eq(notificationOutbox.campaignId, input.campaignId) : undefined,
          ),
        );

      return {
        provider,
        processed: queue.length,
        sent,
        failed,
        attemptsLogged,
        remainingPending: remainingPendingRow[0]?.value ?? 0,
      };
    });
  } finally {
    await pool.end();
  }
};

export type NotificationOutboxDebugRow = {
  outboxId: string;
  campaignId: string;
  toEmail: string;
  status: string;
  attempts: number;
  nextRetryAt: Date | null;
  lastError: string | null;
  idempotencyKey: string;
  eventType: string;
};

export type NotificationAttemptDebugRow = {
  outboxId: string;
  attemptNo: number;
  provider: string;
  status: string;
  errorMessage: string | null;
};

export const listNotificationOutboxForCampaignForDebug = async (
  campaignId: string,
): Promise<NotificationOutboxDebugRow[]> => {
  const pool = createPool();
  try {
    const db = createDb(pool);
    const rows = await db
      .select({
        outboxId: notificationOutbox.id,
        campaignId: notificationOutbox.campaignId,
        toEmail: notificationOutbox.toEmail,
        status: notificationOutbox.status,
        attempts: notificationOutbox.attempts,
        nextRetryAt: notificationOutbox.nextRetryAt,
        lastError: notificationOutbox.lastError,
        idempotencyKey: notificationOutbox.idempotencyKey,
        eventType: notificationOutbox.eventType,
      })
      .from(notificationOutbox)
      .where(eq(notificationOutbox.campaignId, campaignId))
      .orderBy(asc(notificationOutbox.createdAt));

    return rows;
  } finally {
    await pool.end();
  }
};

export const countNotificationAttemptsForCampaignForDebug = async (
  campaignId: string,
): Promise<number> => {
  const pool = createPool();
  try {
    const db = createDb(pool);
    const rows = await db
      .select({
        value: count(),
      })
      .from(notificationAttempts)
      .innerJoin(notificationOutbox, eq(notificationOutbox.id, notificationAttempts.outboxId))
      .where(eq(notificationOutbox.campaignId, campaignId));

    return rows[0]?.value ?? 0;
  } finally {
    await pool.end();
  }
};

export const listNotificationAttemptsForCampaignForDebug = async (
  campaignId: string,
): Promise<NotificationAttemptDebugRow[]> => {
  const pool = createPool();
  try {
    const db = createDb(pool);
    return await db
      .select({
        outboxId: notificationAttempts.outboxId,
        attemptNo: notificationAttempts.attemptNo,
        provider: notificationAttempts.provider,
        status: notificationAttempts.status,
        errorMessage: notificationAttempts.errorMessage,
      })
      .from(notificationAttempts)
      .innerJoin(notificationOutbox, eq(notificationOutbox.id, notificationAttempts.outboxId))
      .where(eq(notificationOutbox.campaignId, campaignId))
      .orderBy(asc(notificationAttempts.attemptNo), asc(notificationAttempts.createdAt));
  } finally {
    await pool.end();
  }
};

export const updateNotificationOutboxPayloadForDebug = async (
  outboxId: string,
  payloadJson: Record<string, unknown>,
): Promise<void> => {
  const pool = createPool();
  try {
    const db = createDb(pool);
    await db
      .update(notificationOutbox)
      .set({
        payloadJson,
        updatedAt: new Date(),
      })
      .where(eq(notificationOutbox.id, outboxId));
  } finally {
    await pool.end();
  }
};

export const setNotificationOutboxNextRetryAtForDebug = async (
  outboxId: string,
  nextRetryAt: Date | null,
): Promise<void> => {
  const pool = createPool();
  try {
    const db = createDb(pool);
    await db
      .update(notificationOutbox)
      .set({
        nextRetryAt,
        updatedAt: new Date(),
      })
      .where(eq(notificationOutbox.id, outboxId));
  } finally {
    await pool.end();
  }
};
