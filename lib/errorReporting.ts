import * as Sentry from '@sentry/react-native';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';

export function initErrorReporting(): void {
  if (!DSN) return;
  try {
    Sentry.init({
      dsn: DSN,
      tracesSampleRate: __DEV__ ? 0 : 0.2,
      environment: __DEV__ ? 'development' : 'production',
      enableNativeNagger: false,
    });
  } catch (e) {
    if (__DEV__) console.warn('[Sentry] init failed:', e);
  }
}

export function reportError(error: unknown, context?: Record<string, unknown>): void {
  if (__DEV__) {
    console.error('[Error]', error, context ?? '');
  }
  if (!DSN) return;
  try {
    Sentry.withScope((scope) => {
      if (context) {
        Object.entries(context).forEach(([k, v]) => scope.setExtra(k, String(v)));
      }
      Sentry.captureException(error instanceof Error ? error : new Error(String(error)));
    });
  } catch {
    // ignore reporting failures
  }
}

export function setErrorUser(id: string | null): void {
  if (!DSN) return;
  try {
    Sentry.setUser(id ? { id } : null);
  } catch {
    // ignore
  }
}
