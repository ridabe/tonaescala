import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CalendarPlus,
  CheckCircle2,
  ChevronDown,
  Clock3,
  UsersRound,
  XCircle,
} from 'lucide-react-native';
import { fetchMonthlyInsights, type EventInsight, type MonthlyInsights } from '@/lib/insights';
import { reportError } from '@/lib/errorReporting';
import { useOrganization } from '@/hooks/useOrganization';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing, Typography } from '@/constants/Theme';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { SkeletonBlock } from '@/components/SkeletonBlock';

function formatMonth(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

function eventHealth(event: EventInsight) {
  if (event.total === 0) return { label: 'Sem escala', color: Colors.status.info };
  if (event.pending > event.accepted + event.declined) return { label: 'Aguardando', color: Colors.status.warning };
  if (event.declined > event.accepted) return { label: 'Atencao', color: Colors.status.danger };
  return { label: 'Saudavel', color: Colors.status.success };
}

export default function InsightsScreen() {
  const { org } = useOrganization();
  const { colors } = useColorScheme();
  const [data, setData] = useState<MonthlyInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const entrance = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    if (!org) return;
    setError(null);
    try {
      const insights = await fetchMonthlyInsights(org.id);
      setData(insights);
    } catch (err) {
      reportError(err, { context: 'InsightsScreen.load', orgId: org.id });
      setError('Nao foi possivel carregar os insights.');
    } finally {
      setLoading(false);
    }
  }, [org]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: loading ? 0 : 1,
      duration: 520,
      useNativeDriver: true,
    }).start();
  }, [entrance, loading, data]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const topEvent = useMemo(() => {
    if (!data?.events.length) return null;
    return [...data.events].sort((a, b) => b.total - a.total)[0];
  }, [data]);

  const header = (
    <View style={[styles.header, { backgroundColor: Colors.brand.primary, borderBottomColor: Colors.brand.primaryPressed }]}>
      <View style={{ flex: 1 }}>
        <Text style={[Typography.titleMd, { color: '#FFFFFF' }]}>Insights</Text>
        <Text style={[Typography.caption, { color: Colors.brand.primarySoft }]} numberOfLines={1}>
          {data ? formatMonth(data.monthStart) : org?.name ?? 'Painel mensal'}
        </Text>
      </View>
      <View style={styles.headerIcon}>
        <Activity size={20} color="#FFFFFF" strokeWidth={2.4} />
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {header}
        <View style={styles.loadingContent}>
          <SkeletonBlock height={150} borderRadius={Radius.md} />
          <View style={styles.metricGrid}>
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonBlock key={index} height={104} borderRadius={Radius.md} style={styles.metricSkeleton} />
            ))}
          </View>
          <SkeletonBlock height={210} borderRadius={Radius.md} />
        </View>
      </View>
    );
  }

  if (error && !data) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {header}
        <ErrorState message={error} onRetry={load} />
      </View>
    );
  }

  const insights = data;

  if (!insights || insights.eventsCreated === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {header}
        <View style={{ flex: 1 }}>
          <EmptyState
            icon={BarChart3}
            title="Sem dados neste mes"
            subtitle="Crie eventos e escale pessoas para acompanhar os indicadores aqui."
            actionLabel="Criar evento"
            onAction={() => router.push('/eventos/create')}
          />
        </View>
      </View>
    );
  }

  const acceptedPercent = insights.totalScaled > 0 ? clampPercent((insights.accepted / insights.totalScaled) * 100) : 0;
  const declinedPercent = insights.totalScaled > 0 ? clampPercent((insights.declined / insights.totalScaled) * 100) : 0;
  const pendingPercent = insights.totalScaled > 0 ? clampPercent((insights.pending / insights.totalScaled) * 100) : 0;
  const translateY = entrance.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {header}
      <Animated.ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand.primary} />}
        contentContainerStyle={styles.content}
        style={{ opacity: entrance, transform: [{ translateY }] }}
      >
        <View style={[styles.heroPanel, { backgroundColor: Colors.brand.primaryPressed }]}>
          <View style={styles.heroTop}>
            <View>
              <Text style={[Typography.caption, { color: Colors.brand.primarySoft }]}>Taxa de resposta</Text>
              <Text style={styles.heroNumber}>{insights.responseRate}%</Text>
            </View>
            <TouchableOpacity
              style={styles.heroAction}
              onPress={() => topEvent && router.push({ pathname: '/eventos/[id]', params: { id: topEvent.event.id } })}
              disabled={!topEvent}
              accessibilityRole="button"
              accessibilityLabel="Abrir evento com mais escalados"
            >
              <ArrowUpRight size={18} color="#FFFFFF" strokeWidth={2.4} />
            </TouchableOpacity>
          </View>
          <Text style={[Typography.caption, { color: '#D9FFFB' }]}>
            {insights.accepted + insights.declined} respostas de {insights.totalScaled} pessoas escaladas.
          </Text>
          <StackedBar
            accepted={acceptedPercent}
            declined={declinedPercent}
            pending={pendingPercent}
          />
          <View style={styles.legendRow}>
            <LegendDot label="Aceites" value={insights.accepted} color={Colors.status.success} />
            <LegendDot label="Recusas" value={insights.declined} color={Colors.status.danger} />
            <LegendDot label="Pendentes" value={insights.pending} color={Colors.status.warning} />
          </View>
        </View>

        <View style={styles.metricGrid}>
          <MetricCard icon={CalendarPlus} label="Eventos no mes" value={insights.eventsCreated} tone={Colors.brand.primary} />
          <MetricCard icon={UsersRound} label="Pessoas escaladas" value={insights.totalScaled} tone={Colors.status.info} />
          <MetricCard icon={CheckCircle2} label="Aceites" value={insights.accepted} tone={Colors.status.success} />
          <MetricCard icon={Clock3} label="Pendentes" value={insights.pending} tone={Colors.status.warning} />
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={[Typography.titleSm, { color: colors.text }]}>Eventos do mes</Text>
            <Text style={[Typography.caption, { color: colors.textMuted }]}>Toque para ver o detalhamento</Text>
          </View>
          <View style={[styles.totalBadge, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={[Typography.micro, { color: colors.textMuted }]}>{insights.uniquePeople} unicas</Text>
          </View>
        </View>

        {insights.events.map((item, index) => (
          <EventInsightCard
            key={item.event.id}
            item={item}
            index={index}
            expanded={expandedEventId === item.event.id}
            onToggle={() => setExpandedEventId((current) => current === item.event.id ? null : item.event.id)}
          />
        ))}
      </Animated.ScrollView>
    </View>
  );
}

