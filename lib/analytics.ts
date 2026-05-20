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
}

export const analytics = { track: send };
