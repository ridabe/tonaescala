import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { saveParticipantPushToken } from '@/lib/notifications';

export function usePushNotifications(participantId?: string, token?: string) {
  const registered = useRef(false);

  useEffect(() => {
    if (!participantId || !token || registered.current) return;

    async function register() {
      try {
        // Dynamically import to avoid crashing when native module is absent (Expo Go).
        const Notifications = await import('expo-notifications');

        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });

        const { status: existing } = await Notifications.getPermissionsAsync();
        let finalStatus = existing;

        if (existing !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') return;

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Padrão',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
          });
        }

        const { data: pushToken } = await Notifications.getExpoPushTokenAsync();
        if (!pushToken) return;

        await saveParticipantPushToken(participantId!, token!, pushToken);
        registered.current = true;
      } catch {
        // Native module unavailable (Expo Go) — push token skipped, in-app notifications still work.
      }
    }

    register();
  }, [participantId, token]);
}
