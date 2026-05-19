import { useCallback, useEffect, useState } from 'react';
import { appStorage } from '@/lib/storage';

export type GuestAssignmentSession = {
  inviteCode: string;
  email: string;
};

export async function clearGuestAssignmentSession() {
  await appStorage.removeItem('assignment_invite_code');
  await appStorage.removeItem('assignment_email');
}

export function useGuestAssignmentSession() {
  const [session, setSession] = useState<GuestAssignmentSession | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const inviteCode = await appStorage.getItem('assignment_invite_code');
    const email = await appStorage.getItem('assignment_email');
    setSession(inviteCode && email ? { inviteCode, email } : null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const clearSession = useCallback(async () => {
    await clearGuestAssignmentSession();
    setSession(null);
  }, []);

  return { session, loading, clearSession, refresh: load };
}
