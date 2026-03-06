import type { DispatchOperationInput } from "@feedback-360/api-contract";
import * as db from "@feedback-360/db";

type AuditSource = "ui" | "system" | "release" | "webhook" | "cron";

export const recordAuditEvent = async (
  request: DispatchOperationInput,
  payload: {
    companyId: string;
    campaignId?: string;
    source?: AuditSource;
    eventType: string;
    objectType: string;
    objectId?: string;
    summary: string;
    metadataJson?: Record<string, unknown>;
  },
): Promise<void> => {
  if (typeof db.createAuditEvent !== "function") {
    return;
  }

  await db.createAuditEvent({
    companyId: payload.companyId,
    ...(payload.campaignId ? { campaignId: payload.campaignId } : {}),
    actorUserId: request.context?.userId,
    actorRole: request.context?.role,
    source: payload.source ?? "ui",
    eventType: payload.eventType,
    objectType: payload.objectType,
    ...(payload.objectId ? { objectId: payload.objectId } : {}),
    summary: payload.summary,
    metadataJson: payload.metadataJson,
  });
};
