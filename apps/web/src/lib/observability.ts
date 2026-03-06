import { randomUUID } from "node:crypto";

import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

type Scalar = string | number | boolean | null | undefined;

export type RequestTrace = {
  requestId: string;
  route: string;
  method: string;
  startedAt: number;
  metadata: Record<string, Scalar>;
};

const buildLogPayload = (
  level: "info" | "error",
  event: string,
  trace: RequestTrace,
  payload?: Record<string, Scalar>,
) => {
  return {
    level,
    event,
    requestId: trace.requestId,
    route: trace.route,
    method: trace.method,
    durationMs: Date.now() - trace.startedAt,
    ...trace.metadata,
    ...(payload ?? {}),
  };
};

const toErrorPayload = (error: unknown): Record<string, Scalar> => {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: error.message,
    };
  }

  return {
    errorName: "UnknownError",
    errorMessage: "Unknown error",
  };
};

export const createRequestTrace = (
  request: Request,
  params: {
    route: string;
    metadata?: Record<string, Scalar>;
  },
): RequestTrace => {
  const headerRequestId =
    request.headers.get("x-request-id") ?? request.headers.get("x-correlation-id");
  const requestId =
    typeof headerRequestId === "string" && headerRequestId.trim().length > 0
      ? headerRequestId.trim()
      : randomUUID();

  return {
    requestId,
    route: params.route,
    method: request.method.toUpperCase(),
    startedAt: Date.now(),
    metadata: params.metadata ?? {},
  };
};

export const extendRequestTrace = (
  trace: RequestTrace,
  metadata: Record<string, Scalar>,
): RequestTrace => {
  return {
    ...trace,
    metadata: {
      ...trace.metadata,
      ...metadata,
    },
  };
};

export const logInfo = (
  trace: RequestTrace,
  event: string,
  payload?: Record<string, Scalar>,
): void => {
  console.info(JSON.stringify(buildLogPayload("info", event, trace, payload)));
};

export const logError = (
  trace: RequestTrace,
  event: string,
  error: unknown,
  payload?: Record<string, Scalar>,
): void => {
  console.error(
    JSON.stringify({
      ...buildLogPayload("error", event, trace, payload),
      ...toErrorPayload(error),
    }),
  );
};

export const captureRequestException = (
  trace: RequestTrace,
  error: unknown,
  payload?: Record<string, Scalar>,
): string => {
  return Sentry.withScope((scope) => {
    scope.setTag("request_id", trace.requestId);
    scope.setTag("route", trace.route);
    scope.setTag("method", trace.method);

    for (const [key, value] of Object.entries(trace.metadata)) {
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        scope.setTag(key, String(value));
      }
    }

    scope.setContext("request_trace", {
      route: trace.route,
      method: trace.method,
      requestId: trace.requestId,
      ...trace.metadata,
      ...(payload ?? {}),
    });

    return Sentry.captureException(error);
  });
};

export const jsonWithRequestTrace = (
  trace: RequestTrace,
  body: unknown,
  init?: ResponseInit,
): NextResponse => {
  const response = NextResponse.json(body, init);
  response.headers.set("x-request-id", trace.requestId);
  response.headers.set("x-correlation-id", trace.requestId);
  return response;
};
