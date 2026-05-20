import { Redirect, Tabs } from 'expo-router';
import { BarChart3, CalendarDays, CalendarPlus, Bell, CircleUserRound, Plus } from 'lucide-react-native';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();

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
          height: 68 + insets.bottom,
          paddingTop: 6,
          paddingBottom: 8 + insets.bottom,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
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
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="criar"
        options={{
          title: '',
          tabBarIcon: () => null,
          tabBarButton: ({ onPress, accessibilityState }) => (
            <TouchableOpacity
              onPress={onPress}
              accessibilityRole="button"
              accessibilityLabel="Criar evento"
              accessibilityState={accessibilityState}
              activeOpacity={0.85}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: -20,
              }}
            >
              <View
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 27,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: Colors.brand.accent,
                  borderWidth: 4,
                  borderColor: colors.surface,
                }}
              >
                <Plus size={26} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <Text style={{ color: Colors.brand.primary, fontSize: 11, fontWeight: '700', marginTop: 2 }}>Criar</Text>
            </TouchableOpacity>
          ),
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
