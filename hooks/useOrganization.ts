import { useState, useEffect, useCallback } from 'react';
import { fetchOrganizations } from '@/lib/organizations';
import type { Organization } from '@/lib/types';

export function useOrganization() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const orgs = await fetchOrganizations();
      setOrg(orgs[0] ?? null);
    } catch {
      setOrg(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { org, loading, reload: load };
}
