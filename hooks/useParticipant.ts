import { useCallback, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

export type ParticipantSession = {
  participantId: string;
  token: string;
};

export function useParticipant() {
  const [session, setSession] = useState<ParticipantSession | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const id = await SecureStore.getItemAsync('participant_id');
    const token = await SecureStore.getItemAsync('participant_access_token');
    setSession(id && token ? { participantId: id, token } : null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const clearSession = useCallback(async () => {
    await SecureStore.deleteItemAsync('participant_id');
    await SecureStore.deleteItemAsync('participant_access_token');
    setSession(null);
  }, []);

  return { session, loading, clearSession, refresh: load };
}
