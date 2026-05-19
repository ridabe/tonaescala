import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AlarmClock, CalendarDays, CheckCircle2, Clock, Users, XCircle } from 'lucide-react-native';
import { confirmSchedule } from '@/lib/participants';
import { useParticipant } from '@/hooks/useParticipant';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, Radius } from '@/constants/Theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import type { ConfirmationStatus } from '@/lib/types';

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
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });
}
function formatTime(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function ScheduleDetailScreen() {
  const {
    id: scheduleId,
    event_title,
    event_start_date,
    team_name,
    role,
    start_time,
    end_time,
    notes,
    confirmation_status: initialStatus,
    has_conflict,
  } = useLocalSearchParams<{
    id: string;
    event_title: string;
    event_start_date: string;
    team_name: string;
    role: string;
    start_time: string;
    end_time: string;
    notes: string;
    confirmation_status: string;
    has_conflict: string;
  }>();

  const { session } = useParticipant();
  const { colors } = useColorScheme();
  const [status, setStatus] = useState<string>(initialStatus ?? '');
  const [loadingAction, setLoadingAction] = useState<ConfirmationStatus | null>(null);

  const conflict = has_conflict === '1';
  const displayRole = [team_name, role].filter(Boolean).join(' · ');

  async function handleConfirm(newStatus: ConfirmationStatus) {
    if (!session || !scheduleId) return;
    setLoadingAction(newStatus);
    try {
      await confirmSchedule(scheduleId, session.participantId, session.token, newStatus);
      setStatus(newStatus);
    } catch (e: any) {
      Alert.alert('Erro', e.message ?? 'Não foi possível salvar sua resposta.');
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Minha escala" />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[Typography.titleMd, { color: colors.text, marginBottom: Spacing.sm }]}>
          {event_title}
        </Text>

        {event_start_date ? (
          <View style={styles.infoRow}>
            <CalendarDays size={16} color={colors.textMuted} strokeWidth={2} />
            <Text style={[Typography.body, { color: colors.text, flex: 1 }]}>
              {formatDate(event_start_date)}
            </Text>
          </View>
        ) : null}

        {start_time ? (
          <View style={styles.infoRow}>
            <Clock size={16} color={colors.textMuted} strokeWidth={2} />
            <Text style={[Typography.body, { color: colors.text, flex: 1 }]}>
              {formatTime(start_time)}{end_time ? ` – ${formatTime(end_time)}` : ''}
            </Text>
          </View>
        ) : null}

        {displayRole ? (
          <View style={styles.infoRow}>
            <Users size={16} color={colors.textMuted} strokeWidth={2} />
            <Text style={[Typography.body, { color: colors.text, flex: 1 }]}>{displayRole}</Text>
          </View>
        ) : null}

        {notes ? (
          <View style={[styles.notesBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[Typography.caption, { color: colors.textMuted, marginBottom: 4 }]}>Observações</Text>
            <Text style={[Typography.body, { color: colors.text }]}>{notes}</Text>
          </View>
        ) : null}

        {conflict ? (
          <View style={[styles.alertBox, { backgroundColor: Colors.status.warning + '1A', borderColor: Colors.status.warning }]}>
            <Text style={[Typography.caption, { color: Colors.status.warning }]}>
              ⚠ Este horário conflita com outro compromisso na sua agenda.
            </Text>
          </View>
        ) : null}

        {status ? (
          <View style={[styles.statusBanner, { backgroundColor: STATUS_COLOR[status] + '1A' }]}>
            <Text style={[Typography.bodyStrong, { color: STATUS_COLOR[status] }]}>
              {STATUS_LABEL[status]}
            </Text>
          </View>
        ) : null}

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Text style={[Typography.caption, { color: colors.textMuted, marginBottom: Spacing.md }]}>
          {status ? 'Alterar confirmação:' : 'Confirme sua presença:'}
        </Text>

        <View style={styles.actions}>
          <ActionBtn
            icon={CheckCircle2}
            label="Confirmar"
            color={Colors.status.success}
            selected={status === 'confirmed'}
            loading={loadingAction === 'confirmed'}
            onPress={() => handleConfirm('confirmed')}
            colors={colors}
          />
          <ActionBtn
            icon={AlarmClock}
            label="Atrasarei"
            color={Colors.status.warning}
            selected={status === 'late'}
            loading={loadingAction === 'late'}
            onPress={() => handleConfirm('late')}
            colors={colors}
          />
          <ActionBtn
            icon={XCircle}
            label="Recusar"
            color={Colors.status.danger}
            selected={status === 'declined'}
            loading={loadingAction === 'declined'}
            onPress={() => handleConfirm('declined')}
            colors={colors}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  color,
  selected,
  loading,
  onPress,
  colors,
}: {
  icon: any;
  label: string;
  color: string;
  selected: boolean;
  loading: boolean;
  onPress: () => void;
  colors: any;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.actionBtn,
        {
          backgroundColor: selected ? color + '1A' : colors.surface,
          borderColor: selected ? color : colors.border,
        },
      ]}
      onPress={onPress}
      disabled={!!loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <Icon size={24} color={color} strokeWidth={selected ? 2.5 : 2} />
      )}
      <Text style={[Typography.caption, { color: selected ? color : colors.textMuted, marginTop: 4 }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  notesBox: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: Spacing.md,
  },
  alertBox: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: Spacing.md,
  },
  statusBanner: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  divider: { height: 1, marginVertical: Spacing.lg },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    minHeight: 80,
    gap: 4,
  },
});
