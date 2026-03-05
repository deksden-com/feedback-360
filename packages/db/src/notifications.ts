import { createOperationError } from "@feedback-360/api-contract";
import { and, asc, count, eq, ne, sql } from "drizzle-orm";

import { createDb, createPool } from "./db";
import {
  campaigns,
  employees,
  notificationAttempts,
  notificationOutbox,
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

type OutboxStatus = "pending" | "sent" | "failed";

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
    };

const toDateBucket = (value: Date): string => value.toISOString().slice(0, 10);

const buildReminderIdempotencyKey = (
  campaignId: string,
  recipientEmployeeId: string,
  dateBucket: string,
): string =>
  `campaign:${campaignId}:event:campaign_reminder:employee:${recipientEmployeeId}:day:${dateBucket}`;

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
}): Promise<EmailSendResult> => {
  if (input.provider === "stub") {
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
    };
  }

  const fromAddress = process.env.RESEND_FROM ?? "go360go <noreply@go360go.ru>";
  const response = await fetch("https://api.resend.com/emails", {
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

  if (!response.ok) {
    const responseText = await response.text();
    return {
      ok: false,
      errorMessage: `Resend send failed (${response.status}): ${responseText.slice(0, 500)}`,
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
  const dateBucket = toDateBucket(now);

  const pool = createPool();
  try {
    const db = createDb(pool);
    return await db.transaction(async (tx) => {
      const campaignRows = await tx
        .select({
          campaignId: campaigns.id,
          status: campaigns.status,
          name: campaigns.name,
        })
        .from(campaigns)
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
            },
            status: "pending",
            idempotencyKey,
            attempts: 0,
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
          attempts: notificationOutbox.attempts,
        })
        .from(notificationOutbox)
        .where(
          and(
            eq(notificationOutbox.companyId, input.companyId),
            eq(notificationOutbox.status, "pending"),
            input.campaignId ? eq(notificationOutbox.campaignId, input.campaignId) : undefined,
          ),
        )
        .orderBy(asc(notificationOutbox.createdAt))
        .limit(limit);

      let sent = 0;
      let failed = 0;
      let attemptsLogged = 0;

      for (const row of queue) {
        const attemptNo = row.attempts + 1;
        const template = renderTemplate({
          templateKey: row.templateKey,
          payload: parsePayload(row.payloadJson),
        });
        const sendResult = await sendByProvider({
          provider,
          toEmail: row.toEmail,
          template,
          outboxId: row.outboxId,
        });

        if (sendResult.ok) {
          await tx
            .update(notificationOutbox)
            .set({
              status: "sent" satisfies OutboxStatus,
              attempts: attemptNo,
              lastError: null,
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

        await tx
          .update(notificationOutbox)
          .set({
            status: "failed" satisfies OutboxStatus,
            attempts: attemptNo,
            lastError: sendResult.errorMessage,
            updatedAt: now,
          })
          .where(eq(notificationOutbox.id, row.outboxId));

        await tx.insert(notificationAttempts).values({
          companyId: input.companyId,
          outboxId: row.outboxId,
          attemptNo,
          provider,
          status: "failed",
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
  idempotencyKey: string;
  eventType: string;
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
