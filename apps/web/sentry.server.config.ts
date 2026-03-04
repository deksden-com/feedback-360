// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

function getTracesSampleRate() {
  const fallback =
    process.env.SENTRY_ENVIRONMENT === "beta" || process.env.SENTRY_ENVIRONMENT === "development"
      ? 1
      : 0.1;
  const raw = process.env.SENTRY_TRACES_SAMPLE_RATE;
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getDsn() {
  return process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
}

Sentry.init({
  dsn: getDsn(),
  enabled: Boolean(getDsn()),

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: getTracesSampleRate(),

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: false,

  beforeSend(event) {
    if (event.user) event.user = undefined;
    if (event.request) {
      event.request.cookies = undefined;
      event.request.data = undefined;

      const headers = event.request.headers;
      if (headers && typeof headers === "object") {
        (headers as Record<string, unknown>).authorization = undefined;
        (headers as Record<string, unknown>).cookie = undefined;
      }
    }
    return event;
  },
});
