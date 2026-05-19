import { Redirect, Tabs } from 'expo-router';
import { CalendarDays, CalendarPlus, Bell, CircleUserRound } from 'lucide-react-native';
import { ActivityIndicator, View } from 'react-native';
import { useSession } from '@/hooks/useSession';
import { useOrganization } from '@/hooks/useOrganization';
import { useParticipant } from '@/hooks/useParticipant';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { Colors } from '@/constants/Colors';

export default function TabsLayout() {
  const { session, loading: sessionLoading } = useSession();
  const { org, loading: orgLoading } = useOrganization();
  const { session: participantSession, loading: participantLoading } = useParticipant();
  const { colors } = useColorScheme();
  const unreadCount = useUnreadCount();

  if (sessionLoading || participantLoading || (session && orgLoading)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={Colors.brand.primary} />
      </View>
    );
  }

  // Neither an authenticated organizer nor a participant with a local session → login
  if (!session && !participantSession) return <Redirect href="/(auth)/login" />;
  // Authenticated organizer without an org → setup
  if (session && !org) return <Redirect href="/setup-organization" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.brand.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color, size }) => <CalendarDays size={size} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="eventos"
        options={{
          title: 'Eventos',
          tabBarIcon: ({ color, size }) => <CalendarPlus size={size} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="notificacoes"
        options={{
          title: 'Notificações',
          tabBarIcon: ({ color, size }) => <Bell size={size} color={color} strokeWidth={2} />,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <CircleUserRound size={size} color={color} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}
