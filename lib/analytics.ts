import * as Sentry from '@sentry/react-native';

// Lightweight analytics wrapper. It records breadcrumbs in Sentry and logs in
// development; this can later forward to Amplitude, Mixpanel, or PostHog.

export type AnalyticsEvent =
  | 'screen_view'
  | 'event_created'
  | 'assignment_created'
  | 'assignment_joined'
  | 'assignment_accepted'
  | 'assignment_declined'
  | 'schedule_created'
  | 'participant_joined'
  | 'attendance_confirmed'
  | 'attendance_declined'
  | 'schedule_confirmed'
  | 'notification_read'
  | 'share_invite'
  | 'qr_scanned'
  | 'conflict_viewed'
  | 'error_occurred';

type Payload = Record<string, string | number | boolean | null | undefined>;

function send(name: AnalyticsEvent, payload?: Payload): void {
  if (__DEV__) {
    console.log('[Analytics]', name, payload ?? '');
  }
  try {
    Sentry.addBreadcrumb({
      category: 'analytics',
      message: name,
      level: 'info',
      data: payload,
    });
  } catch {
    // Ignore analytics failures; they should never affect product flows.
  }
}

export const analytics = { track: send };
