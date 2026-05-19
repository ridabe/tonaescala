import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { getParticipantNotifications } from '@/lib/notifications';
import { useParticipant } from '@/hooks/useParticipant';

export function useUnreadCount() {
  const { session } = useParticipant();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!session) { setCount(0); return; }
    try {
      const items = await getParticipantNotifications(session.participantId, session.token);
      setCount(items.filter((n) => !n.read).length);
    } catch {
      // ignore
    }
  }, [session]);

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  return count;
}
