import { useCallback, useEffect, useState } from 'react';
import { appStorage } from '@/lib/storage';

export type ParticipantSession = {
  participantId: string;
  token: string;
};

export function useParticipant() {
  const [session, setSession] = useState<ParticipantSession | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const id = await appStorage.getItem('participant_id');
    const token = await appStorage.getItem('participant_access_token');
    setSession(id && token ? { participantId: id, token } : null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const clearSession = useCallback(async () => {
    await appStorage.removeItem('participant_id');
    await appStorage.removeItem('participant_access_token');
    setSession(null);
  }, []);

  return { session, loading, clearSession, refresh: load };
}
