import { createHmac } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const applyAiWebhookResultMock = vi.fn();

vi.mock("@feedback-360/db", () => {
  return {
    applyAiWebhookResult: applyAiWebhookResultMock,
  };
});

const buildSignature = (secret: string, timestamp: string, payload: string): string => {
  const digest = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  return `sha256=${digest}`;
};

describe("FT-0072 AI webhook route", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-21T10:00:00.000Z"));
    process.env.AI_WEBHOOK_SECRET = "ft0072-secret";
    applyAiWebhookResultMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env.AI_WEBHOOK_SECRET = undefined;
  });

  it("rejects invalid signature and does not apply webhook result", async () => {
    const { POST } = await import("./route");
    const payload = JSON.stringify({
      ai_job_id: "ai-job-main",
      campaign_id: "campaign-main",
      status: "completed",
    });
    const timestamp = String(Math.floor(Date.now() / 1000));

    const request = new Request("http://localhost/api/webhooks/ai", {
      method: "POST",
      headers: {
        "x-ai-timestamp": timestamp,
        "x-ai-signature": "sha256=deadbeef",
        "x-ai-idempotency-key": "idem-ft0072-1",
        "content-type": "application/json",
      },
      body: payload,
    });

    const response = await POST(request);
    const body = (await response.json()) as {
      ok: boolean;
      error?: { code: string };
    };

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
    expect(body.error?.code).toBe("webhook_invalid_signature");
    expect(applyAiWebhookResultMock).toHaveBeenCalledTimes(0);
  });

  it("accepts valid signature and returns no-op on idempotent retry", async () => {
    const { POST } = await import("./route");
    applyAiWebhookResultMock
      .mockResolvedValueOnce({
        applied: true,
        noOp: false,
        campaignStatus: "completed",
        aiJobStatus: "completed",
      })
      .mockResolvedValueOnce({
        applied: false,
        noOp: true,
        campaignStatus: "completed",
        aiJobStatus: "completed",
      });

    const payload = JSON.stringify({
      ai_job_id: "ai-job-main",
      campaign_id: "campaign-main",
      status: "completed",
      summary: "ok",
    });
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = buildSignature("ft0072-secret", timestamp, payload);

    const makeRequest = () =>
      new Request("http://localhost/api/webhooks/ai", {
        method: "POST",
        headers: {
          "x-ai-timestamp": timestamp,
          "x-ai-signature": signature,
          "x-ai-idempotency-key": "idem-ft0072-2",
          "content-type": "application/json",
        },
        body: payload,
      });

    const firstResponse = await POST(makeRequest());
    const firstBody = (await firstResponse.json()) as {
      ok: boolean;
      data?: {
        applied: boolean;
        noOp: boolean;
      };
    };

    const secondResponse = await POST(makeRequest());
    const secondBody = (await secondResponse.json()) as {
      ok: boolean;
      data?: {
        applied: boolean;
        noOp: boolean;
      };
    };

    expect(firstResponse.status).toBe(200);
    expect(firstBody.ok).toBe(true);
    expect(firstBody.data?.applied).toBe(true);
    expect(firstBody.data?.noOp).toBe(false);

    expect(secondResponse.status).toBe(200);
    expect(secondBody.ok).toBe(true);
    expect(secondBody.data?.applied).toBe(false);
    expect(secondBody.data?.noOp).toBe(true);

    expect(applyAiWebhookResultMock).toHaveBeenCalledTimes(2);
    expect(applyAiWebhookResultMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        aiJobId: "ai-job-main",
        campaignId: "campaign-main",
        idempotencyKey: "idem-ft0072-2",
        status: "completed",
      }),
    );
  });
});
