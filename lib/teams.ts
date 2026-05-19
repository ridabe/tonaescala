import { supabase } from './supabase';
import type { Team } from './types';

export async function fetchTeams(orgId: string): Promise<Team[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('organization_id', orgId)
    .order('name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createTeam(
  orgId: string,
  name: string,
  type?: string,
): Promise<Team> {
  const { data, error } = await supabase
    .from('teams')
    .insert({ organization_id: orgId, name, type: type ?? null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTeam(id: string): Promise<void> {
  const { error } = await supabase.from('teams').delete().eq('id', id);
  if (error) throw error;
}
