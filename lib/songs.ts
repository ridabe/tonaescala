import { supabase } from './supabase';

export type Song = {
  id: string;
  org_id: string | null;
  title: string;
  artist: string | null;
  default_key: string | null;
  male_key: string | null;
  female_key: string | null;
  lyrics: string | null;
  chords: string | null;
  links: string[];
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SongCreatePayload = {
  org_id: string;
  title: string;
  artist?: string;
  default_key?: string;
  male_key?: string;
  female_key?: string;
  lyrics?: string;
  chords?: string;
  links?: string[];
  notes?: string;
};

export type EventSong = {
  id: string;
  event_id: string;
  song_id: string;
  order_index: number;
  selected_key: string | null;
  song: Song;
};

export type GuestEventSong = {
  song_id: string;
  title: string;
  artist: string | null;
  default_key: string | null;
  selected_key: string | null;
  order_index: number;
  lyrics: string | null;
  chords: string | null;
  notes: string | null;
  links: string[];
};

export async function fetchSongs(_orgId?: string): Promise<Song[]> {
  // RLS returns system songs (org_id IS NULL) + current user's org songs automatically
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .eq('is_active', true)
    .order('title', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchSongById(id: string): Promise<Song | null> {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createSong(payload: SongCreatePayload): Promise<Song> {
  const { data, error } = await supabase
    .from('songs')
    .insert({ ...payload, links: payload.links ?? [] })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSong(
  id: string,
  payload: Partial<Omit<SongCreatePayload, 'org_id'>>,
): Promise<void> {
  const { error } = await supabase.from('songs').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deactivateSong(id: string): Promise<void> {
  const { error } = await supabase
    .from('songs')
    .update({ is_active: false })
    .eq('id', id);
  if (error) throw error;
}

export async function fetchEventSongs(eventId: string): Promise<EventSong[]> {
  const { data, error } = await supabase
    .from('event_songs')
    .select('*, song:songs(*)')
    .eq('event_id', eventId)
    .order('order_index', { ascending: true });
  if (error) throw error;
  return (data ?? []) as EventSong[];
}

export async function setEventSongs(
  eventId: string,
  songIds: string[],
): Promise<void> {
  const { error: delError } = await supabase
    .from('event_songs')
    .delete()
    .eq('event_id', eventId);
  if (delError) throw delError;
  if (songIds.length === 0) return;
  const rows = songIds.map((song_id, i) => ({
    event_id: eventId,
    song_id,
    order_index: i,
  }));
  const { error } = await supabase.from('event_songs').insert(rows);
  if (error) throw error;
}

export async function fetchEventSongsByInvite(
  inviteCode: string,
  eventId: string,
): Promise<GuestEventSong[]> {
  const { data, error } = await supabase.rpc('get_event_songs_by_invite', {
    p_invite_code: inviteCode,
    p_event_id: eventId,
  });
  if (error) throw error;
  return (data ?? []) as GuestEventSong[];
}
