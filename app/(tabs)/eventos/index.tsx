import { useCallback, useState } from 'react';
import {
  Animated,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Plus, CalendarPlus, ChevronDown, ChevronRight } from 'lucide-react-native';
import { fetchEventsWithSubEvents } from '@/lib/events';
import { reportError } from '@/lib/errorReporting';
import type { Event, EventWithSubEvents } from '@/lib/types';
import { useOrganization } from '@/hooks/useOrganization';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, Radius } from '@/constants/Theme';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { SkeletonList } from '@/components/SkeletonBlock';
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

type Section = { month: string; data: EventWithSubEvents[] };

function groupByMonth(events: EventWithSubEvents[]): Section[] {
  const map = new Map<string, EventWithSubEvents[]>();
  for (const ev of events) {
    const key = monthLabel(ev.start_date);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(ev);
  }
  return Array.from(map.entries()).map(([month, data]) => ({ month, data }));
}

function SubEventRow({ ev, colors }: { ev: Event; colors: ReturnType<typeof useColorScheme>['colors'] }) {
  return (
    <TouchableOpacity
      style={[styles.subEventRow, { borderLeftColor: ev.color || Colors.brand.primary, backgroundColor: colors.surface }]}
      onPress={() => router.push(`/eventos/${ev.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`Sub-evento ${ev.title}, ${formatDate(ev.start_date)}`}
    >
      <View style={styles.subEventDot} />
      <View style={styles.subEventInfo}>
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
    </TouchableOpacity>
  );
}

function EventCard({
  ev,
  colors,
  expanded,
  onToggle,
}: {
  ev: EventWithSubEvents;
  colors: ReturnType<typeof useColorScheme>['colors'];
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasSubs = ev.sub_events.length > 0;

  if (!hasSubs) {
    return (
      <View style={styles.cardWrapper}>
        <Card
          onPress={() => router.push(`/eventos/${ev.id}`)}
          leftAccent={ev.color}
          accessibilityLabel={`${ev.title}, ${formatDate(ev.start_date)}`}
          accessibilityHint="Toque para abrir o evento"
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
                <Text style={[Typography.micro, { color: ev.color }]}>{ev.category}</Text>
              </View>
            ) : null}
          </View>
        </Card>
      </View>
    );
  }

  // Accordion for master events with sub-events
  const ChevronIcon = expanded ? ChevronDown : ChevronRight;

  return (
    <View style={[styles.accordionWrapper, { borderColor: colors.border }]}>
      {/* Master event header */}
      <TouchableOpacity
        style={[styles.accordionHeader, { backgroundColor: colors.surface, borderLeftColor: ev.color }]}
        onPress={() => router.push(`/eventos/${ev.id}`)}
        onLongPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={`Evento mestre ${ev.title}. ${ev.sub_events.length} sub-eventos. Pressione longamente para expandir.`}
        activeOpacity={0.85}
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
          <View style={styles.accordionRight}>
            {ev.category ? (
              <View style={[styles.badge, { backgroundColor: ev.color + '22' }]}>
                <Text style={[Typography.micro, { color: ev.color }]}>{ev.category}</Text>
              </View>
            ) : null}
            <TouchableOpacity
              style={[styles.chevronBtn, { backgroundColor: ev.color + '18' }]}
              onPress={onToggle}
              accessibilityRole="button"
              accessibilityLabel={expanded ? 'Recolher sub-eventos' : 'Expandir sub-eventos'}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View style={[styles.subCountBadge]}>
                <Text style={[Typography.micro, { color: ev.color, fontWeight: '700' }]}>
                  {ev.sub_events.length}
                </Text>
              </View>
              <ChevronIcon size={14} color={ev.color} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      {/* Sub-events list */}
      {expanded && (
        <View style={[styles.subEventsList, { backgroundColor: colors.background }]}>
          {ev.sub_events.map((sub) => (
            <SubEventRow key={sub.id} ev={sub} colors={colors} />
          ))}
          <TouchableOpacity
            style={[styles.addSubEventBtn, { borderColor: ev.color + '55' }]}
            onPress={() => router.push(`/eventos/create?parentId=${ev.id}`)}
            accessibilityRole="button"
            accessibilityLabel="Criar sub-evento"
          >
            <Plus size={14} color={ev.color} strokeWidth={2.5} />
            <Text style={[Typography.caption, { color: ev.color, marginLeft: 4, fontWeight: '600' }]}>
              Criar sub-evento
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function EventosScreen() {
  const { org } = useOrganization();
  const { colors } = useColorScheme();
  const [events, setEvents] = useState<EventWithSubEvents[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!org) return;
    setError(null);
    try {
      const data = await fetchEventsWithSubEvents(org.id);
      setEvents(data);
    } catch (err) {
      reportError(err, { context: 'EventosScreen.load', orgId: org.id });
      setError('Não foi possível carregar os eventos.');
    } finally {
      setLoading(false);
    }
  }, [org]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const sections = groupByMonth(events);
  const primary = Colors.brand.primary;

  const header = (
    <View style={[styles.header, { backgroundColor: primary, borderBottomColor: Colors.brand.primaryPressed }]}>
      <View>
        <Text style={[Typography.titleMd, { color: '#FFFFFF' }]}>Eventos</Text>
        {org && (
          <Text style={[Typography.caption, { color: Colors.brand.primarySoft }]} numberOfLines={1}>
            {org.name}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: Colors.brand.accent }]}
        onPress={() => router.push('/eventos/create')}
        accessibilityRole="button"
        accessibilityLabel="Criar novo evento"
      >
        <Plus size={20} color="#FFF" strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {header}
        <SkeletonList count={4} />
      </View>
    );
  }

  if (error && events.length === 0) {
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
            onAction={() => router.push('/eventos/create')}
          />
        }
        renderItem={({ item: section }) => (
          <View>
            <Text style={[Typography.caption, styles.monthLabel, { color: colors.textMuted }]}>
              {section.month.toUpperCase()}
            </Text>
            {section.data.map((ev) => (
              <EventCard
                key={ev.id}
                ev={ev}
                colors={colors}
                expanded={expandedIds.has(ev.id)}
                onToggle={() => toggleExpanded(ev.id)}
              />
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
  // Accordion styles
  accordionWrapper: {
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  accordionHeader: {
    padding: Spacing.md,
    borderLeftWidth: 4,
  },
  accordionRight: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  chevronBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  subCountBadge: {
    minWidth: 16,
    alignItems: 'center',
  },
  subEventsList: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  subEventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 3,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
    gap: Spacing.sm,
  },
  subEventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'transparent',
  },
  subEventInfo: { flex: 1 },
  addSubEventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
});
