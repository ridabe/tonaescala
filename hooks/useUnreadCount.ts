import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { getAdminNotifications, getParticipantNotifications } from '@/lib/notifications';
import { useParticipant } from '@/hooks/useParticipant';
import { useSession } from '@/hooks/useSession';

export function useUnreadCount() {
  const { session: organizerSession } = useSession();
  const { session } = useParticipant();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const items = organizerSession
        ? await getAdminNotifications()
        : session
          ? await getParticipantNotifications(session.participantId, session.token)
          : [];
      setCount(items.filter((n) => !n.read).length);
    } catch {
      // ignore
    }
  }, [organizerSession, session]);

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  return count;
}
