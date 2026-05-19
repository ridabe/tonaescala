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
  Modal,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { CalendarDays, MapPin, Clock, Check, X, LogOut, Users } from 'lucide-react-native';
import {
  getAssignmentRosterByGuestEventEmail,
  getAssignmentsByGuestEventEmail,
  getGuestEventsByInviteEmail,
  respondGuestEventAssignment,
  type AssignmentRosterItem,
  type GuestAssignment,
  type GuestEventSummary,
} from '@/lib/assignments';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, Radius, Layout } from '@/constants/Theme';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { SkeletonList } from '@/components/SkeletonBlock';
import { reportError } from '@/lib/errorReporting';
import { analytics } from '@/lib/analytics';
import { appStorage } from '@/lib/storage';
import { clearGuestAssignmentSession } from '@/hooks/useGuestAssignmentSession';

const RESPONSE_LABEL: Record<string, string> = {
  pending: 'Pendente',
  accepted: 'Aceito',
  declined: 'Recusado',
};
const RESPONSE_COLOR: Record<string, string> = {
  pending: Colors.status.warning,
  accepted: Colors.status.success,
  declined: Colors.status.danger,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function GuestEventScreen() {
  const { colors } = useColorScheme();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [guestEvents, setGuestEvents] = useState<GuestEventSummary[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<GuestAssignment[]>([]);
  const [roster, setRoster] = useState<AssignmentRosterItem[]>([]);
  const [session, setSession] = useState<{ inviteCode: string; email: string } | null>(null);
  const [declineTarget, setDeclineTarget] = useState<GuestAssignment | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  const load = useCallback(async (showLoader = true, eventId?: string | null) => {
    if (showLoader) setLoading(true);
    setLoadError(null);
    try {
      const inviteCode = await appStorage.getItem('assignment_invite_code');
      const email = await appStorage.getItem('assignment_email');

      if (!inviteCode || !email) {
        router.replace('/(auth)/login');
        return;
      }

      setSession({ inviteCode, email });
      const events = await getGuestEventsByInviteEmail(inviteCode, email);

      if (events.length === 0) {
        Alert.alert('Convocacao nao encontrada', 'Este email nao esta convocado para este evento.');
        await clearSessionAndLeave();
        return;
      }

      const targetEventId =
        eventId ??
        events.find((item) => item.is_current_invite)?.event_id ??
        events[0].event_id;

      const [items, rosterItems] = await Promise.all([
        getAssignmentsByGuestEventEmail(inviteCode, email, targetEventId),
        getAssignmentRosterByGuestEventEmail(inviteCode, email, targetEventId),
      ]);

      if (items.length === 0) {
        Alert.alert('Convocacao nao encontrada', 'Este email nao esta convocado para este evento.');
        await clearSessionAndLeave();
        return;
      }

      setGuestEvents(events);
      setSelectedEventId(targetEventId);
      setAssignments(items);
      setRoster(rosterItems);
    } catch (err) {
      reportError(err, { context: 'GuestEventScreen.load' });
      setLoadError('Nao foi possivel carregar sua convocacao. Confira o codigo e email.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(false, selectedEventId);
    setRefreshing(false);
  }, [load, selectedEventId]);

  async function clearSessionAndLeave() {
    await clearGuestAssignmentSession();
    await appStorage.removeItem('participant_id');
    await appStorage.removeItem('participant_access_token');
    await appStorage.removeItem('participant_event_id');
    await appStorage.removeItem('participant_invite_code');
    router.replace('/(auth)/login');
  }

  async function handleAccept(assignment: GuestAssignment) {
    if (!session) return;
    setSavingId(assignment.assignment_id);
    try {
      await respondGuestEventAssignment(session.inviteCode, session.email, assignment.assignment_id, 'accepted');
      analytics.track('assignment_accepted', { event_id: assignment.event_id, assignment_id: assignment.assignment_id });
      await load(false, assignment.event_id);
    } catch (e: any) {
      Alert.alert('Erro', e.message ?? 'Nao foi possivel salvar sua resposta.');
    } finally {
      setSavingId(null);
    }
  }

  async function handleSubmitDecline() {
    if (!session || !declineTarget) return;
    if (!declineReason.trim()) {
      Alert.alert('Justificativa obrigatoria', 'Informe o motivo da recusa.');
      return;
    }
    setSavingId(declineTarget.assignment_id);
    try {
      await respondGuestEventAssignment(
        session.inviteCode,
        session.email,
        declineTarget.assignment_id,
        'declined',
        declineReason.trim(),
      );
      analytics.track('assignment_declined', {
        event_id: declineTarget.event_id,
        assignment_id: declineTarget.assignment_id,
      });
      setDeclineTarget(null);
      setDeclineReason('');
      await load(false, declineTarget.event_id);
    } catch (e: any) {
      Alert.alert('Erro', e.message ?? 'Nao foi possivel salvar sua resposta.');
    } finally {
      setSavingId(null);
    }
  }

  function handleLeave() {
    Alert.alert(
      'Sair do evento',
      'Para voltar, use novamente o codigo do evento e seu email.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: clearSessionAndLeave },
      ],
    );
  }

  async function handleSelectEvent(eventId: string) {
    if (eventId === selectedEventId) return;
    setSelectedEventId(eventId);
    await load(false, eventId);
  }

  const primary = Colors.brand.primary;
  const eventInfo = assignments[0];

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: Colors.brand.primary, borderBottomColor: Colors.brand.primaryPressed }]}>
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
          message={loadError ?? 'Convocacao nao encontrada.'}
          onRetry={() => load()}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: Colors.brand.primary, borderBottomColor: Colors.brand.primaryPressed }]}>
        <View style={{ flex: 1 }}>
          <Text style={[Typography.titleMd, { color: '#FFFFFF' }]} numberOfLines={1}>
            {eventInfo.event_title}
          </Text>
          <Text style={[Typography.caption, { color: Colors.brand.primarySoft }]} numberOfLines={1}>
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
          <LogOut size={20} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <View style={[styles.accentBar, { backgroundColor: eventInfo.event_color }]} />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
      >
        {guestEvents.length > 1 ? (
          <View>
            <Text style={[Typography.caption, styles.sectionLabel, { color: colors.textMuted }]}>
              EVENTOS DESTE EMAIL
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventSwitcher}>
              {guestEvents.map((item) => {
                const selected = item.event_id === selectedEventId;
                return (
                  <TouchableOpacity
                    key={item.event_id}
                    style={[
                      styles.eventChip,
                      {
                        backgroundColor: selected ? item.event_color + '18' : colors.surface,
                        borderColor: selected ? item.event_color : colors.border,
                      },
                    ]}
                    onPress={() => handleSelectEvent(item.event_id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`Abrir evento ${item.event_title}`}
                  >
                    <Text style={[Typography.bodyStrong, { color: selected ? item.event_color : colors.text }]} numberOfLines={1}>
                      {item.event_title}
                    </Text>
                    <Text style={[Typography.caption, { color: colors.textMuted }]} numberOfLines={1}>
                      {formatDate(item.event_start_date)}
                    </Text>
                    <Text style={[Typography.micro, { color: colors.textMuted }]}>
                      {item.assignment_count} convocacao{item.assignment_count === 1 ? '' : 'es'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        <Card>
          <View style={styles.infoRows}>
            <InfoRow icon={CalendarDays} value={formatDate(eventInfo.event_start_date)} colors={colors} />
            <InfoRow
              icon={Clock}
              value={`${formatTime(eventInfo.event_start_date)}${eventInfo.event_end_date ? ` ate ${formatTime(eventInfo.event_end_date)}` : ''}`}
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

        <View>
          <Text style={[Typography.caption, styles.sectionLabel, { color: colors.textMuted }]}>
            SUAS CONVOCACOES
          </Text>
          {assignments.map((assignment) => {
            const statusColor = RESPONSE_COLOR[assignment.response_status] ?? colors.textMuted;
            const isSaving = savingId === assignment.assignment_id;
            return (
              <View key={assignment.assignment_id} style={{ marginBottom: Spacing.sm }}>
                <Card leftAccent={statusColor}>
                  <View style={{ gap: Spacing.sm }}>
                    <View style={styles.assignmentHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={[Typography.bodyStrong, { color: colors.text }]}>
                          {assignment.team_name ?? 'Equipe geral'}{assignment.role ? ` - ${assignment.role}` : ''}
                        </Text>
                        <Text style={[Typography.caption, { color: colors.textMuted }]}>
                          {assignment.invitee_name}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
                        <Text style={[Typography.micro, { color: statusColor }]}>
                          {RESPONSE_LABEL[assignment.response_status] ?? 'Pendente'}
                        </Text>
                      </View>
                    </View>

                    {assignment.arrival_time || assignment.start_time ? (
                      <InfoRow
                        icon={Clock}
                        value={`Chegada: ${formatTime(assignment.arrival_time ?? assignment.start_time!)}${assignment.end_time ? ` ate ${formatTime(assignment.end_time)}` : ''}`}
                        colors={colors}
                      />
                    ) : null}
                    {assignment.notes ? (
                      <Text style={[Typography.body, { color: colors.textMuted }]}>
                        {assignment.notes}
                      </Text>
                    ) : null}
                    {assignment.decline_reason ? (
                      <Text style={[Typography.caption, { color: Colors.status.danger }]}>
                        Motivo enviado: {assignment.decline_reason}
                      </Text>
                    ) : null}

                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[
                          styles.responseBtn,
                          {
                            backgroundColor: assignment.response_status === 'accepted' ? Colors.status.success : colors.surface,
                            borderColor: Colors.status.success,
                          },
                        ]}
                        onPress={() => handleAccept(assignment)}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <ActivityIndicator color={assignment.response_status === 'accepted' ? '#FFF' : Colors.status.success} />
                        ) : (
                          <>
                            <Check size={18} color={assignment.response_status === 'accepted' ? '#FFF' : Colors.status.success} strokeWidth={2.5} />
                            <Text style={[Typography.bodyStrong, { color: assignment.response_status === 'accepted' ? '#FFF' : Colors.status.success, marginLeft: 6 }]}>
                              Aceito
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.responseBtn,
                          {
                            backgroundColor: assignment.response_status === 'declined' ? Colors.status.danger : colors.surface,
                            borderColor: Colors.status.danger,
                          },
                        ]}
                        onPress={() => { setDeclineTarget(assignment); setDeclineReason(''); }}
                        disabled={isSaving}
                      >
                        <X size={18} color={assignment.response_status === 'declined' ? '#FFF' : Colors.status.danger} strokeWidth={2.5} />
                        <Text style={[Typography.bodyStrong, { color: assignment.response_status === 'declined' ? '#FFF' : Colors.status.danger, marginLeft: 6 }]}>
                          Nao poderei
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              </View>
            );
          })}
        </View>

        <View>
          <Text style={[Typography.caption, styles.sectionLabel, { color: colors.textMuted }]}>
            EQUIPE CONVOCADA
          </Text>
          {roster.length === 0 ? (
            <EmptyState icon={Users} title="Equipe nao disponivel" subtitle="Ainda nao ha outros convocados visiveis." />
          ) : (
            roster.map((item) => {
              const statusColor = RESPONSE_COLOR[item.response_status] ?? colors.textMuted;
              return (
                <View key={item.assignment_id} style={{ marginBottom: Spacing.sm }}>
                  <Card>
                    <View style={styles.rosterRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[Typography.bodyStrong, { color: colors.text }]}>
                          {item.invitee_name}{item.is_current_user ? ' - voce' : ''}
                        </Text>
                        <Text style={[Typography.caption, { color: colors.textMuted }]}>
                          {item.team_name ?? 'Equipe geral'}{item.role ? ` - ${item.role}` : ''}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
                        <Text style={[Typography.micro, { color: statusColor }]}>
                          {RESPONSE_LABEL[item.response_status] ?? 'Pendente'}
                        </Text>
                      </View>
                    </View>
                  </Card>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <Modal transparent visible={Boolean(declineTarget)} animationType="slide" onRequestClose={() => setDeclineTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.sheetBox, { backgroundColor: colors.surface }]}>
            <Text style={[Typography.titleSm, { color: colors.text }]}>Nao poderei participar</Text>
            <Text style={[Typography.caption, { color: colors.textMuted, marginTop: Spacing.xs }]}>
              Informe o motivo para que o organizador possa ajustar a escala.
            </Text>
            <TextInput
              style={[styles.textarea, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
              placeholder="Ex: estarei trabalhando neste horario"
              placeholderTextColor={colors.textSoft}
              value={declineReason}
              onChangeText={setDeclineReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              autoFocus
            />
            <View style={styles.modalActions}>
              <View style={{ flex: 1 }}>
                <TouchableOpacity style={[styles.modalBtn, { borderColor: colors.border }]} onPress={() => setDeclineTarget(null)}>
                  <Text style={[Typography.bodyStrong, { color: colors.textMuted }]}>Cancelar</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1 }}>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: Colors.status.danger, borderColor: Colors.status.danger }]} onPress={handleSubmitDecline}>
                  {savingId ? <ActivityIndicator color="#FFF" /> : <Text style={[Typography.bodyStrong, { color: '#FFF' }]}>Enviar recusa</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  eventSwitcher: {
    gap: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  eventChip: {
    width: 220,
    minHeight: 96,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    justifyContent: 'center',
  },
  infoRows: { gap: Spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start' },
  sectionLabel: {
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  assignmentHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  actionRow: { flexDirection: 'row', gap: Spacing.sm },
  responseBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Layout.minTouchTarget,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  rosterRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    padding: Spacing.lg,
  },
  sheetBox: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Typography.body,
    minHeight: 110,
    marginTop: Spacing.md,
  },
  modalActions: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  modalBtn: {
    minHeight: Layout.minTouchTarget,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
