import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Calendar, QrCode } from 'lucide-react-native';
import type { AgendaItem } from '@/lib/participants';
import { useParticipant } from '@/hooks/useParticipant';
import { useOfflineAgenda } from '@/hooks/useOfflineAgenda';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, Radius } from '@/constants/Theme';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { SkeletonList } from '@/components/SkeletonBlock';
import { Card } from '@/components/Card';
import { useState, useCallback } from 'react';

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmado',
  declined: 'Recusado',
  late: 'Atrasarei',
};
const STATUS_COLOR: Record<string, string> = {
  confirmed: Colors.status.success,
  declined: Colors.status.danger,
  late: Colors.status.warning,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: 'short',
  });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

type EventGroup = {
  eventId: string;
  eventTitle: string;
  eventStartDate: string;
  items: AgendaItem[];
};

function groupByEvent(items: AgendaItem[]): EventGroup[] {
  const map = new Map<string, EventGroup>();
  for (const item of items) {
    if (!map.has(item.event_id)) {
      map.set(item.event_id, {
        eventId: item.event_id,
        eventTitle: item.event_title,
        eventStartDate: item.event_start_date,
        items: [],
      });
    }
    map.get(item.event_id)!.items.push(item);
  }
  return Array.from(map.values());
}

export default function AgendaScreen() {
  const { session, loading: sessionLoading } = useParticipant();
  const { colors } = useColorScheme();
  const { agenda, loading, error, isStale, reload } = useOfflineAgenda(
    session?.participantId,
    session?.token,
  );
  const [refreshing, setRefreshing] = useState(false);

  const primary = Colors.brand.primary;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  useFocusEffect(useCallback(() => {
    if (session) reload();
  }, [reload, session]));

  const header = (
    <View style={[styles.header, { backgroundColor: primary, borderBottomColor: Colors.brand.primaryPressed }]}>
      <Text style={[Typography.titleMd, { color: '#FFFFFF' }]}>Agenda</Text>
      {session && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: 'rgba(255,255,255,0.16)' }]}
          onPress={() => router.push('/scan-qr')}
          accessibilityRole="button"
          accessibilityLabel="Escanear QR Code"
        >
          <QrCode size={18} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
      )}
    </View>
  );

  if (sessionLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {header}
        <SkeletonList count={3} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {header}
        <View style={{ flex: 1 }}>
          <EmptyState
            icon={Calendar}
            title="Nenhum compromisso"
            subtitle="Entre em um evento com seu código ou escaneando o QR Code."
            actionLabel="Escanear QR Code"
            onAction={() => router.push('/scan-qr')}
          />
        </View>
      </View>
    );
  }

  if (loading && agenda.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {header}
        <SkeletonList count={4} />
      </View>
    );
  }

  if (error && agenda.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {header}
        <ErrorState offline message={error} onRetry={reload} />
      </View>
    );
  }

  const groups = groupByEvent(agenda);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {header}

      {isStale && (
        <View style={[styles.staleBanner, { backgroundColor: Colors.status.warningSoft }]}>
          <Text style={[Typography.caption, { color: Colors.status.warning }]}>
            Exibindo dados salvos · Sem conexão
          </Text>
        </View>
      )}

      <FlatList
        data={groups}
        keyExtractor={(g) => g.eventId}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
        contentContainerStyle={groups.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon={Calendar}
            title="Nenhum compromisso"
            subtitle="Você ainda não foi adicionado a nenhuma escala."
            actionLabel="Entrar em outro evento"
            onAction={() => router.push('/scan-qr')}
          />
        }
        renderItem={({ item: group }) => (
          <View style={styles.group}>
            <Text style={[Typography.caption, styles.groupLabel, { color: colors.textMuted }]}>
              {group.eventTitle.toUpperCase()} · {formatDate(group.eventStartDate)}
            </Text>
            {group.items.map((item) => (
              <View key={item.schedule_id} style={styles.cardWrapper}>
                <Card
                  onPress={() =>
                    router.push({
                      pathname: '/schedule/[id]',
                      params: {
                        id: item.schedule_id,
                        event_title: item.event_title,
                        event_start_date: item.event_start_date,
                        team_name: item.team_name ?? '',
                        role: item.role ?? '',
                        start_time: item.start_time ?? '',
                        end_time: item.end_time ?? '',
                        notes: item.notes ?? '',
                        confirmation_status: item.confirmation_status ?? '',
                        has_conflict: item.has_conflict ? '1' : '0',
                      },
                    })
                  }
                  accessibilityLabel={`${item.team_name ?? 'Geral'}${item.role ? `, ${item.role}` : ''}${item.start_time ? `, ${formatTime(item.start_time)}` : ''}`}
                  accessibilityHint="Toque para ver detalhes da escala"
                >
                  <View style={styles.scheduleRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[Typography.bodyStrong, { color: colors.text }]}>
                        {item.team_name ?? 'Geral'}{item.role ? ` · ${item.role}` : ''}
                      </Text>
                      {item.start_time && (
                        <Text style={[Typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                          {formatTime(item.start_time)}
                          {item.end_time ? ` – ${formatTime(item.end_time)}` : ''}
                        </Text>
                      )}
                      {item.has_conflict && (
                        <Text style={[Typography.caption, { color: Colors.status.warning, marginTop: 2 }]}>
                          ⚠ Conflito de horário
                        </Text>
                      )}
                    </View>
                    {item.confirmation_status ? (
                      <View style={[styles.badge, { backgroundColor: STATUS_COLOR[item.confirmation_status] + '22' }]}>
                        <Text style={[Typography.micro, { color: STATUS_COLOR[item.confirmation_status] }]}>
                          {STATUS_LABEL[item.confirmation_status]}
                        </Text>
                      </View>
                    ) : (
                      <View style={[styles.badge, { backgroundColor: colors.border }]}>
                        <Text style={[Typography.micro, { color: colors.textMuted }]}>Pendente</Text>
                      </View>
                    )}
                  </View>
                </Card>
              </View>
            ))}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
  },
  fab: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  staleBanner: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    alignItems: 'center',
  },
  emptyContainer: { flex: 1 },
  listContent: { padding: Spacing.lg },
  group: { marginBottom: Spacing.lg },
  groupLabel: {
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  cardWrapper: { marginBottom: Spacing.sm },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
});
