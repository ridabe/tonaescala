import { supabase } from './supabase';

export type OrgContact = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  default_role: string | null;
  created_at: string;
};

export async function listOrgContacts(orgId: string): Promise<OrgContact[]> {
  const { data, error } = await supabase.rpc('list_org_contacts', { p_org_id: orgId });
  if (error) throw error;
  return (data as OrgContact[]) ?? [];
}

export async function searchOrgContacts(orgId: string, query: string): Promise<OrgContact[]> {
  const { data, error } = await supabase.rpc('search_org_contacts', {
    p_org_id: orgId,
    p_query: query.trim(),
  });
  if (error) throw error;
  return (data as OrgContact[]) ?? [];
}

export async function upsertOrgContact(
  orgId: string,
  contact: { name: string; email?: string; phone?: string; default_role?: string },
): Promise<string> {
  const { data, error } = await supabase.rpc('upsert_org_contact', {
    p_org_id: orgId,
    p_name: contact.name,
    p_email: contact.email ?? null,
    p_phone: contact.phone ?? null,
    p_default_role: contact.default_role ?? null,
  });
  if (error) throw error;
  return data as string;
}

export async function deleteOrgContact(contactId: string, orgId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_org_contact', {
    p_contact_id: contactId,
    p_org_id: orgId,
  });
  if (error) throw error;
}
