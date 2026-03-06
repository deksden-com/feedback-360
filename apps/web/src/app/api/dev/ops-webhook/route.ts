import { applyAiWebhookResult } from "@feedback-360/db";
import { NextResponse } from "next/server";

const isDevLike = process.env.APP_ENV !== "prod";

export async function POST(request: Request) {
  if (!isDevLike) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const payload = (await request.json()) as {
    campaignId?: unknown;
    aiJobId?: unknown;
    idempotencyKey?: unknown;
    questionnaireId?: unknown;
    competencyId?: unknown;
  };

  const campaignId =
    typeof payload.campaignId === "string" && payload.campaignId.trim().length > 0
      ? payload.campaignId.trim()
      : undefined;
  const aiJobId =
    typeof payload.aiJobId === "string" && payload.aiJobId.trim().length > 0
      ? payload.aiJobId.trim()
      : undefined;

  if (!campaignId || !aiJobId) {
    return NextResponse.json(
      {
        ok: false,
        error: "campaignId and aiJobId are required.",
      },
      { status: 400 },
    );
  }

  const idempotencyKey =
    typeof payload.idempotencyKey === "string" && payload.idempotencyKey.trim().length > 0
      ? payload.idempotencyKey.trim()
      : `ops-webhook-${campaignId}`;
  const questionnaireId =
    typeof payload.questionnaireId === "string" && payload.questionnaireId.trim().length > 0
      ? payload.questionnaireId.trim()
      : undefined;
  const competencyId =
    typeof payload.competencyId === "string" && payload.competencyId.trim().length > 0
      ? payload.competencyId.trim()
      : undefined;

  const webhookPayload: Record<string, unknown> = {
    status: "completed",
  };

  if (questionnaireId && competencyId) {
    webhookPayload.questionnaire_comments = [
      {
        questionnaire_id: questionnaireId,
        competency_comments: {
          [competencyId]: {
            processed_text: "Processed AI summary",
            summary_text: "Summary",
          },
        },
      },
    ];
  }

  const first = await applyAiWebhookResult({
    campaignId,
    aiJobId,
    idempotencyKey,
    status: "completed",
    payload: {
      ai_job_id: aiJobId,
      campaign_id: campaignId,
      ...webhookPayload,
    },
    receivedAt: new Date("2026-03-06T07:02:00.000Z"),
  });
  const second = await applyAiWebhookResult({
    campaignId,
    aiJobId,
    idempotencyKey,
    status: "completed",
    payload: {
      ai_job_id: aiJobId,
      campaign_id: campaignId,
      ...webhookPayload,
    },
    receivedAt: new Date("2026-03-06T07:04:00.000Z"),
  });

  return NextResponse.json({
    ok: true,
    first,
    second,
  });
}
