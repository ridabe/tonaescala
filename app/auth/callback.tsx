import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { createSessionFromUrl } from '@/lib/authOAuth';
import { useSession } from '@/hooks/useSession';
import { Colors } from '@/constants/Colors';

export default function AuthCallbackScreen() {
  const { session } = useSession();
  const [timedOut, setTimedOut] = useState(false);
  const url = Linking.useLinkingURL();
  const processed = useRef(false);

  // Process the auth code from the URL if present (fallback for when
  // Expo Router handles the deep link before openAuthSessionAsync can intercept it)
  useEffect(() => {
    if (!url || processed.current) return;
    if (!url.includes('code=') && !url.includes('access_token=')) return;
    processed.current = true;
    createSessionFromUrl(url)
      .then(() => router.replace('/'))
      .catch(() => router.replace('/(auth)/login'));
  }, [url]);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 15000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (session) {
      router.replace('/');
    }
  }, [session]);

  useEffect(() => {
    if (timedOut && !session) {
      router.replace('/(auth)/login');
    }
  }, [timedOut, session]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator color={Colors.brand.primary} size="large" />
    </View>
  );
}
