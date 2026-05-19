import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { CalendarDays, MapPin, Clock, Check, X, LogOut, ClipboardList } from 'lucide-react-native';
import {
  getParticipantAgenda,
  getParticipantEventDetails,
  setEventAttendance,
  confirmSchedule,
  type EventDetailRow,
} from '@/lib/participants';
import { getPublicEventByInviteCode } from '@/lib/events';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, Radius, Layout } from '@/constants/Theme';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { SkeletonList } from '@/components/SkeletonBlock';
import { reportError } from '@/lib/errorReporting';
import { analytics } from '@/lib/analytics';

type AttendanceStatus = 'pending' | 'confirmed' | 'declined';

const SCHED_LABEL: Record<string, string> = {
  confirmed: 'Confirmado',
  declined: 'Recusado',
  late: 'Atrasarei',
};
const SCHED_COLOR: Record<string, string> = {
  confirmed: Colors.status.success,
  declined: Colors.status.danger,
  late: Colors.status.warning,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

type EventInfo = {
  event_id: string;
  event_title: string;
  event_description: string | null;
  event_location: string | null;
  event_start_date: string;
  event_end_date: string | null;
  event_color: string;
  organization_name: string;
  attendance_status: AttendanceStatus;
};

type ScheduleItem = {
  schedule_id: string;
  team_name: string | null;
  role: string | null;
  start_time: string | null;
  end_time: string | null;
  notes: string | null;
  confirmation_status: string | null;
};

export default function GuestEventScreen() {
  const { colors } = useColorScheme();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [creds, setCreds] = useState<{ pid: string; token: string; eid: string } | null>(null);
  const [legacyDatabaseMode, setLegacyDatabaseMode] = useState(false);

  const load = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const pid = await SecureStore.getItemAsync('participant_id');
      const tok = await SecureStore.getItemAsync('participant_access_token');
      const eid = await SecureStore.getItemAsync('participant_event_id');
      const inviteCode = await SecureStore.getItemAsync('participant_invite_code');

      if (!pid || !tok || !eid) {
        router.replace('/(auth)/login');
        return;
      }

      setCreds({ pid, token: tok, eid });

      let rows: EventDetailRow[];
      try {
        rows = await getParticipantEventDetails(pid, tok, eid);
        setLegacyDatabaseMode(false);
      } catch (err) {
        if (!isMissingRpcError(err)) throw err;
        if (!inviteCode) {
          await clearSession();
          return;
        }

        const publicEvent = await getPublicEventByInviteCode(inviteCode);
        const agenda = await getParticipantAgenda(pid, tok).catch((agendaErr) => {
          if (isMissingRpcError(agendaErr)) return [];
          throw agendaErr;
        });

        if (!publicEvent) {
          rows = [];
        } else {
          const eventAgenda = agenda.filter((item) => item.event_id === publicEvent.event_id);
          rows = eventAgenda.length > 0
            ? eventAgenda.map((item) => ({
                event_id: publicEvent.event_id,
                event_title: publicEvent.title,
                event_description: null,
                event_location: publicEvent.location,
                event_start_date: publicEvent.start_date,
                event_end_date: publicEvent.end_date,
                event_color: Colors.brand.primary,
                organization_name: publicEvent.organization_name,
                attendance_status: 'pending',
                schedule_id: item.schedule_id,
                team_name: item.team_name,
                role: item.role,
                start_time: item.start_time,
                end_time: item.end_time,
                notes: item.notes,
                confirmation_status: item.confirmation_status,
              }))
            : [{
                event_id: publicEvent.event_id,
                event_title: publicEvent.title,
                event_description: null,
                event_location: publicEvent.location,
                event_start_date: publicEvent.start_date,
                event_end_date: publicEvent.end_date,
                event_color: Colors.brand.primary,
                organization_name: publicEvent.organization_name,
                attendance_status: 'pending',
                schedule_id: null,
                team_name: null,
                role: null,
                start_time: null,
                end_time: null,
                notes: null,
                confirmation_status: null,
              }];
          setLegacyDatabaseMode(true);
        }
      }
      if (rows.length === 0) {
        Alert.alert('Evento não encontrado', 'O evento pode ter sido encerrado.');
        await clearSession();
        return;
      }

      const first = rows[0];
      setEventInfo({
        event_id: first.event_id,
        event_title: first.event_title,
        event_description: first.event_description,
        event_location: first.event_location,
        event_start_date: first.event_start_date,
        event_end_date: first.event_end_date,
        event_color: first.event_color,
        organization_name: first.organization_name,
        attendance_status: first.attendance_status as AttendanceStatus,
      });

      setSchedules(
        rows
          .filter((r) => r.schedule_id !== null)
          .map((r) => ({
            schedule_id: r.schedule_id!,
            team_name: r.team_name,
            role: r.role,
            start_time: r.start_time,
            end_time: r.end_time,
            notes: r.notes,
            confirmation_status: r.confirmation_status,
          })),
      );
    } catch (err) {
      reportError(err, { context: 'GuestEventScreen.load' });
      setLoadError('Não foi possível carregar o evento. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(false);
    setRefreshing(false);
  }, [load]);

  async function clearSession() {
    await SecureStore.deleteItemAsync('participant_id');
    await SecureStore.deleteItemAsync('participant_access_token');
    await SecureStore.deleteItemAsync('participant_event_id');
    await SecureStore.deleteItemAsync('participant_invite_code');
    router.replace('/(auth)/login');
  }

  async function handleAttendance(status: 'confirmed' | 'declined') {
    if (!creds) return;
    if (legacyDatabaseMode) {
      Alert.alert(
        'Banco pendente',
        'A confirmaÃ§Ã£o de presenÃ§a no evento exige aplicar as migrations mais recentes do Supabase.',
      );
      return;
    }
    setSaving(true);
    try {
      await setEventAttendance(creds.pid, creds.token, creds.eid, status);
      analytics.track(status === 'confirmed' ? 'attendance_confirmed' : 'attendance_declined', {
        event_id: creds.eid,
      });
      setEventInfo((prev) => prev ? { ...prev, attendance_status: status } : prev);
    } catch (e: any) {
      Alert.alert('Erro', e.message ?? 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmSchedule(scheduleId: string, current: string | null, idx: number) {
    if (!creds) return;
    const next = current === 'confirmed' ? 'declined' : 'confirmed';
    try {
      await confirmSchedule(scheduleId, creds.pid, creds.token, next as any);
      analytics.track('schedule_confirmed', { schedule_id: scheduleId, status: next });
      setSchedules((prev) =>
        prev.map((s, i) => i === idx ? { ...s, confirmation_status: next } : s),
      );
    } catch (e: any) {
      Alert.alert('Erro', e.message ?? 'Não foi possível confirmar.');
    }
  }

  function handleLeave() {
    Alert.alert(
      'Sair do evento',
      'Você sairá desta visualização. Para voltar, use o código de convite.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: clearSession },
      ],
    );
  }

  const primary = Colors.brand.primary;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <SkeletonList count={1} />
          </View>
        </View>
        <SkeletonList count={4} />
      </View>
    );
  }

  if (loadError || !eventInfo) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ErrorState
          message={loadError ?? 'Evento não encontrado.'}
          onRetry={() => load()}
        />
      </View>
    );
  }

  const isConfirmed = eventInfo.attendance_status === 'confirmed';
  const isDeclined = eventInfo.attendance_status === 'declined';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[Typography.titleMd, { color: colors.text }]} numberOfLines={1}>
            {eventInfo.event_title}
          </Text>
          <Text style={[Typography.caption, { color: colors.textMuted }]} numberOfLines={1}>
            {eventInfo.organization_name}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleLeave}
          hitSlop={8}
          style={styles.leaveBtn}
          accessibilityRole="button"
          accessibilityLabel="Sair do evento"
        >
          <LogOut size={20} color={Colors.status.danger} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Color accent bar */}
      <View style={[styles.accentBar, { backgroundColor: eventInfo.event_color }]} />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
      >
        {/* Event info */}
        <Card>
          <View style={styles.infoRows}>
            <InfoRow icon={CalendarDays} value={formatDate(eventInfo.event_start_date)} colors={colors} />
            <InfoRow
              icon={Clock}
              value={`${formatTime(eventInfo.event_start_date)}${eventInfo.event_end_date ? ` – ${formatTime(eventInfo.event_end_date)}` : ''}`}
              colors={colors}
            />
            {eventInfo.event_location ? (
              <InfoRow icon={MapPin} value={eventInfo.event_location} colors={colors} />
            ) : null}
          </View>
          {eventInfo.event_description ? (
            <Text style={[Typography.body, { color: colors.textMuted, marginTop: Spacing.sm }]}>
              {eventInfo.event_description}
            </Text>
          ) : null}
        </Card>

        {/* Attendance confirmation */}
        <View>
          <Text style={[Typography.caption, styles.sectionLabel, { color: colors.textMuted }]}>
            CONFIRMAÇÃO DE PRESENÇA
          </Text>
          {legacyDatabaseMode ? (
            <View style={[styles.alertBox, { backgroundColor: Colors.status.warningSoft, borderColor: Colors.status.warning }]}>
              <Text style={[Typography.caption, { color: Colors.status.warning }]}>
                Banco com migrations pendentes. Você pode visualizar o evento e confirmar escalas, mas a presença do evento fica indisponível neste modo.
              </Text>
            </View>
          ) : null}
          <View style={styles.attendanceRow}>
            <TouchableOpacity
              style={[
                styles.attendBtn,
                {
                  backgroundColor: isConfirmed ? Colors.status.success : colors.surface,
                  borderColor: isConfirmed ? Colors.status.success : colors.border,
                },
              ]}
              onPress={() => handleAttendance('confirmed')}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Confirmar presença"
              accessibilityState={{ selected: isConfirmed, disabled: saving }}
            >
              <Check size={18} color={isConfirmed ? '#FFF' : Colors.status.success} strokeWidth={2.5} />
              <Text style={[Typography.bodyStrong, { color: isConfirmed ? '#FFF' : Colors.status.success, marginLeft: 6 }]}>
                Estarei lá
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.attendBtn,
                {
                  backgroundColor: isDeclined ? Colors.status.danger : colors.surface,
                  borderColor: isDeclined ? Colors.status.danger : colors.border,
                },
              ]}
              onPress={() => handleAttendance('declined')}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Recusar presença"
              accessibilityState={{ selected: isDeclined, disabled: saving }}
            >
              <X size={18} color={isDeclined ? '#FFF' : Colors.status.danger} strokeWidth={2.5} />
              <Text style={[Typography.bodyStrong, { color: isDeclined ? '#FFF' : Colors.status.danger, marginLeft: 6 }]}>
                Não poderei
              </Text>
            </TouchableOpacity>
          </View>
          {saving && <ActivityIndicator color={primary} style={{ marginTop: Spacing.sm }} />}
        </View>

        {/* Schedules */}
        <View>
          <Text style={[Typography.caption, styles.sectionLabel, { color: colors.textMuted }]}>
            SUAS ESCALAS
          </Text>
          {schedules.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Sem escala ainda"
              subtitle="O organizador adicionará você a uma escala em breve."
            />
          ) : (
            schedules.map((s, idx) => (
              <View key={s.schedule_id} style={{ marginBottom: Spacing.sm }}>
                <Card>
                  <View style={styles.schedRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[Typography.bodyStrong, { color: colors.text }]}>
                        {s.team_name ?? 'Geral'}{s.role ? ` · ${s.role}` : ''}
                      </Text>
                      {s.start_time && (
                        <Text style={[Typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                          {formatTime(s.start_time)}{s.end_time ? ` – ${formatTime(s.end_time)}` : ''}
                        </Text>
                      )}
                      {s.notes ? (
                        <Text style={[Typography.caption, { color: colors.textSoft, marginTop: 2 }]}>
                          {s.notes}
                        </Text>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.schedStatus,
                        {
                          backgroundColor: s.confirmation_status
                            ? SCHED_COLOR[s.confirmation_status] + '22'
                            : colors.border,
                        },
                      ]}
                      onPress={() => handleConfirmSchedule(s.schedule_id, s.confirmation_status, idx)}
                    >
                      <Text
                        style={[
                          Typography.micro,
                          {
                            color: s.confirmation_status
                              ? SCHED_COLOR[s.confirmation_status]
                              : colors.textMuted,
                          },
                        ]}
                      >
                        {s.confirmation_status ? SCHED_LABEL[s.confirmation_status] : 'Pendente'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              </View>
            ))
          )}
          {schedules.length > 0 && (
            <Text style={[Typography.caption, { color: colors.textSoft, marginTop: Spacing.xs }]}>
              Toque no status para confirmar ou recusar sua escala.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon: Icon, value, colors }: { icon: any; value: string; colors: any }) {
  return (
    <View style={styles.infoRow}>
      <Icon size={16} color={colors.textMuted} strokeWidth={2} />
      <Text style={[Typography.body, { color: colors.text, flex: 1, marginLeft: Spacing.sm }]}>
        {value}
      </Text>
    </View>
  );
}

function isMissingRpcError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const maybe = error as { code?: string; message?: string };
  return maybe.code === '42883' || maybe.message?.includes('Could not find the function') === true;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
  },
  leaveBtn: { marginLeft: Spacing.md },
  accentBar: { height: 4 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.lg },
  infoRows: { gap: Spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start' },
  sectionLabel: {
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  alertBox: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  attendanceRow: { flexDirection: 'row', gap: Spacing.sm },
  attendBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Layout.minTouchTarget,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  schedRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  schedStatus: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
});
