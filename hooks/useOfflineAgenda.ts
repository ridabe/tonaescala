import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getParticipantAgenda, type AgendaItem } from '@/lib/participants';
import { reportError } from '@/lib/errorReporting';

const CACHE_PREFIX = 'offline_agenda_v1_';

type Cache = { data: AgendaItem[]; savedAt: number };

function cacheKey(participantId: string) {
  return `${CACHE_PREFIX}${participantId}`;
}

async function readCache(participantId: string): Promise<AgendaItem[] | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(participantId));
    if (!raw) return null;
    return (JSON.parse(raw) as Cache).data;
  } catch {
    return null;
  }
}

async function writeCache(participantId: string, data: AgendaItem[]): Promise<void> {
  try {
    const payload: Cache = { data, savedAt: Date.now() };
    await AsyncStorage.setItem(cacheKey(participantId), JSON.stringify(payload));
  } catch {
    // ignore cache write failures
  }
}

type State = {
  agenda: AgendaItem[];
  loading: boolean;
  error: string | null;
  isStale: boolean;
};

export function useOfflineAgenda(participantId?: string, token?: string) {
  const [state, setState] = useState<State>({
    agenda: [],
    loading: true,
    error: null,
    isStale: false,
  });

  // Track if the component is still mounted to avoid setState after unmount
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const load = useCallback(async () => {
    if (!participantId || !token) {
      if (mounted.current) setState((s) => ({ ...s, loading: false }));
      return;
    }

    if (mounted.current) setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const fresh = await getParticipantAgenda(participantId, token);
      await writeCache(participantId, fresh);
      if (mounted.current) setState({ agenda: fresh, loading: false, error: null, isStale: false });
    } catch (err) {
      reportError(err, { context: 'useOfflineAgenda', participantId });
      const cached = await readCache(participantId);
      if (mounted.current) {
        if (cached) {
          setState({ agenda: cached, loading: false, error: null, isStale: true });
        } else {
          setState({
            agenda: [],
            loading: false,
            error: 'Sem conexão. Verifique sua internet e tente novamente.',
            isStale: false,
          });
        }
      }
    }
  }, [participantId, token]);

  useEffect(() => {
    // Seed UI from cache immediately so the list appears before the network call finishes
    if (participantId) {
      readCache(participantId).then((cached) => {
        if (cached && mounted.current) {
          setState((s) => s.agenda.length === 0 ? { ...s, agenda: cached, loading: true, isStale: true } : s);
        }
      });
    }
    load();
  }, [load, participantId]);

  return { ...state, reload: load };
}
