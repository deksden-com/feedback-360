import { createHmac, timingSafeEqual } from "node:crypto";

import { createOperationError, errorFromUnknown } from "@feedback-360/api-contract";
import { applyAiWebhookResult } from "@feedback-360/db";

const TIMESTAMP_TOLERANCE_SECONDS = 5 * 60;

type ParsedAiWebhookPayload = {
  aiJobId: string;
  campaignId: string;
  status: "completed" | "failed";
  payload: Record<string, unknown>;
};

const parseAiWebhookPayload = (value: unknown): ParsedAiWebhookPayload => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw createOperationError("invalid_input", "Webhook payload must be an object.");
  }

  const payload = value as Record<string, unknown>;
  const aiJobId = payload.ai_job_id;
  const campaignId = payload.campaign_id;
  const status = payload.status;

  if (typeof aiJobId !== "string" || aiJobId.trim().length === 0) {
    throw createOperationError("invalid_input", "payload.ai_job_id must be a non-empty string.");
  }
  if (typeof campaignId !== "string" || campaignId.trim().length === 0) {
    throw createOperationError("invalid_input", "payload.campaign_id must be a non-empty string.");
  }
  if (status !== "completed" && status !== "failed") {
    throw createOperationError("invalid_input", "payload.status must be completed|failed.");
  }

  return {
    aiJobId: aiJobId.trim(),
    campaignId: campaignId.trim(),
    status,
    payload,
  };
};

const validateTimestamp = (timestampHeader: string): number => {
  const timestampSeconds = Number.parseInt(timestampHeader, 10);
  if (!Number.isFinite(timestampSeconds)) {
    throw createOperationError("webhook_timestamp_invalid", "Webhook timestamp header is invalid.");
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const delta = Math.abs(nowSeconds - timestampSeconds);
  if (delta > TIMESTAMP_TOLERANCE_SECONDS) {
    throw createOperationError(
      "webhook_timestamp_invalid",
      "Webhook timestamp is outside allowed skew window.",
    );
  }

  return timestampSeconds;
};

const validateSignature = (
  rawBody: string,
  timestampHeader: string,
  signatureHeader: string,
): void => {
  const secret = process.env.AI_WEBHOOK_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw createOperationError("invalid_input", "AI_WEBHOOK_SECRET is not configured.");
  }

  const normalized = signatureHeader.trim();
  if (!normalized.startsWith("sha256=")) {
    throw createOperationError("webhook_invalid_signature", "Signature header format is invalid.");
  }

  const signatureHex = normalized.slice("sha256=".length);
  const expectedHex = createHmac("sha256", secret)
    .update(`${timestampHeader}.${rawBody}`)
    .digest("hex");

  const actualBuffer = Buffer.from(signatureHex, "hex");
  const expectedBuffer = Buffer.from(expectedHex, "hex");

  if (actualBuffer.length !== expectedBuffer.length) {
    throw createOperationError("webhook_invalid_signature", "Webhook signature mismatch.");
  }

  if (!timingSafeEqual(actualBuffer, expectedBuffer)) {
    throw createOperationError("webhook_invalid_signature", "Webhook signature mismatch.");
  }
};

const toHttpStatus = (code: string): number => {
  switch (code) {
    case "webhook_invalid_signature":
      return 401;
    case "webhook_timestamp_invalid":
    case "invalid_input":
      return 400;
    case "not_found":
      return 404;
    default:
      return 500;
  }
};

export async function POST(request: Request) {
  try {
    const timestampHeader = request.headers.get("x-ai-timestamp");
    const signatureHeader = request.headers.get("x-ai-signature");
    const idempotencyKey = request.headers.get("x-ai-idempotency-key");

    if (!timestampHeader || !signatureHeader || !idempotencyKey) {
      throw createOperationError("invalid_input", "Required webhook headers are missing.");
    }
    if (idempotencyKey.trim().length === 0) {
      throw createOperationError("invalid_input", "x-ai-idempotency-key must be non-empty.");
    }

    validateTimestamp(timestampHeader);

    const rawBody = await request.text();
    validateSignature(rawBody, timestampHeader, signatureHeader);

    const parsedPayload = parseAiWebhookPayload(JSON.parse(rawBody) as unknown);

    const result = await applyAiWebhookResult({
      campaignId: parsedPayload.campaignId,
      aiJobId: parsedPayload.aiJobId,
      idempotencyKey: idempotencyKey.trim(),
      status: parsedPayload.status,
      payload: parsedPayload.payload,
      receivedAt: new Date(),
    });

    return Response.json(
      {
        ok: true,
        data: result,
      },
      { status: 200 },
    );
  } catch (error) {
    const opError = errorFromUnknown(error, "invalid_input", "Failed to process AI webhook.");
    return Response.json(
      {
        ok: false,
        error: opError,
      },
      { status: toHttpStatus(opError.code) },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
