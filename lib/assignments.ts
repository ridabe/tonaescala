import { supabase } from './supabase';

export type AssignmentStatus = 'pending' | 'accepted' | 'declined';

export type EventAssignment = {
  assignment_id: string;
  event_id: string;
  team_id: string | null;
  team_name: string | null;
  participant_id: string | null;
  invitee_name: string;
  invitee_email: string;
  invitee_phone: string | null;
  role: string | null;
  arrival_time: string | null;
  start_time: string | null;
  end_time: string | null;
  notes: string | null;
  viewed_at: string | null;
  response_status: AssignmentStatus;
  decline_reason: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
};

export type EventAssignmentCreatePayload = {
  eventId: string;
  teamId?: string;
  inviteeName: string;
  inviteeEmail: string;
  inviteePhone?: string;
  role?: string;
  arrivalTime?: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
};

export type GuestAssignment = {
  assignment_id: string;
  event_id: string;
  event_title: string;
  event_description: string | null;
  event_location: string | null;
  event_start_date: string;
  event_end_date: string | null;
  event_color: string;
  organization_name: string;
  team_id: string | null;
  team_name: string | null;
  invitee_name: string;
  invitee_email: string;
  role: string | null;
  arrival_time: string | null;
  start_time: string | null;
  end_time: string | null;
  notes: string | null;
  viewed_at: string | null;
  response_status: AssignmentStatus;
  decline_reason: string | null;
  responded_at: string | null;
};

export type GuestEventSummary = {
  event_id: string;
  event_title: string;
  event_location: string | null;
  event_start_date: string;
  event_end_date: string | null;
  event_color: string;
  organization_name: string;
  assignment_count: number;
  pending_count: number;
  accepted_count: number;
  declined_count: number;
  is_current_invite: boolean;
};

export type AssignmentRosterItem = {
  assignment_id: string;
  team_id: string | null;
  team_name: string | null;
  invitee_name: string;
  role: string | null;
  response_status: AssignmentStatus;
  is_current_user: boolean;
};

function isMissingRpcError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const maybe = error as { code?: string; message?: string };
  return maybe.code === '42883' || maybe.message?.includes('Could not find the function') === true;
}

export async function createEventAssignment(payload: EventAssignmentCreatePayload): Promise<string> {
  const { data, error } = await supabase.rpc('create_event_assignment', {
    p_event_id: payload.eventId,
    p_team_id: payload.teamId ?? null,
    p_invitee_name: payload.inviteeName,
    p_invitee_email: payload.inviteeEmail,
    p_invitee_phone: payload.inviteePhone ?? null,
    p_role: payload.role ?? null,
    p_arrival_time: payload.arrivalTime ?? null,
    p_start_time: payload.startTime ?? null,
    p_end_time: payload.endTime ?? null,
    p_notes: payload.notes ?? null,
  });
  if (error) throw error;
  return data as string;
}

export async function getEventAssignmentsForOrganizer(eventId: string): Promise<EventAssignment[]> {
  const { data, error } = await supabase.rpc('get_event_assignments_for_organizer', {
    p_event_id: eventId,
  });
  if (error) {
    if (isMissingRpcError(error)) return [];
    throw error;
  }
  return (data as EventAssignment[]) ?? [];
}

export async function deleteEventAssignment(assignmentId: string): Promise<void> {
  const { error } = await supabase
    .from('event_assignments')
    .delete()
    .eq('id', assignmentId);
  if (error) throw error;
}

export async function getAssignmentsByInviteEmail(
  inviteCode: string,
  email: string,
): Promise<GuestAssignment[]> {
  const { data, error } = await supabase.rpc('get_assignments_by_invite_email', {
    p_invite_code: inviteCode,
    p_email: email,
  });
  if (error) throw error;
  return (data as GuestAssignment[]) ?? [];
}

export async function getGuestEventsByInviteEmail(
  inviteCode: string,
  email: string,
): Promise<GuestEventSummary[]> {
  const { data, error } = await supabase.rpc('get_guest_events_by_invite_email', {
    p_invite_code: inviteCode,
    p_email: email,
  });
  if (error) throw error;
  return (data as GuestEventSummary[]) ?? [];
}

export async function getAssignmentsByGuestEventEmail(
  inviteCode: string,
  email: string,
  eventId?: string,
): Promise<GuestAssignment[]> {
  const { data, error } = await supabase.rpc('get_assignments_by_guest_event_email', {
    p_invite_code: inviteCode,
    p_email: email,
    p_event_id: eventId ?? null,
  });
  if (error) throw error;
  return (data as GuestAssignment[]) ?? [];
}

export async function getAssignmentRosterByInviteEmail(
  inviteCode: string,
  email: string,
): Promise<AssignmentRosterItem[]> {
  const { data, error } = await supabase.rpc('get_assignment_roster_by_invite_email', {
    p_invite_code: inviteCode,
    p_email: email,
  });
  if (error) throw error;
  return (data as AssignmentRosterItem[]) ?? [];
}

export async function getAssignmentRosterByGuestEventEmail(
  inviteCode: string,
  email: string,
  eventId: string,
): Promise<AssignmentRosterItem[]> {
  const { data, error } = await supabase.rpc('get_assignment_roster_by_guest_event_email', {
    p_invite_code: inviteCode,
    p_email: email,
    p_event_id: eventId,
  });
  if (error) throw error;
  return (data as AssignmentRosterItem[]) ?? [];
}

export async function respondEventAssignment(
  inviteCode: string,
  email: string,
  assignmentId: string,
  response: 'accepted' | 'declined',
  declineReason?: string,
): Promise<void> {
  const { error } = await supabase.rpc('respond_event_assignment', {
    p_invite_code: inviteCode,
    p_email: email,
    p_assignment_id: assignmentId,
    p_response: response,
    p_decline_reason: declineReason ?? null,
  });
  if (error) throw error;
}

export async function respondGuestEventAssignment(
  inviteCode: string,
  email: string,
  assignmentId: string,
  response: 'accepted' | 'declined',
  declineReason?: string,
): Promise<void> {
  const { error } = await supabase.rpc('respond_guest_event_assignment', {
    p_invite_code: inviteCode,
    p_email: email,
    p_assignment_id: assignmentId,
    p_response: response,
    p_decline_reason: declineReason ?? null,
  });
  if (error) throw error;
}
