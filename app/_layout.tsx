import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { initErrorReporting } from '@/lib/errorReporting';

SplashScreen.preventAutoHideAsync();
initErrorReporting();

export default function RootLayout() {
  const { colors } = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style="dark" backgroundColor={Colors.light.background} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="setup-organization" />
          <Stack.Screen name="enter-event" />
          <Stack.Screen name="guest-event" />
          <Stack.Screen name="scan-qr" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </GestureHandlerRootView>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
