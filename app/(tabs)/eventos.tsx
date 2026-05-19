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
import { Plus, CalendarPlus } from 'lucide-react-native';
import { fetchEvents } from '@/lib/events';
import type { Event } from '@/lib/types';
import { useOrganization } from '@/hooks/useOrganization';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, Radius, Layout } from '@/constants/Theme';
import { EmptyState } from '@/components/EmptyState';
import { Card } from '@/components/Card';

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function monthLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

type Section = { month: string; data: Event[] };

function groupByMonth(events: Event[]): Section[] {
  const map = new Map<string, Event[]>();
  for (const ev of events) {
    const key = monthLabel(ev.start_date);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(ev);
  }
  return Array.from(map.entries()).map(([month, data]) => ({ month, data }));
}

export default function EventosScreen() {
  const { org } = useOrganization();
  const { colors } = useColorScheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!org) return;
    try {
      const data = await fetchEvents(org.id);
      setEvents(data);
    } catch {
      // silently fail — pull-to-refresh available
    }
  }, [org]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const sections = groupByMonth(events);
  const primary = Colors.brand.primary;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[Typography.titleMd, { color: colors.text }]}>Eventos</Text>
          {org && (
            <Text style={[Typography.caption, { color: colors.textMuted }]} numberOfLines={1}>
              {org.name}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: primary }]}
          onPress={() => router.push('/events/create')}
        >
          <Plus size={20} color="#FFF" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={sections}
        keyExtractor={(s) => s.month}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
        contentContainerStyle={events.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon={CalendarPlus}
            title="Nenhum evento"
            subtitle="Crie seu primeiro evento e monte a escala da sua equipe."
            actionLabel="Criar evento"
            onAction={() => router.push('/events/create')}
          />
        }
        renderItem={({ item: section }) => (
          <View>
            <Text style={[Typography.caption, styles.monthLabel, { color: colors.textMuted }]}>
              {section.month.toUpperCase()}
            </Text>
            {section.data.map((ev) => (
              <View key={ev.id} style={styles.cardWrapper}>
                <Card
                  onPress={() => router.push(`/events/${ev.id}`)}
                  leftAccent={ev.color}
                >
                  <View style={styles.cardRow}>
                    <View style={styles.cardMain}>
                      <Text style={[Typography.bodyStrong, { color: colors.text }]} numberOfLines={1}>
                        {ev.title}
                      </Text>
                      <Text style={[Typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                        {formatDate(ev.start_date)} · {formatTime(ev.start_date)}
                        {ev.end_date ? ` – ${formatTime(ev.end_date)}` : ''}
                      </Text>
                      {ev.location ? (
                        <Text style={[Typography.caption, { color: colors.textSoft, marginTop: 2 }]} numberOfLines={1}>
                          {ev.location}
                        </Text>
                      ) : null}
                    </View>
                    {ev.category ? (
                      <View style={[styles.badge, { backgroundColor: ev.color + '22' }]}>
                        <Text style={[Typography.micro, { color: ev.color }]}>
                          {ev.category}
                        </Text>
                      </View>
                    ) : null}
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
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  fab: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: { flex: 1 },
  listContent: { padding: Spacing.lg, gap: Spacing.xs },
  monthLabel: {
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  cardWrapper: { marginBottom: Spacing.sm },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  cardMain: { flex: 1 },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    alignSelf: 'flex-start',
  },
});
