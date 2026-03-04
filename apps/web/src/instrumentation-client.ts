// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

function getTracesSampleRate() {
  const fallback =
    process.env.SENTRY_ENVIRONMENT === "beta" || process.env.SENTRY_ENVIRONMENT === "development"
      ? 1
      : 0.1;
  const raw = process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE;
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getDsn() {
  return process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN;
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
    return event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
