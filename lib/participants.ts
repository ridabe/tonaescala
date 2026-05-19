import { supabase } from './supabase';
import type { ConfirmationStatus } from './types';

export type EventDetailRow = {
  event_id: string;
  event_title: string;
  event_description: string | null;
  event_location: string | null;
  event_start_date: string;
  event_end_date: string | null;
  event_color: string;
  organization_name: string;
  attendance_status: string;
  schedule_id: string | null;
  team_name: string | null;
  role: string | null;
  start_time: string | null;
  end_time: string | null;
  notes: string | null;
  confirmation_status: string | null;
};

export type EventParticipant = {
  participant_id: string;
  participant_name: string;
  participant_phone: string | null;
  attendance_status: string;
  joined_at: string;
};

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

export async function getParticipantEventDetails(
  participantId: string,
  token: string,
  eventId: string,
): Promise<EventDetailRow[]> {
  const { data, error } = await supabase.rpc('get_participant_event_details', {
    p_participant_id: participantId,
    p_participant_access_token: token,
    p_event_id: eventId,
  });
  if (error) throw error;
  return (data as EventDetailRow[]) ?? [];
}

export async function setEventAttendance(
  participantId: string,
  token: string,
  eventId: string,
  status: 'confirmed' | 'declined',
): Promise<void> {
  const { error } = await supabase.rpc('set_event_attendance', {
    p_participant_id: participantId,
    p_participant_access_token: token,
    p_event_id: eventId,
    p_status: status,
  });
  if (error) throw error;
}

export async function getEventParticipantsForOrganizer(
  eventId: string,
): Promise<EventParticipant[]> {
  const { data, error } = await supabase.rpc('get_event_participants_for_organizer', {
    p_event_id: eventId,
  });
  if (error) throw error;
  return (data as EventParticipant[]) ?? [];
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
