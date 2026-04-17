import * as Sentry from "@sentry/react";

export const initSentry = () => {
  Sentry.init({
    dsn: window.SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.browserProfilingIntegration(),
      Sentry.replayIntegration()
    ],
    tracesSampleRate: window.SENTRY_TRACE_SAMPLE_RATE,
    tracePropagationTargets: [window.SENTRY_TRACE_PROPAGATION_TARGETS],
    profilesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0
  });
  return Sentry;
};
