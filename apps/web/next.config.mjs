import { withSentryConfig } from "@sentry/nextjs";
/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;
const sentryOrg = process.env.SENTRY_ORG;
const sentryProject = process.env.SENTRY_PROJECT;

const sentryWebpackPluginOptions =
  sentryAuthToken && sentryOrg && sentryProject
    ? {
        // For all available options, see:
        // https://www.npmjs.com/package/@sentry/webpack-plugin#options
        authToken: sentryAuthToken,
        org: sentryOrg,
        project: sentryProject,

        // Only print logs for uploading source maps in CI
        silent: !process.env.CI,

        // For all available options, see:
        // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

        // Upload a larger set of source maps for prettier stack traces (increases build time)
        widenClientFileUpload: true,

        // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
        // This can increase your server load as well as your hosting bill.
        // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
        // side errors will fail.
        tunnelRoute: "/monitoring",

        webpack: {
          // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
          // See the following for more information:
          // https://docs.sentry.io/product/crons/
          // https://vercel.com/docs/cron-jobs
          automaticVercelMonitors: true,

          // Tree-shaking options for reducing bundle size
          treeshake: {
            // Automatically tree-shake Sentry logger statements to reduce bundle size
            removeDebugLogging: true,
          },
        },
      }
    : null;

export default sentryWebpackPluginOptions
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;
