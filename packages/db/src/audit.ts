import { and, asc, desc, eq } from "drizzle-orm";

import { createDb, createPool } from "./db";
import { auditEvents } from "./schema";

export type CreateAuditEventInput = {
  companyId: string;
  campaignId?: string;
  actorUserId?: string;
  actorRole?: string;
  source: "ui" | "system" | "release" | "webhook" | "cron";
  eventType: string;
  objectType: string;
  objectId?: string;
  summary: string;
  metadataJson?: Record<string, unknown>;
  createdAt?: Date;
};

export type AuditEventListInput = {
  companyId: string;
  campaignId?: string;
  actorUserId?: string;
  eventType?: string;
  source?: "ui" | "system" | "release" | "webhook" | "cron";
  limit?: number;
};

export type AuditEventListOutput = {
  items: Array<{
    auditEventId: string;
    companyId: string;
    campaignId: string | null;
    actorUserId: string | null;
    actorRole: string | null;
    source: string;
    eventType: string;
    objectType: string;
    objectId: string | null;
    summary: string;
    metadataJson: Record<string, unknown>;
    createdAt: Date;
  }>;
};

export const createAuditEvent = async (input: CreateAuditEventInput): Promise<void> => {
  const pool = createPool();
  try {
    const db = createDb(pool);
    await db.insert(auditEvents).values({
      companyId: input.companyId,
      ...(input.campaignId ? { campaignId: input.campaignId } : {}),
      ...(input.actorUserId ? { actorUserId: input.actorUserId } : {}),
      ...(input.actorRole ? { actorRole: input.actorRole } : {}),
      source: input.source,
      eventType: input.eventType,
      objectType: input.objectType,
      ...(input.objectId ? { objectId: input.objectId } : {}),
      summary: input.summary,
      metadataJson: input.metadataJson ?? {},
      createdAt: input.createdAt ?? new Date(),
    });
  } finally {
    await pool.end();
  }
};

export const listAuditEvents = async (
  input: AuditEventListInput,
): Promise<AuditEventListOutput> => {
  const pool = createPool();
  try {
    const db = createDb(pool);
    const filters = [eq(auditEvents.companyId, input.companyId)];
    if (input.campaignId) {
      filters.push(eq(auditEvents.campaignId, input.campaignId));
    }
    if (input.actorUserId) {
      filters.push(eq(auditEvents.actorUserId, input.actorUserId));
    }
    if (input.eventType) {
      filters.push(eq(auditEvents.eventType, input.eventType));
    }
    if (input.source) {
      filters.push(eq(auditEvents.source, input.source));
    }

    const rows = await db
      .select({
        auditEventId: auditEvents.id,
        companyId: auditEvents.companyId,
        campaignId: auditEvents.campaignId,
        actorUserId: auditEvents.actorUserId,
        actorRole: auditEvents.actorRole,
        source: auditEvents.source,
        eventType: auditEvents.eventType,
        objectType: auditEvents.objectType,
        objectId: auditEvents.objectId,
        summary: auditEvents.summary,
        metadataJson: auditEvents.metadataJson,
        createdAt: auditEvents.createdAt,
      })
      .from(auditEvents)
      .where(and(...filters))
      .orderBy(desc(auditEvents.createdAt), asc(auditEvents.id))
      .limit(input.limit ?? 100);

    return {
      items: rows.map((row) => ({
        ...row,
        metadataJson:
          row.metadataJson &&
          typeof row.metadataJson === "object" &&
          !Array.isArray(row.metadataJson)
            ? (row.metadataJson as Record<string, unknown>)
            : {},
      })),
    };
  } finally {
    await pool.end();
  }
};
