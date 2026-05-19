import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { initErrorReporting } from '@/lib/errorReporting';

SplashScreen.preventAutoHideAsync();
initErrorReporting();

export default function RootLayout() {
  const { scheme } = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="setup-organization" />
          <Stack.Screen name="events" />
          <Stack.Screen name="enter-event" />
          <Stack.Screen name="guest-event" />
          <Stack.Screen name="scan-qr" />
          <Stack.Screen name="schedule" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
