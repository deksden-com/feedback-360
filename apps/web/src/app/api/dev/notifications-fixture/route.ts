import { resolveAppOperationContext } from "@/lib/operation-context";
import {
  dispatchNotificationOutbox,
  generateReminderOutbox,
  listNotificationOutboxForCampaignForDebug,
  updateNotificationOutboxPayloadForDebug,
} from "@feedback-360/db";
import { NextResponse } from "next/server";

const isDevLike = process.env.APP_ENV !== "prod";

export async function POST(request: Request) {
  if (!isDevLike) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const resolved = await resolveAppOperationContext();
  if (!resolved.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: resolved.error.message,
      },
      { status: 403 },
    );
  }

  const payload = (await request.json()) as { campaignId?: unknown };
  const campaignId =
    typeof payload.campaignId === "string" && payload.campaignId.trim().length > 0
      ? payload.campaignId.trim()
      : undefined;
  if (!campaignId) {
    return NextResponse.json(
      {
        ok: false,
        error: "campaignId is required.",
      },
      { status: 400 },
    );
  }

  const generationMoments = [
    new Date("2026-01-14T08:00:00.000Z"),
    new Date("2026-01-16T08:00:00.000Z"),
    new Date("2026-01-19T08:00:00.000Z"),
  ];
  for (const moment of generationMoments) {
    await generateReminderOutbox({
      companyId: resolved.context.companyId,
      campaignId,
      now: moment,
    });
  }

  const outboxRows = await listNotificationOutboxForCampaignForDebug(campaignId);
  if (outboxRows[1]) {
    await updateNotificationOutboxPayloadForDebug(outboxRows[1].outboxId, {
      campaignId,
      __stubFailUntilAttempt: 1,
    });
  }
  if (outboxRows[2]) {
    await updateNotificationOutboxPayloadForDebug(outboxRows[2].outboxId, {
      campaignId,
      __stubPermanentFailure: true,
    });
  }

  const dispatch = await dispatchNotificationOutbox({
    companyId: resolved.context.companyId,
    campaignId,
    provider: "stub",
    now: generationMoments[generationMoments.length - 1],
  });
  const updatedOutbox = await listNotificationOutboxForCampaignForDebug(campaignId);

  return NextResponse.json({
    ok: true,
    campaignId,
    dispatch,
    outbox: updatedOutbox,
  });
}