function StackedBar({ accepted, declined, pending }: { accepted: number; declined: number; pending: number }) {
  return (
    <View style={styles.stackedTrack}>
      <View style={[styles.stackedPart, { flex: accepted, backgroundColor: Colors.status.success }]} />
      <View style={[styles.stackedPart, { flex: declined, backgroundColor: Colors.status.danger }]} />
      <View style={[styles.stackedPart, { flex: pending, backgroundColor: Colors.status.warning }]} />
      {accepted + declined + pending === 0 ? <View style={[styles.stackedPart, { flex: 1, backgroundColor: 'rgba(255,255,255,0.2)' }]} /> : null}
    </View>
  );
}

function LegendDot({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label} {value}</Text>
    </View>
  );
}

function MetricCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: number; tone: string }) {
  const { colors } = useColorScheme();
  return (
    <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.metricIcon, { backgroundColor: tone + '18' }]}>
        <Icon size={18} color={tone} strokeWidth={2.4} />
      </View>
      <Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text>
      <Text style={[Typography.caption, { color: colors.textMuted }]} numberOfLines={2}>{label}</Text>
    </View>
  );
}

function EventInsightCard({
  item,
  index,
  expanded,
  onToggle,
}: {
  item: EventInsight;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { colors } = useColorScheme();
  const pressAnim = useRef(new Animated.Value(1)).current;
  const detailAnim = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const health = eventHealth(item);

  useEffect(() => {
    Animated.timing(detailAnim, {
      toValue: expanded ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [detailAnim, expanded]);

  const detailOpacity = detailAnim;
  const detailHeight = detailAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 92] });

  return (
    <Animated.View style={{ transform: [{ scale: pressAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onToggle}
        onPressIn={() => Animated.spring(pressAnim, { toValue: 0.985, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(pressAnim, { toValue: 1, useNativeDriver: true }).start()}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`Insights de ${item.event.title}`}
      >
        <View style={[styles.eventCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.eventTop}>
            <View style={[styles.eventRank, { backgroundColor: item.event.color + '22' }]}>
              <Text style={[Typography.micro, { color: item.event.color }]}>#{index + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[Typography.bodyStrong, { color: colors.text }]} numberOfLines={1}>{item.event.title}</Text>
              <Text style={[Typography.caption, { color: colors.textMuted }]}>
                {formatDate(item.event.start_date)} · {item.total} escalados
              </Text>
            </View>
            <View style={[styles.healthBadge, { backgroundColor: health.color + '18' }]}>
              <Text style={[Typography.micro, { color: health.color }]}>{health.label}</Text>
            </View>
            <Animated.View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
              <ChevronDown size={18} color={colors.textMuted} strokeWidth={2.2} />
            </Animated.View>
          </View>

          <View style={[styles.eventBarTrack, { backgroundColor: colors.surfaceAlt }]}>
            <View style={[styles.eventBarFill, { width: `${clampPercent(item.responseRate)}%`, backgroundColor: item.event.color }]} />
          </View>

          <Animated.View style={{ height: detailHeight, opacity: detailOpacity, overflow: 'hidden' }}>
            <View style={styles.detailGrid}>
              <DetailPill icon={CheckCircle2} label="Aceites" value={item.accepted} color={Colors.status.success} />
              <DetailPill icon={XCircle} label="Recusas" value={item.declined} color={Colors.status.danger} />
              <DetailPill icon={Clock3} label="Pendentes" value={item.pending} color={Colors.status.warning} />
            </View>
            <TouchableOpacity
              style={[styles.openEventBtn, { borderColor: colors.border }]}
              onPress={() => router.push({ pathname: '/eventos/[id]', params: { id: item.event.id } })}
              accessibilityRole="button"
              accessibilityLabel={`Abrir ${item.event.title}`}
            >
              <Text style={[Typography.caption, { color: Colors.brand.primary }]}>Abrir evento</Text>
              <ArrowUpRight size={15} color={Colors.brand.primary} strokeWidth={2.3} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function DetailPill({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  const { colors } = useColorScheme();
  return (
    <View style={[styles.detailPill, { backgroundColor: colors.surfaceAlt }]}>
      <Icon size={15} color={color} strokeWidth={2.3} />
      <Text style={[Typography.micro, { color }]}>{value}</Text>
      <Text style={[Typography.micro, { color: colors.textMuted }]}>{label}</Text>
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
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  loadingContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  heroPanel: {
    borderRadius: Radius.md,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heroNumber: {
    color: '#FFFFFF',
    fontSize: 46,
    lineHeight: 54,
    fontWeight: '800',
  },
  heroAction: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  stackedTrack: {
    height: 12,
    borderRadius: Radius.full,
    overflow: 'hidden',
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  stackedPart: { minWidth: 0 },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  metricCard: {
    width: '48.7%',
    minHeight: 112,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  metricSkeleton: { width: '48.7%' },
  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  totalBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  eventCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  eventTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  eventRank: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  eventBarTrack: {
    height: 8,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  eventBarFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  detailGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  detailPill: {
    flex: 1,
    minHeight: 42,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  openEventBtn: {
    minHeight: 36,
    borderWidth: 1,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
});
