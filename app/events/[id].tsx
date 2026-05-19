import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  CalendarDays, MapPin, MoreVertical, Plus, Share2, Tag,
  Users, ClipboardList, Info, Trash2, Clock,
} from 'lucide-react-native';
import { fetchEventById, archiveEvent } from '@/lib/events';
import { fetchTeams, createTeam, deleteTeam } from '@/lib/teams';
import { fetchSchedules, deleteSchedule } from '@/lib/schedules';
import type { Event, Team, Schedule } from '@/lib/types';
import { useOrganization } from '@/hooks/useOrganization';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, Radius, Layout } from '@/constants/Theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { EmptyState } from '@/components/EmptyState';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';

type Tab = 'escala' | 'equipes' | 'info';

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

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { org } = useOrganization();
  const { colors } = useColorScheme();

  const [event, setEvent] = useState<Event | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [tab, setTab] = useState<Tab>('escala');
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  // New team modal
  const [teamModalVisible, setTeamModalVisible] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [teamLoading, setTeamLoading] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const [ev, sc] = await Promise.all([
      fetchEventById(id),
      fetchSchedules(id),
    ]);
    setEvent(ev);
    setSchedules(sc);
    if (org) {
      const t = await fetchTeams(org.id);
      setTeams(t);
    }
  }, [id, org]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  async function handleArchive() {
    Alert.alert('Arquivar evento', 'Tem certeza? O evento não aparecerá mais na lista.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Arquivar', style: 'destructive', onPress: async () => {
          await archiveEvent(id!);
          router.back();
        },
      },
    ]);
  }

  async function handleDeleteSchedule(scheduleId: string, name: string) {
    Alert.alert('Remover da escala', `Remover ${name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive', onPress: async () => {
          await deleteSchedule(scheduleId);
          setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
        },
      },
    ]);
  }

  async function handleDeleteTeam(teamId: string, name: string) {
    Alert.alert('Remover equipe', `Remover a equipe "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive', onPress: async () => {
          await deleteTeam(teamId);
          setTeams((prev) => prev.filter((t) => t.id !== teamId));
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

  const primary = Colors.brand.primary;

  // Count confirmations
  const confirmed = schedules.filter((s) => s.confirmation?.status === 'confirmed').length;
  const pending = schedules.filter((s) => !s.confirmation).length;

  if (!event) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Evento" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={[Typography.body, { color: colors.textMuted }]}>Carregando...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title={event.title}
        right={
          <TouchableOpacity onPress={() => setMenuVisible(true)} hitSlop={8}>
            <MoreVertical size={22} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
        }
      />

      {/* Color accent bar */}
      <View style={[styles.accentBar, { backgroundColor: event.color }]} />

      {/* Stats row */}
      <View style={[styles.statsRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.statItem}>
          <Text style={[Typography.titleMd, { color: Colors.status.success }]}>{confirmed}</Text>
          <Text style={[Typography.caption, { color: colors.textMuted }]}>Confirmados</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[Typography.titleMd, { color: colors.text }]}>{pending}</Text>
          <Text style={[Typography.caption, { color: colors.textMuted }]}>Pendentes</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[Typography.titleMd, { color: colors.text }]}>{schedules.length}</Text>
          <Text style={[Typography.caption, { color: colors.textMuted }]}>Total</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {(['escala', 'equipes', 'info'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && { borderBottomColor: primary, borderBottomWidth: 2 }]}
            onPress={() => setTab(t)}
          >
            {t === 'escala' && <ClipboardList size={16} color={tab === t ? primary : colors.textMuted} strokeWidth={2} />}
            {t === 'equipes' && <Users size={16} color={tab === t ? primary : colors.textMuted} strokeWidth={2} />}
            {t === 'info' && <Info size={16} color={tab === t ? primary : colors.textMuted} strokeWidth={2} />}
            <Text style={[Typography.caption, { color: tab === t ? primary : colors.textMuted, marginLeft: 4, textTransform: 'capitalize' }]}>
              {t === 'escala' ? 'Escala' : t === 'equipes' ? 'Equipes' : 'Info'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.tabContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
      >
        {/* ── ESCALA ── */}
        {tab === 'escala' && (
          <>
            {schedules.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="Escala vazia"
                subtitle="Adicione participantes para montar a escala deste evento."
                actionLabel="Adicionar à escala"
                onAction={() => router.push(`/events/${id}/add-schedule`)}
              />
            ) : (
              <>
                {schedules.map((s) => (
                  <Card key={s.id} leftAccent={s.team ? undefined : colors.border}>
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
      <View style={styles.floatingBar}>
        <Button
          label="Compartilhar convite"
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabContent: { padding: Spacing.lg, paddingBottom: 120, gap: Spacing.sm },
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
    paddingBottom: Spacing.xl,
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
  infoSection: { gap: Spacing.xs },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
});
