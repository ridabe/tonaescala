import { useCallback, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  CalendarDays, MapPin, MoreVertical, Plus, Share2, Tag,
  Users, ClipboardList, Info, Trash2, Clock, AlertTriangle, UserCheck, Mail,
} from 'lucide-react-native';
import { fetchEventById, archiveEvent, deleteEvent } from '@/lib/events';
import { fetchTeams, createTeam, deleteTeam } from '@/lib/teams';
import { fetchSchedules, deleteSchedule } from '@/lib/schedules';
import { deleteEventAssignment, getEventAssignmentsForOrganizer, type EventAssignment } from '@/lib/assignments';
import { createEmailCampaign, triggerEmailCampaign, getEmailCampaigns, type EmailCampaign } from '@/lib/emailCampaigns';
import { getEventParticipantsForOrganizer, type EventParticipant } from '@/lib/participants';
import { supabase } from '@/lib/supabase';
import type { Event, Team, Schedule } from '@/lib/types';
import { useOrganization } from '@/hooks/useOrganization';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, Radius, Layout } from '@/constants/Theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { SkeletonList } from '@/components/SkeletonBlock';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { reportError } from '@/lib/errorReporting';

type Tab = 'escala' | 'equipes' | 'conflitos' | 'convidados' | 'info';
type AssignmentFilter = 'all' | 'accepted' | 'declined' | 'viewed' | 'not_viewed';

