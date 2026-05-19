import { supabase } from './supabase';
import type { Schedule, ScheduleCreatePayload } from './types';
import { createScheduleNotification, sendExpoPush } from './notifications';

export async function fetchSchedules(eventId: string): Promise<Schedule[]> {
  const { data, error } = await supabase
    .from('schedules')
    .select(`
      *,
      participant:participants(id, name, phone),
      team:teams(id, name, type),
      confirmation:confirmations(status)
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...row,
    confirmation: Array.isArray(row.confirmation) ? row.confirmation[0] ?? null : row.confirmation,
  }));
}

export async function createSchedule(payload: ScheduleCreatePayload): Promise<Schedule> {
  const { data, error } = await supabase
    .from('schedules')
    .insert(payload)
    .select(`
      *,
      participant:participants(id, name, phone),
      team:teams(id, name, type),
      confirmation:confirmations(status)
    `)
    .single();
  if (error) throw error;

  const schedule = {
    ...data,
    confirmation: Array.isArray(data.confirmation) ? data.confirmation[0] ?? null : data.confirmation,
  };

  // Detect conflicts and notify participant asynchronously (non-blocking)
  Promise.all([
    supabase.rpc('detect_schedule_conflicts', { p_participant_id: payload.participant_id }),
    createScheduleNotification(schedule.id, 'new_schedule'),
  ]).then(([, pushTokenResult]) => {
    if (pushTokenResult && typeof pushTokenResult === 'string') {
      sendExpoPush(
        pushTokenResult,
        'Nova escala',
        `Você foi adicionado a uma escala.`,
      ).catch(() => {});
    }
  }).catch(() => {});

  return schedule;
}

export async function deleteSchedule(id: string): Promise<void> {
  const { error } = await supabase.from('schedules').delete().eq('id', id);
  if (error) throw error;
}

export async function createParticipantAsOrganizer(
  name: string,
  phone?: string,
): Promise<string> {
  const { data, error } = await supabase.rpc('create_participant_as_organizer', {
    p_name: name,
    p_phone: phone ?? null,
  });
  if (error) throw error;
  return data as string;
}
