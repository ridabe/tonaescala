import { supabase } from './supabase';
import type { Organization } from './types';

export async function fetchOrganizations(): Promise<Organization[]> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createOrganization(
  name: string,
  description?: string,
): Promise<string> {
  const { data, error } = await supabase.rpc('create_organization', {
    p_name: name,
    p_description: description ?? null,
  });
  if (error) throw error;
  return data as string;
}