type EventConflict = {
  conflict_id: string;
  participant_name: string;
  schedule1_id: string;
  schedule1_role: string | null;
  schedule1_start: string | null;
  schedule1_event: string;
  schedule2_id: string;
  schedule2_role: string | null;
  schedule2_start: string | null;
  schedule2_event: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

const STATUS_LABEL: Record<string, string> = { confirmed: 'Confirmado', declined: 'Recusado', late: 'Atrasará' };
const STATUS_COLOR: Record<string, string> = {
  confirmed: Colors.status.success,
  declined: Colors.status.danger,
  late: Colors.status.warning,
};
const ASSIGNMENT_STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente',
  accepted: 'Aceitou',
  declined: 'Recusou',
};
const ASSIGNMENT_STATUS_COLOR: Record<string, string> = {
  pending: Colors.status.warning,
  accepted: Colors.status.success,
  declined: Colors.status.danger,
};

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { org } = useOrganization();
  const { colors } = useColorScheme();
  const insets = useSafeAreaInsets();

  const [event, setEvent] = useState<Event | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [assignments, setAssignments] = useState<EventAssignment[]>([]);
  const [conflicts, setConflicts] = useState<EventConflict[]>([]);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [tab, setTab] = useState<Tab>('escala');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilter>('all');
  const [emailCampaigns, setEmailCampaigns] = useState<EmailCampaign[]>([]);
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [emailSending, setEmailSending] = useState(false);

  // New team modal
  const [teamModalVisible, setTeamModalVisible] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [teamLoading, setTeamLoading] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoadError(null);
    try {
      const [ev, sc, pts, asg, campaigns] = await Promise.all([
        fetchEventById(id),
        fetchSchedules(id),
        getEventParticipantsForOrganizer(id),
        getEventAssignmentsForOrganizer(id),
        getEmailCampaigns(id).catch(() => [] as EmailCampaign[]),
      ]);
      setEvent(ev);
      setSchedules(sc);
      setParticipants(pts);
      setAssignments(asg);
      setEmailCampaigns(campaigns);
      if (org) {
        const t = await fetchTeams(org.id);
        setTeams(t);
      }
      const { data: cf } = await supabase.rpc('get_event_conflicts_for_organizer', { p_event_id: id });
      setConflicts((cf as EventConflict[]) ?? []);
    } catch (err) {
      reportError(err, { context: 'EventDetailScreen.load', eventId: id });
      setLoadError('Não foi possível carregar o evento.');
    } finally {
      setLoading(false);
    }
  }, [id, org]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setLoading(false); // already have data, don't show full skeleton on pull-to-refresh
    await load();
    setRefreshing(false);
  }, [load]);

  async function handleArchive() {
    Alert.alert('Arquivar evento', 'Tem certeza? O evento não aparecerá mais na lista.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Arquivar', style: 'destructive', onPress: async () => {
          try {
            await archiveEvent(id!);
            router.back();
          } catch (e: any) {
            Alert.alert('Erro', e.message ?? 'Nao foi possivel arquivar o evento.');
          }
        },
      },
    ]);
  }

  async function handleDeleteEvent() {
    Alert.alert(
      'Excluir evento',
      'Tem certeza? Isso remove o evento, escalas, confirmações e presenças vinculadas. Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent(id!);
              router.back();
            } catch (e: any) {
              Alert.alert('Erro', e.message);
            }
          },
        },
      ],
    );
  }

  async function handleDeleteSchedule(scheduleId: string, name: string) {
    Alert.alert('Remover da escala', `Remover ${name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive', onPress: async () => {
          try {
            await deleteSchedule(scheduleId);
            setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
          } catch (e: any) {
            Alert.alert('Erro', e.message ?? 'Nao foi possivel remover da escala.');
          }
        },
      },
    ]);
  }

  async function handleDeleteAssignment(assignment: EventAssignment) {
    Alert.alert(
      'Remover convocado',
      `Remover ${assignment.invitee_name} desta escala? A pessoa nao conseguira mais responder esta convocacao.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEventAssignment(assignment.assignment_id);
              setAssignments((prev) => prev.filter((a) => a.assignment_id !== assignment.assignment_id));
            } catch (e: any) {
              Alert.alert('Erro', e.message ?? 'Nao foi possivel remover o convocado.');
            }
          },
        },
      ],
    );
  }

  function handleScheduleParticipant(participant: EventParticipant) {
    router.push({
      pathname: '/events/[id]/add-schedule',
      params: {
        id,
        participant_id: participant.participant_id,
        participant_name: participant.participant_name,
        participant_phone: participant.participant_phone ?? '',
      },
    });
  }

  async function handleDeleteTeam(teamId: string, name: string) {
    Alert.alert('Remover equipe', `Remover a equipe "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive', onPress: async () => {
          try {
            await deleteTeam(teamId);
            setTeams((prev) => prev.filter((t) => t.id !== teamId));
          } catch (e: any) {
            Alert.alert('Erro', e.message ?? 'Nao foi possivel remover a equipe.');
          }
        },
      },
    ]);
  }

  async function handleCreateTeam() {
    if (!newTeamName.trim() || !org) return;
    setTeamLoading(true);
    try {
      const t = await createTeam(org.id, newTeamName.trim());
      setTeams((prev) => [...prev, t]);
      setNewTeamName('');
      setTeamModalVisible(false);
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setTeamLoading(false);
    }
  }

  async function handleSendEmails() {
    if (!id || emailSending) return;
    setEmailSending(true);
    try {
      const campaignId = await createEmailCampaign(id);
      const result = await triggerEmailCampaign(id, campaignId);
      const updated = await getEmailCampaigns(id).catch(() => emailCampaigns);
      setEmailCampaigns(updated);
      setEmailModalVisible(false);
      Alert.alert(
        'Emails enviados',
        `${result.sent} enviado${result.sent !== 1 ? 's' : ''}${result.failed > 0 ? ` · ${result.failed} falha${result.failed !== 1 ? 's' : ''}` : ''}.`,
      );
    } catch (e: any) {
      const msg =
        e.message === 'NO_RECIPIENTS' ? 'Nenhum convocado com email válido encontrado.'
        : e.message === 'NOT_AUTHORIZED' ? 'Sem permissão para enviar neste evento.'
        : e.message ?? 'Não foi possível enviar os emails.';
      Alert.alert('Erro', msg);
    } finally {
      setEmailSending(false);
    }
  }

  const primary = Colors.brand.primary;

  const usingAssignments = assignments.length > 0;
  const viewedPending = assignments.filter((a) => a.response_status === 'pending' && a.viewed_at).length;
  const notViewed = assignments.filter((a) => a.response_status === 'pending' && !a.viewed_at).length;
  const filteredAssignments = assignments.filter((a) => {
    if (assignmentFilter === 'accepted') return a.response_status === 'accepted';
    if (assignmentFilter === 'declined') return a.response_status === 'declined';
    if (assignmentFilter === 'viewed') return a.response_status === 'pending' && Boolean(a.viewed_at);
    if (assignmentFilter === 'not_viewed') return a.response_status === 'pending' && !a.viewed_at;
    return true;
  });
  const confirmed = usingAssignments
    ? assignments.filter((a) => a.response_status === 'accepted').length
    : schedules.filter((s) => s.confirmation?.status === 'confirmed').length;
  const pending = usingAssignments
    ? assignments.filter((a) => a.response_status === 'pending').length
    : schedules.filter((s) => !s.confirmation).length;
  const declined = assignments.filter((a) => a.response_status === 'declined').length;
  const conflictCount = conflicts.length;
  const scheduledParticipantIds = new Set(schedules.map((s) => s.participant_id));
  const conflictedScheduleIds = new Set(
    conflicts.flatMap((cf) => [cf.schedule1_id, cf.schedule2_id]),
  );

  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Evento" fallbackHref="/(tabs)/eventos" />
        <SkeletonList count={5} />
      </View>
    );
  }

  if (loadError || !event) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Evento" fallbackHref="/(tabs)/eventos" />
        <ErrorState message={loadError ?? 'Evento não encontrado.'} onRetry={load} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title={event.title}
        fallbackHref="/(tabs)/eventos"
        right={
          <TouchableOpacity onPress={() => setMenuVisible(true)} hitSlop={8}>
            <MoreVertical size={22} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        }
      />

      {/* Color accent bar */}
      <View style={[styles.accentBar, { backgroundColor: event.color }]} />

      {/* Stats row */}
      <View style={[styles.statsRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.statItem}>
          <Text style={[Typography.titleMd, { color: Colors.status.success }]}>{confirmed}</Text>
          <Text style={[Typography.caption, { color: colors.textMuted }]}>{usingAssignments ? 'Aceitos' : 'Confirmados'}</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[Typography.titleMd, { color: colors.text }]}>{pending}</Text>
          <Text style={[Typography.caption, { color: colors.textMuted }]}>Pendentes</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        {usingAssignments ? (
          <>
            <View style={styles.statItem}>
              <Text style={[Typography.titleMd, { color: Colors.status.danger }]}>{declined}</Text>
              <Text style={[Typography.caption, { color: colors.textMuted }]}>Recusas</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          </>
        ) : null}
        <View style={styles.statItem}>
          <Text style={[Typography.titleMd, { color: conflictCount > 0 ? Colors.status.warning : colors.text }]}>
            {conflictCount}
          </Text>
          <Text style={[Typography.caption, { color: colors.textMuted }]}>Conflitos</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[Typography.titleMd, { color: colors.text }]}>{usingAssignments ? assignments.length : schedules.length}</Text>
          <Text style={[Typography.caption, { color: colors.textMuted }]}>Total</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {(['escala', 'equipes', 'conflitos', 'convidados', 'info'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && { borderBottomColor: primary, borderBottomWidth: 2 }]}
            onPress={() => setTab(t)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t }}
            accessibilityLabel={t === 'escala' ? 'Escala' : t === 'equipes' ? 'Equipes' : t === 'conflitos' ? 'Conflitos' : t === 'convidados' ? 'Presenças' : 'Informações'}
          >
            {t === 'escala' && <ClipboardList size={16} color={tab === t ? primary : colors.textMuted} strokeWidth={2} />}
            {t === 'equipes' && <Users size={16} color={tab === t ? primary : colors.textMuted} strokeWidth={2} />}
            {t === 'conflitos' && (
              <AlertTriangle
                size={16}
                color={tab === t ? primary : conflictCount > 0 ? Colors.status.warning : colors.textMuted}
                strokeWidth={2}
              />
            )}
            {t === 'convidados' && <UserCheck size={16} color={tab === t ? primary : colors.textMuted} strokeWidth={2} />}
            {t === 'info' && <Info size={16} color={tab === t ? primary : colors.textMuted} strokeWidth={2} />}
            <Text style={[Typography.caption, { color: tab === t ? primary : colors.textMuted, marginTop: 2, textTransform: 'capitalize' }]}>
              {t === 'escala' ? 'Escala' : t === 'equipes' ? 'Equipes' : t === 'conflitos' ? 'Conflitos' : t === 'convidados' ? 'Presenças' : 'Info'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.tabContent, { paddingBottom: 120 + insets.bottom }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
      >
        {/* ── ESCALA ── */}
        {tab === 'escala' && (
          <>
            {assignments.length > 0 ? (
              <>
                <View style={styles.presencaSummary}>
                  {[
                    { label: 'Aceitos', value: assignments.filter((a) => a.response_status === 'accepted').length, color: Colors.status.success },
                    { label: 'Vistos', value: viewedPending, color: Colors.status.warning },
                    { label: 'Nao vistos', value: notViewed, color: colors.textMuted },
                    { label: 'Recusas', value: declined, color: Colors.status.danger },
                  ].map((item) => (
                    <View key={item.label} style={styles.presencaStat}>
                      <Text style={[Typography.titleMd, { color: item.color }]}>{item.value}</Text>
                      <Text style={[Typography.caption, { color: colors.textMuted }]}>{item.label}</Text>
                    </View>
                  ))}
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterRow}
                >
                  {[
                    { key: 'all', label: `Todos ${assignments.length}`, color: primary },
                    { key: 'accepted', label: `Aceitos ${confirmed}`, color: Colors.status.success },
                    { key: 'declined', label: `Recusas ${declined}`, color: Colors.status.danger },
                    { key: 'viewed', label: `Vistos ${viewedPending}`, color: Colors.status.warning },
                    { key: 'not_viewed', label: `Nao vistos ${notViewed}`, color: colors.textMuted },
                  ].map((item) => {
                    const active = assignmentFilter === item.key;
                    return (
                      <TouchableOpacity
                        key={item.key}
                        onPress={() => setAssignmentFilter(item.key as AssignmentFilter)}
                        style={[
                          styles.filterChip,
                          {
                            borderColor: active ? item.color : colors.border,
                            backgroundColor: active ? item.color + '18' : colors.surface,
                          },
                        ]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={`Filtrar ${item.label}`}
                      >
                        <Text style={[Typography.caption, { color: active ? item.color : colors.textMuted }]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                {filteredAssignments.length === 0 ? (
                  <EmptyState
                    icon={ClipboardList}
                    title="Nenhum convocado neste filtro"
                    subtitle="Troque o filtro para ver outros status da escala."
                  />
                ) : null}
                {filteredAssignments.map((a) => {
                  const statusColor = ASSIGNMENT_STATUS_COLOR[a.response_status] ?? colors.textMuted;
                  return (
                    <Card key={a.assignment_id} leftAccent={statusColor}>
                      <View style={{ gap: Spacing.sm }}>
                        <View style={styles.scheduleRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={[Typography.bodyStrong, { color: colors.text }]}>
                              {a.invitee_name}
                            </Text>
                            <Text style={[Typography.caption, { color: colors.textMuted }]}>
                              {a.team_name ?? 'Sem equipe'}{a.role ? ` - ${a.role}` : ''}
                            </Text>
                            <Text style={[Typography.caption, { color: colors.textSoft }]}>
                              {a.invitee_email}
                            </Text>
                            {a.arrival_time || a.start_time ? (
                              <Text style={[Typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                                {formatTime(a.arrival_time ?? a.start_time!)}
                                {a.end_time ? ` ate ${formatTime(a.end_time)}` : ''}
                              </Text>
                            ) : null}
                          </View>
                          <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
                            <Text style={[Typography.micro, { color: statusColor }]}>
                              {ASSIGNMENT_STATUS_LABEL[a.response_status] ?? 'Pendente'}
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => handleDeleteAssignment(a)}
                            hitSlop={8}
                            style={styles.deleteBtn}
                            accessibilityRole="button"
                            accessibilityLabel={`Remover ${a.invitee_name} da escala`}
                          >
                            <Trash2 size={16} color={Colors.status.danger} strokeWidth={2} />
                          </TouchableOpacity>
                        </View>
                        {a.response_status === 'pending' ? (
                          <Text style={[Typography.caption, { color: a.viewed_at ? Colors.status.warning : colors.textMuted }]}>
                            {a.viewed_at ? 'Visualizou, aguardando resposta' : 'Ainda nao visualizou'}
                          </Text>
                        ) : null}
                        {a.decline_reason ? (
                          <Text style={[Typography.caption, { color: Colors.status.danger }]}>
                            Motivo: {a.decline_reason}
                          </Text>
                        ) : null}
                        {a.notes ? (
                          <Text style={[Typography.caption, { color: colors.textSoft }]}>
                            Obs: {a.notes}
                          </Text>
                        ) : null}
                      </View>
                    </Card>
                  );
                })}
                <View style={{ marginTop: Spacing.md }}>
                  <Button
                    label="Adicionar convocado"
                    variant="outline"
                    icon={Plus}
                    onPress={() => router.push(`/events/${id}/add-schedule`)}
                  />
                </View>
                <View style={{ marginTop: Spacing.sm }}>
                  <Button
                    label="Enviar convites por email"
                    variant="outline"
                    icon={Mail}
                    onPress={() => setEmailModalVisible(true)}
                  />
                </View>
                {emailCampaigns.length > 0 && (
                  <Card>
                    <View style={{ gap: Spacing.xs }}>
                      <Text style={[Typography.caption, { color: colors.textMuted }]}>Último envio</Text>
                      <Text style={[Typography.bodyStrong, { color: colors.text }]}>
                        {emailCampaigns[0].sent_count} enviado{emailCampaigns[0].sent_count !== 1 ? 's' : ''}
                        {emailCampaigns[0].failed_count > 0
                          ? ` · ${emailCampaigns[0].failed_count} falha${emailCampaigns[0].failed_count !== 1 ? 's' : ''}`
                          : ''}
                      </Text>
                      <Text style={[Typography.caption, { color: colors.textSoft }]}>
                        {new Date(emailCampaigns[0].created_at).toLocaleString('pt-BR', {
                          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </Card>
                )}
              </>
            ) : schedules.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="Nenhum convocado"
                subtitle="Adicione pessoas com email, equipe e funcao para montar a escala convocada."
                actionLabel="Adicionar à escala"
                onAction={() => router.push(`/events/${id}/add-schedule`)}
              />
            ) : (
              <>
                {schedules.map((s) => (
                  <Card key={s.id} leftAccent={conflictedScheduleIds.has(s.id) ? Colors.status.warning : s.team ? undefined : colors.border}>
                    <View style={styles.scheduleRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[Typography.bodyStrong, { color: colors.text }]}>
                          {s.participant?.name ?? '—'}
                        </Text>
                        {s.team && (
                          <Text style={[Typography.caption, { color: colors.textMuted }]}>{s.team.name}{s.role ? ` · ${s.role}` : ''}</Text>
                        )}
                        {!s.team && s.role && (
                          <Text style={[Typography.caption, { color: colors.textMuted }]}>{s.role}</Text>
                        )}
                        {conflictedScheduleIds.has(s.id) && (
                          <Text style={[Typography.caption, { color: Colors.status.warning, marginTop: 2 }]}>
                            ⚠ Conflito de horário
                          </Text>
                        )}
                      </View>
                      {s.confirmation ? (
                        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[s.confirmation.status] + '22' }]}>
                          <Text style={[Typography.micro, { color: STATUS_COLOR[s.confirmation.status] }]}>
                            {STATUS_LABEL[s.confirmation.status]}
                          </Text>
                        </View>
                      ) : (
                        <View style={[styles.statusBadge, { backgroundColor: colors.border }]}>
                          <Text style={[Typography.micro, { color: colors.textMuted }]}>Pendente</Text>
                        </View>
                      )}
                      <TouchableOpacity
                        onPress={() => handleDeleteSchedule(s.id, s.participant?.name ?? 'participante')}
                        hitSlop={8}
                        style={styles.deleteBtn}
                      >
                        <Trash2 size={16} color={Colors.status.danger} strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                  </Card>
                ))}
                <View style={{ marginTop: Spacing.md }}>
                  <Button
                    label="Adicionar à escala"
                    variant="outline"
                    icon={Plus}
                    onPress={() => router.push(`/events/${id}/add-schedule`)}
                  />
                </View>
              </>
            )}
          </>
        )}

        {/* ── EQUIPES ── */}
        {tab === 'equipes' && (
          <>
            {teams.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Sem equipes"
                subtitle="Crie equipes para organizar os participantes por função."
                actionLabel="Nova equipe"
                onAction={() => setTeamModalVisible(true)}
              />
            ) : (
              <>
                {teams.map((t) => (
                  <Card key={t.id}>
                    <View style={styles.scheduleRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[Typography.bodyStrong, { color: colors.text }]}>{t.name}</Text>
                        {t.type && <Text style={[Typography.caption, { color: colors.textMuted }]}>{t.type}</Text>}
                      </View>
                      <TouchableOpacity onPress={() => handleDeleteTeam(t.id, t.name)} hitSlop={8}>
                        <Trash2 size={16} color={Colors.status.danger} strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                  </Card>
                ))}
                <View style={{ marginTop: Spacing.md }}>
                  <Button label="Nova equipe" variant="outline" icon={Plus} onPress={() => setTeamModalVisible(true)} />
                </View>
              </>
            )}
          </>
        )}

        {/* ── CONFLITOS ── */}
        {tab === 'conflitos' && (
          <>
            {conflicts.length === 0 ? (
              <EmptyState
                icon={AlertTriangle}
                title="Sem conflitos"
                subtitle="Nenhuma sobreposição de horários detectada neste evento."
              />
            ) : (
              conflicts.map((cf) => (
                <Card key={cf.conflict_id} leftAccent={Colors.status.warning}>
                  <View style={{ gap: 4 }}>
                    <Text style={[Typography.bodyStrong, { color: colors.text }]}>
                      {cf.participant_name}
                    </Text>
                    <Text style={[Typography.caption, { color: colors.textMuted }]}>
                      {cf.schedule1_event}{cf.schedule1_role ? ` · ${cf.schedule1_role}` : ''}{cf.schedule1_start ? ` (${new Date(cf.schedule1_start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})` : ''}
                    </Text>
                    <Text style={[Typography.caption, { color: Colors.status.warning }]}>
                      ⚠ conflita com
                    </Text>
                    <Text style={[Typography.caption, { color: colors.textMuted }]}>
                      {cf.schedule2_event}{cf.schedule2_role ? ` · ${cf.schedule2_role}` : ''}{cf.schedule2_start ? ` (${new Date(cf.schedule2_start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})` : ''}
                    </Text>
                  </View>
                </Card>
              ))
            )}
          </>
        )}

        {/* ── CONVIDADOS / PRESENÇAS ── */}
        {tab === 'convidados' && (
          <>
            {participants.length === 0 ? (
              <EmptyState
                icon={UserCheck}
                title="Nenhum convidado ainda"
                subtitle="Compartilhe o código de convite para que participantes confirmem presença."
                actionLabel="Compartilhar convite"
                onAction={() => router.push(`/events/${id}/invite`)}
              />
            ) : (
              <>
                <View style={styles.presencaSummary}>
                  {[
                    { label: 'Confirmados', value: participants.filter((p) => p.attendance_status === 'confirmed').length, color: Colors.status.success },
                    { label: 'Pendentes', value: participants.filter((p) => p.attendance_status === 'pending').length, color: colors.textMuted },
                    { label: 'Não vão', value: participants.filter((p) => p.attendance_status === 'declined').length, color: Colors.status.danger },
                  ].map((item) => (
                    <View key={item.label} style={styles.presencaStat}>
                      <Text style={[Typography.titleMd, { color: item.color }]}>{item.value}</Text>
                      <Text style={[Typography.caption, { color: colors.textMuted }]}>{item.label}</Text>
                    </View>
                  ))}
                </View>
                {participants.map((p) => {
                  const isScheduled = scheduledParticipantIds.has(p.participant_id);
                  const statusColor =
                    p.attendance_status === 'confirmed' ? Colors.status.success
                    : p.attendance_status === 'declined' ? Colors.status.danger
                    : colors.textMuted;
                  const statusLabel =
                    p.attendance_status === 'confirmed' ? 'Confirmou'
                    : p.attendance_status === 'declined' ? 'Não vai'
                    : 'Pendente';
                  return (
                    <Card key={p.participant_id}>
                      <View style={{ gap: Spacing.sm }}>
                        <View style={styles.scheduleRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={[Typography.bodyStrong, { color: colors.text }]}>
                              {p.participant_name}
                            </Text>
                            {p.participant_phone ? (
                              <Text style={[Typography.caption, { color: colors.textMuted }]}>
                                {p.participant_phone}
                              </Text>
                            ) : null}
                          </View>
                          <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
                            <Text style={[Typography.micro, { color: statusColor }]}>{statusLabel}</Text>
                          </View>
                        </View>
                        <View style={styles.participantActions}>
                          <View style={[styles.statusBadge, { backgroundColor: isScheduled ? primary + '18' : colors.border }]}>
                            <Text style={[Typography.micro, { color: isScheduled ? primary : colors.textMuted }]}>
                              {isScheduled ? 'Na escala' : 'Sem função'}
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => handleScheduleParticipant(p)}
                            disabled={p.attendance_status === 'declined'}
                            style={[
                              styles.scheduleParticipantBtn,
                              {
                                borderColor: p.attendance_status === 'declined' ? colors.border : primary,
                                opacity: p.attendance_status === 'declined' ? 0.5 : 1,
                              },
                            ]}
                          >
                            <Plus size={14} color={p.attendance_status === 'declined' ? colors.textMuted : primary} strokeWidth={2} />
                            <Text style={[Typography.caption, { color: p.attendance_status === 'declined' ? colors.textMuted : primary }]}>
                              {isScheduled ? 'Adicionar função' : 'Escalar'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </Card>
                  );
                })}
              </>
            )}
          </>
        )}

        {/* ── INFO ── */}
        {tab === 'info' && (
          <View style={styles.infoSection}>
            <InfoRow icon={CalendarDays} label="Data" value={formatDate(event.start_date)} colors={colors} />
            {event.start_date && (
              <InfoRow icon={Clock} label="Horário"
                value={`${formatTime(event.start_date)}${event.end_date ? ` – ${formatTime(event.end_date)}` : ''}`}
                colors={colors}
              />
            )}
            {event.location && <InfoRow icon={MapPin} label="Local" value={event.location} colors={colors} />}
            {event.category && <InfoRow icon={Tag} label="Categoria" value={event.category} colors={colors} />}
            {event.description && (
              <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                <Text style={[Typography.caption, { color: colors.textMuted, width: 90 }]}>Descrição</Text>
                <Text style={[Typography.body, { color: colors.text, flex: 1 }]}>{event.description}</Text>
              </View>
            )}
            <View style={{ marginTop: Spacing.lg }}>
              <Button label="Editar evento" variant="outline" onPress={() => router.push(`/events/${id}/edit`)} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating share button */}
      <View style={[styles.floatingBar, { paddingBottom: Spacing.xl + insets.bottom }]}>
        <Button
          label="Compartilhar convite"
          variant="accent"
          icon={Share2}
          onPress={() => router.push(`/events/${id}/invite`)}
        />
      </View>

      {/* Options menu modal */}
      <Modal transparent visible={menuVisible} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity style={styles.menuOverlay} onPress={() => setMenuVisible(false)} activeOpacity={1}>
          <View style={[styles.menuBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => { setMenuVisible(false); router.push(`/events/${id}/edit`); }}
            >
              <Text style={[Typography.body, { color: colors.text }]}>Editar evento</Text>
            </TouchableOpacity>
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); handleArchive(); }}>
              <Text style={[Typography.body, { color: Colors.status.danger }]}>Arquivar evento</Text>
            </TouchableOpacity>
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); handleDeleteEvent(); }}>
              <Text style={[Typography.body, { color: Colors.status.danger }]}>Excluir permanentemente</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Email campaign modal */}
      <Modal transparent visible={emailModalVisible} animationType="slide" onRequestClose={() => !emailSending && setEmailModalVisible(false)}>
        <TouchableOpacity
          style={styles.menuOverlay}
          onPress={() => !emailSending && setEmailModalVisible(false)}
          activeOpacity={1}
        >
          <View style={[styles.sheetBox, { backgroundColor: colors.surface }]}>
            <Text style={[Typography.titleSm, { color: colors.text, marginBottom: Spacing.md }]}>
              Enviar convites por email
            </Text>
            <View style={{ gap: Spacing.sm, marginBottom: Spacing.lg }}>
              <View style={styles.emailSummaryRow}>
                <Text style={[Typography.body, { color: colors.textMuted }]}>Convocados</Text>
                <Text style={[Typography.bodyStrong, { color: colors.text }]}>{assignments.length}</Text>
              </View>
              <View style={styles.emailSummaryRow}>
                <Text style={[Typography.body, { color: colors.textMuted }]}>Com email</Text>
                <Text style={[Typography.bodyStrong, { color: colors.text }]}>
                  {assignments.filter((a) => a.invitee_email).length}
                </Text>
              </View>
              {emailCampaigns.length > 0 && (
                <View style={[styles.emailSummaryRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: Spacing.sm, marginTop: Spacing.xs }]}>
                  <Text style={[Typography.caption, { color: colors.textMuted }]}>Enviado anteriormente</Text>
                  <Text style={[Typography.caption, { color: colors.textSoft }]}>
                    {new Date(emailCampaigns[0].created_at).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[Typography.caption, { color: colors.textSoft, marginBottom: Spacing.lg }]}>
              Cada convocado receberá um email com os dados da própria convocação e o código de acesso ao evento.
            </Text>
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Button
                  label="Cancelar"
                  variant="ghost"
                  onPress={() => setEmailModalVisible(false)}
                  disabled={emailSending}
                />
              </View>
              <View style={{ flex: 1 }}>
                {emailSending ? (
                  <View style={[styles.sendingBtn, { backgroundColor: Colors.brand.primary }]}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={[Typography.bodyStrong, { color: '#fff' }]}>Enviando…</Text>
                  </View>
                ) : (
                  <Button label="Enviar" onPress={handleSendEmails} />
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* New team modal */}
      <Modal transparent visible={teamModalVisible} animationType="slide" onRequestClose={() => setTeamModalVisible(false)}>
        <TouchableOpacity style={styles.menuOverlay} onPress={() => setTeamModalVisible(false)} activeOpacity={1}>
          <View style={[styles.sheetBox, { backgroundColor: colors.surface }]}>
            <Text style={[Typography.titleSm, { color: colors.text, marginBottom: Spacing.md }]}>Nova equipe</Text>
            <TextInput
              style={[styles.sheetInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
              placeholder="Ex: Vocal, Mídia, Recepção"
              placeholderTextColor={colors.textSoft}
              value={newTeamName}
              onChangeText={setNewTeamName}
              autoFocus
            />
            <View style={{ marginTop: Spacing.md, flexDirection: 'row', gap: Spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Button label="Cancelar" variant="ghost" onPress={() => setTeamModalVisible(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="Criar" onPress={handleCreateTeam} loading={teamLoading} />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function InfoRow({ icon: Icon, label, value, colors }: { icon: any; label: string; value: string; colors: any }) {
  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
      <Icon size={16} color={colors.textMuted} strokeWidth={2} />
      <Text style={[Typography.caption, { color: colors.textMuted, width: 80, marginLeft: Spacing.xs }]}>{label}</Text>
      <Text style={[Typography.body, { color: colors.text, flex: 1 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  accentBar: { height: 4 },
  statsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingVertical: Spacing.md,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, marginVertical: Spacing.xs },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabContent: { padding: Spacing.lg, gap: Spacing.sm },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  deleteBtn: { padding: 4 },
  floatingBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    padding: Spacing.lg,
  },
  menuBox: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    alignSelf: 'flex-end',
    minWidth: 200,
    marginBottom: 80,
  },
  menuItem: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  menuDivider: { height: 1 },
  sheetBox: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  sheetInput: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Typography.body,
    minHeight: Layout.minTouchTarget,
  },
  presencaSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  presencaStat: { alignItems: 'center' },
  filterRow: {
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  emailSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sendingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    minHeight: Layout.minTouchTarget,
  },
  participantActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  scheduleParticipantBtn: {
    minHeight: 36,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  infoSection: { gap: Spacing.xs },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
});
