import { supabase } from './supabase';

export type AppNotification = {
  id: string;
  type: 'new_schedule' | 'schedule_changed' | 'event_cancelled' | 'reminder' | 'conflict_detected';
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
};

export type AdminNotification = {
  id: string;
  event_id: string | null;
  assignment_id: string | null;
  type: 'assignment_accepted' | 'assignment_declined';
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
};

export async function getAdminNotifications(): Promise<AdminNotification[]> {
  const { data, error } = await supabase.rpc('get_admin_notifications');
  if (error) throw error;
  return (data as AdminNotification[]) ?? [];
}

export async function markAdminNotificationRead(notificationId: string): Promise<void> {
  const { error } = await supabase.rpc('mark_admin_notification_read', {
    p_notification_id: notificationId,
  });
  if (error) throw error;
}

export async function getParticipantNotifications(
  participantId: string,
  token: string,
): Promise<AppNotification[]> {
  const { data, error } = await supabase.rpc('get_participant_notifications', {
    p_participant_id: participantId,
    p_participant_access_token: token,
  });
  if (error) throw error;
  return (data as AppNotification[]) ?? [];
}

export async function markNotificationRead(
  notificationId: string,
  participantId: string,
  token: string,
): Promise<void> {
  const { error } = await supabase.rpc('mark_notification_read', {
    p_notification_id: notificationId,
    p_participant_id: participantId,
    p_participant_access_token: token,
  });
  if (error) throw error;
}

export async function saveParticipantPushToken(
  participantId: string,
  token: string,
  pushToken: string,
): Promise<void> {
  const { error } = await supabase.rpc('save_participant_push_token', {
    p_participant_id: participantId,
    p_participant_access_token: token,
    p_push_token: pushToken,
  });
  if (error) throw error;
}

export async function createScheduleNotification(
  scheduleId: string,
  type: 'new_schedule' | 'schedule_changed' = 'new_schedule',
): Promise<string | null> {
  const { data, error } = await supabase.rpc('create_schedule_notification', {
    p_schedule_id: scheduleId,
    p_type: type,
  });
  if (error) throw error;
  return (data as { push_token: string | null })?.push_token ?? null;
}

export async function sendExpoPush(
  pushToken: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: pushToken, title, body, data: data ?? {} }),
  });
}
