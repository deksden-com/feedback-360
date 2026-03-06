import {
  captureRequestException,
  createRequestTrace,
  jsonWithRequestTrace,
  logError,
} from "@/lib/observability";

export const dynamic = "force-dynamic";

class SentryExampleAPIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SentryExampleAPIError";
  }
}

export function GET(request: Request) {
  const trace = createRequestTrace(request, {
    route: "/api/sentry-example-api",
  });
  const url = new URL(request.url);
  const message =
    url.searchParams.get("message")?.trim() || "Controlled backend error for observability drill.";
  const error = new SentryExampleAPIError(message);
  const eventId = captureRequestException(trace, error, {
    controlled: true,
  });

  logError(trace, "sentry_example_api_error", error, {
    eventId,
  });

  return jsonWithRequestTrace(
    trace,
    {
      ok: false,
      error: {
        code: "controlled_backend_error",
        message,
      },
      eventId,
      requestId: trace.requestId,
    },
    { status: 500 },
  );
}
