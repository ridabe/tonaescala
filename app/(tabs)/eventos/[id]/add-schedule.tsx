import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createEventAssignment } from '@/lib/assignments';
import { fetchTeams } from '@/lib/teams';
import type { Team } from '@/lib/types';
import { useOrganization } from '@/hooks/useOrganization';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, Radius, Layout } from '@/constants/Theme';
import { Button } from '@/components/Button';
import { ScreenHeader } from '@/components/ScreenHeader';
import { analytics } from '@/lib/analytics';
import { toDatabaseTimestamp } from '@/lib/datetime';

function displayTime(d: Date) {
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

type PickerTarget = 'start' | 'end' | null;

function readParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default function AddScheduleScreen() {
  const params = useLocalSearchParams<{
    id: string;
    participant_id?: string;
    participant_name?: string;
    participant_phone?: string;
  }>();
  const id = readParam(params.id);
  const existingParticipantName = readParam(params.participant_name) ?? '';
  const existingParticipantPhone = readParam(params.participant_phone) ?? '';
  const { org } = useOrganization();
  const { colors } = useColorScheme();

  const [teams, setTeams] = useState<Team[]>([]);
  const [name, setName] = useState(existingParticipantName);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(existingParticipantPhone);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [role, setRole] = useState('');
  const [notes, setNotes] = useState('');
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(() => { const d = new Date(); d.setHours(d.getHours() + 2); return d; });
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (org) fetchTeams(org.id).then(setTeams);
  }, [org]);

  function handlePickerChange(_: unknown, selected?: Date) {
    if (!selected) { setPickerTarget(null); return; }
    if (pickerTarget === 'start') {
      const merged = new Date(startTime);
      merged.setHours(selected.getHours(), selected.getMinutes());
      setStartTime(merged);
    } else {
      const merged = new Date(endTime);
      merged.setHours(selected.getHours(), selected.getMinutes());
      setEndTime(merged);
    }
    setPickerTarget(null);
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Nome obrigatorio', 'Informe o nome do escalado.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Email obrigatorio', 'Informe o email que o escalado usara para acessar a escala.');
      return;
    }
    if (!id) return;
    setLoading(true);
    try {
      const assignmentId = await createEventAssignment({
        eventId: id,
        teamId: selectedTeam || undefined,
        inviteeName: name.trim(),
        inviteeEmail: email.trim(),
        inviteePhone: phone.trim() || undefined,
        role: role.trim() || undefined,
        notes: notes.trim() || undefined,
        arrivalTime: useCustomTime ? toDatabaseTimestamp(startTime) : undefined,
        startTime: useCustomTime ? toDatabaseTimestamp(startTime) : undefined,
        endTime: useCustomTime ? toDatabaseTimestamp(endTime) : undefined,
      });
      analytics.track('assignment_created', { event_id: id, assignment_id: assignmentId });
      router.back();
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setLoading(false);
    }
  }

  const primary = Colors.brand.primary;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader title="Adicionar escalado" fallbackHref={`/eventos/${id}`} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Label>NOME DO ESCALADO *</Label>
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
          placeholder="Ex: Alexandre Silva"
          placeholderTextColor={colors.textSoft}
          value={name}
          onChangeText={setName}
          autoFocus
        />

        <Label mt>EMAIL *</Label>
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
          placeholder="alexandre@email.com"
          placeholderTextColor={colors.textSoft}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Label mt>TELEFONE</Label>
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
          placeholder="+55 11 99999-9999"
          placeholderTextColor={colors.textSoft}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        {teams.length > 0 && (
          <>
            <Label mt>EQUIPE</Label>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 0 }}>
              <TouchableOpacity
                onPress={() => setSelectedTeam('')}
                style={[styles.chip, { borderColor: !selectedTeam ? primary : colors.border, backgroundColor: !selectedTeam ? primary + '18' : colors.surface }]}
              >
                <Text style={[Typography.caption, { color: !selectedTeam ? primary : colors.textMuted }]}>Nenhuma</Text>
              </TouchableOpacity>
              {teams.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => setSelectedTeam(t.id)}
                  style={[styles.chip, { borderColor: selectedTeam === t.id ? primary : colors.border, backgroundColor: selectedTeam === t.id ? primary + '18' : colors.surface }]}
                >
                  <Text style={[Typography.caption, { color: selectedTeam === t.id ? primary : colors.textMuted }]}>{t.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        <Label mt>FUNCAO</Label>
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
          placeholder="Ex: Vocal Soprano, Guitarra, Recepcao"
          placeholderTextColor={colors.textSoft}
          value={role}
          onChangeText={setRole}
        />

        <TouchableOpacity
          style={[styles.toggleRow, { borderColor: colors.border }]}
          onPress={() => setUseCustomTime(!useCustomTime)}
        >
          <View style={[styles.checkbox, { borderColor: useCustomTime ? primary : colors.border, backgroundColor: useCustomTime ? primary : 'transparent' }]} />
          <Text style={[Typography.body, { color: colors.text, marginLeft: Spacing.sm }]}>
            Horario especifico para esta convocacao
          </Text>
        </TouchableOpacity>

        {useCustomTime && (
          <View style={styles.timeRow}>
            <View style={styles.timeCol}>
              <Label>INICIO</Label>
              <TouchableOpacity
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, justifyContent: 'center' }]}
                onPress={() => setPickerTarget('start')}
              >
                <Text style={[Typography.body, { color: colors.text }]}>{displayTime(startTime)}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.timeCol}>
              <Label>FIM</Label>
              <TouchableOpacity
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, justifyContent: 'center' }]}
                onPress={() => setPickerTarget('end')}
              >
                <Text style={[Typography.body, { color: colors.text }]}>{displayTime(endTime)}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Label mt>OBSERVACOES</Label>
        <TextInput
          style={[styles.input, styles.textarea, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
          placeholder="Ex: Chegar 30 min antes para passagem de som"
          placeholderTextColor={colors.textSoft}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <View style={{ marginTop: Spacing.xl }}>
          <Button label="Salvar convocacao" onPress={handleSave} loading={loading} />
        </View>
      </ScrollView>

      {pickerTarget && (
        <DateTimePicker
          value={pickerTarget === 'end' ? endTime : startTime}
          mode="time"
          is24Hour
          onChange={handlePickerChange}
          display="default"
        />
      )}
    </KeyboardAvoidingView>
  );
}

function Label({ children, mt }: { children: string; mt?: boolean }) {
  const { colors } = useColorScheme();
  return (
    <Text style={[Typography.caption, { color: colors.textMuted, letterSpacing: 0.5, marginBottom: Spacing.xs, marginTop: mt ? Spacing.md : 0 }]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Typography.body,
    minHeight: Layout.minTouchTarget,
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  chip: { borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, marginRight: Spacing.xs },
  timeRow: { flexDirection: 'row', gap: Spacing.md },
  timeCol: { flex: 1 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginVertical: Spacing.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: Radius.xs,
    borderWidth: 2,
  },
});
