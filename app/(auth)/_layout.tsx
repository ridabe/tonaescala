import { Redirect, Stack } from 'expo-router';
import { useSession } from '@/hooks/useSession';
import { ActivityIndicator, View } from 'react-native';
import { Colors } from '@/constants/Colors';

export default function AuthLayout() {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.brand.primary} />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(tabs)/agenda" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
    </Stack>
  );
}
