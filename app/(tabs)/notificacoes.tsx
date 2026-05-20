import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  AlertTriangle,
  Bell,
  BellOff,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  XCircle,
} from 'lucide-react-native';
import {
  getAdminNotifications,
  getParticipantNotifications,
  markAdminNotificationRead,
  markNotificationRead,
  type AdminNotification,
  type AppNotification,
} from '@/lib/notifications';
import { reportError } from '@/lib/errorReporting';
import { useParticipant } from '@/hooks/useParticipant';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useSession } from '@/hooks/useSession';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, Radius } from '@/constants/Theme';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { SkeletonList } from '@/components/SkeletonBlock';
import { Card } from '@/components/Card';
import { analytics } from '@/lib/analytics';

type AnyNotification = AppNotification | AdminNotification;

const TYPE_ICON: Record<string, React.ElementType> = {
  assignment_accepted: CheckCircle2,
  assignment_declined: XCircle,
  new_schedule: CalendarPlus,
  schedule_changed: Calendar,
  event_cancelled: XCircle,
  reminder: Bell,
  conflict_detected: AlertTriangle,
};

const TYPE_COLOR: Record<string, string> = {
  assignment_accepted: Colors.status.success,
  assignment_declined: Colors.status.danger,
  new_schedule: Colors.brand.primary,
  schedule_changed: Colors.status.warning,
  event_cancelled: Colors.status.danger,
  reminder: Colors.brand.primary,
  conflict_detected: Colors.status.warning,
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min}min atras`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h atras`;
  const d = Math.floor(h / 24);
  return `${d}d atras`;
}

function isAdminNotification(item: AnyNotification): item is AdminNotification {
  return item.type === 'assignment_accepted' || item.type === 'assignment_declined';
}

export default function NotificacoesScreen() {
  const { session: organizerSession } = useSession();
  const { session: participantSession } = useParticipant();
  const { colors } = useColorScheme();
  const [notifications, setNotifications] = useState<AnyNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const isOrganizer = Boolean(organizerSession);
  usePushNotifications(isOrganizer ? undefined : participantSession?.participantId, participantSession?.token);

  const load = useCallback(async () => {
    if (!organizerSession && !participantSession) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setError(null);
    try {
      const data = organizerSession
        ? await getAdminNotifications()
        : await getParticipantNotifications(participantSession!.participantId, participantSession!.token);
      setNotifications(data);
    } catch (err) {
      reportError(err, { context: 'NotificacoesScreen.load', isOrganizer });
      setError('Nao foi possivel carregar as notificacoes.');
    } finally {
      setLoading(false);
    }
  }, [isOrganizer, organizerSession, participantSession]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  async function handleTap(notif: AnyNotification) {
    if (isAdminNotification(notif) && notif.event_id) {
      router.push(`/eventos/${notif.event_id}`);
    }

    if (notif.read) return;
    try {
      if (isAdminNotification(notif)) {
        await markAdminNotificationRead(notif.id);
      } else if (participantSession) {
        await markNotificationRead(notif.id, participantSession.participantId, participantSession.token);
      }
      analytics.track('notification_read', { notification_id: notif.id });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)),
      );
    } catch {
      // Read state is helpful, but not worth interrupting the user flow.
    }
  }

  const primary = Colors.brand.primary;

  const header = (
    <View style={[styles.header, { backgroundColor: Colors.brand.primary, borderBottomColor: Colors.brand.primaryPressed }]}>
      <Text style={[Typography.titleMd, { color: '#FFFFFF' }]}>Notificacoes</Text>
      <Text style={[Typography.caption, { color: Colors.brand.primarySoft, marginTop: 2 }]}>
        {isOrganizer ? 'Respostas das convocacoes' : 'Alertas da sua agenda'}
      </Text>
    </View>
  );

  if (!organizerSession && !participantSession) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {header}
        <View style={{ flex: 1 }}>
          <EmptyState
            icon={BellOff}
            title="Nenhuma notificacao"
            subtitle="Entre em um evento para receber notificacoes."
          />
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {header}
        <SkeletonList count={5} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {header}
        <ErrorState message={error} onRetry={load} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {header}

      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
        contentContainerStyle={
          notifications.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          <EmptyState
            icon={Bell}
            title="Sem notificacoes"
            subtitle={
              isOrganizer
                ? 'Aceites e recusas das convocacoes aparecerao aqui.'
                : 'Voce recebera alertas quando for adicionado a uma escala ou quando houver conflitos.'
            }
          />
        }
        renderItem={({ item }) => {
          const Icon = TYPE_ICON[item.type] ?? Bell;
          const accent = TYPE_COLOR[item.type] ?? primary;
          return (
            <TouchableOpacity
              onPress={() => handleTap(item)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={item.title}
              accessibilityHint={item.read ? undefined : 'Toque para marcar como lida'}
              accessibilityState={{ checked: item.read }}
            >
              <Card leftAccent={!item.read ? accent : undefined}>
                <View style={styles.row}>
                  <View style={[styles.iconBox, { backgroundColor: accent + '18' }]}>
                    <Icon size={20} color={accent} strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                      <Text style={[Typography.bodyStrong, { color: colors.text, flex: 1 }]}>
                        {item.title}
                      </Text>
                      {!item.read && (
                        <View
                          style={[styles.dot, { backgroundColor: primary }]}
                          accessibilityLabel="Nao lida"
                        />
                      )}
                    </View>
                    {item.body ? (
                      <Text style={[Typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                        {item.body}
                      </Text>
                    ) : null}
                    <Text style={[Typography.micro, { color: colors.textSoft, marginTop: 4 }]}>
                      {timeAgo(item.created_at)}
                    </Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
  },
  emptyContainer: { flex: 1 },
  listContent: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
