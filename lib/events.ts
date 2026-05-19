import { supabase } from './supabase';
import type { Event, EventCreatePayload } from './types';

export async function fetchEvents(orgId: string): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('organization_id', orgId)
    .neq('status', 'archived')
    .order('start_date', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchEventById(id: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createEvent(payload: EventCreatePayload): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .insert({ ...payload, created_by: (await supabase.auth.getUser()).data.user!.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateEvent(
  id: string,
  payload: Partial<EventCreatePayload>,
): Promise<void> {
  const { error } = await supabase.from('events').update(payload).eq('id', id);
  if (error) throw error;
}

export async function archiveEvent(id: string): Promise<void> {
  const { error } = await supabase
    .from('events')
    .update({ status: 'archived' })
    .eq('id', id);
  if (error) throw error;
}

export async function generateInvite(eventId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_event_invite', {
    p_event_id: eventId,
  });
  if (error) throw error;
  return data as string;
}
