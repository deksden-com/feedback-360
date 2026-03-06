import { describe, expect, it, vi } from "vitest";

const sentryCaptureExceptionMock = vi.fn(() => "evt-ft-0102-example");
const sentryWithScopeMock = vi.fn(
  (
    callback: (scope: {
      setTag: (key: string, value: string) => void;
      setContext: (key: string, value: Record<string, unknown>) => void;
    }) => string,
  ) => {
    return callback({
      setTag: vi.fn(),
      setContext: vi.fn(),
    });
  },
);

vi.mock("@sentry/nextjs", () => {
  return {
    captureException: sentryCaptureExceptionMock,
    withScope: sentryWithScopeMock,
  };
});

describe("FT-0102 sentry example api route", () => {
  it("returns event id and request headers for controlled backend error", async () => {
    const { GET } = await import("./route");

    const response = await GET(
      new Request("http://localhost/api/sentry-example-api?message=FT-0102%20controlled", {
        headers: {
          "x-request-id": "req-ft-0102-example",
        },
      }),
    );

    const body = (await response.json()) as {
      ok: boolean;
      eventId?: string;
      requestId?: string;
      error?: {
        code?: string;
        message?: string;
      };
    };

    expect(response.status).toBe(500);
    expect(response.headers.get("x-request-id")).toBe("req-ft-0102-example");
    expect(response.headers.get("x-correlation-id")).toBe("req-ft-0102-example");
    expect(body.ok).toBe(false);
    expect(body.eventId).toBe("evt-ft-0102-example");
    expect(body.requestId).toBe("req-ft-0102-example");
    expect(body.error?.code).toBe("controlled_backend_error");
    expect(body.error?.message).toBe("FT-0102 controlled");
    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
  });
});
