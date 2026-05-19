import { supabase } from './supabase';
import type { ConfirmationStatus } from './types';

export type AgendaItem = {
  schedule_id: string;
  event_id: string;
  event_title: string;
  event_start_date: string;
  team_name: string | null;
  role: string | null;
  start_time: string | null;
  end_time: string | null;
  notes: string | null;
  confirmation_status: ConfirmationStatus | null;
  has_conflict: boolean;
};

export async function getParticipantAgenda(
  participantId: string,
  token: string,
): Promise<AgendaItem[]> {
  const { data, error } = await supabase.rpc('get_participant_agenda', {
    p_participant_id: participantId,
    p_participant_access_token: token,
  });
  if (error) throw error;
  return (data as AgendaItem[]) ?? [];
}

export async function confirmSchedule(
  scheduleId: string,
  participantId: string,
  token: string,
  status: ConfirmationStatus,
): Promise<void> {
  const { error } = await supabase.rpc('confirm_schedule', {
    p_schedule_id: scheduleId,
    p_participant_id: participantId,
    p_participant_access_token: token,
    p_status: status,
    p_response_message: null,
  });
  if (error) throw error;
}
