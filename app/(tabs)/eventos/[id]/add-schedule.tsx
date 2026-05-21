import { useCallback, useEffect, useRef, useState } from 'react';
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
import { Check, UserRound } from 'lucide-react-native';
import { createEventAssignment } from '@/lib/assignments';
import { fetchTeams } from '@/lib/teams';
import { searchOrgContacts, upsertOrgContact, type OrgContact } from '@/lib/contacts';
import type { Team } from '@/lib/types';
import { useOrganization } from '@/hooks/useOrganization';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, Radius, Layout } from '@/constants/Theme';
import { Button } from '@/components/Button';
import { ScreenHeader } from '@/components/ScreenHeader';
import { RolePicker } from '@/components/RolePicker';
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

  // Contact autocomplete
  const [suggestions, setSuggestions] = useState<OrgContact[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (org) fetchTeams(org.id).then(setTeams);
  }, [org]);

  // Debounced search while user types name
  const handleNameChange = useCallback(
    (text: string) => {
      setName(text);
      setSelectedContactId(null);
      if (searchDebounce.current) clearTimeout(searchDebounce.current);
      if (!org || text.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      searchDebounce.current = setTimeout(async () => {
        try {
          const results = await searchOrgContacts(org.id, text);
          setSuggestions(results);
          setShowSuggestions(results.length > 0);
        } catch {
          // silently ignore search errors
        }
      }, 250);
    },
    [org],
  );

  function selectContact(contact: OrgContact) {
    setName(contact.name);
    setEmail(contact.email ?? '');
    setPhone(contact.phone ?? '');
    if (contact.default_role) setRole(contact.default_role);
    setSelectedContactId(contact.id);
    setSuggestions([]);
    setShowSuggestions(false);
  }

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
      Alert.alert('Nome obrigatório', 'Informe o nome do escalado.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Email obrigatório', 'Informe o email que o escalado usará para acessar a escala.');
      return;
    }
    if (!id || !org) return;
    setLoading(true);
    try {
      // Salva escalação
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

      // Auto-salva contato silenciosamente (não bloqueia nem falha a operação)
      upsertOrgContact(org.id, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        default_role: role.trim() || undefined,
      }).catch(() => {});

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

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => setShowSuggestions(false)}
      >
        {/* ── Nome com autocomplete ── */}
        <Label>NOME DO ESCALADO *</Label>
        <View style={styles.autocompleteWrap}>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
            placeholder="Ex: Alexandre Silva"
            placeholderTextColor={colors.textSoft}
            value={name}
            onChangeText={handleNameChange}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
            autoFocus
          />
          {showSuggestions && suggestions.length > 0 && (
            <View style={[styles.suggestionList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {suggestions.map((contact) => (
                <TouchableOpacity
                  key={contact.id}
                  style={[styles.suggestionRow, { borderBottomColor: colors.border }]}
                  onPress={() => selectContact(contact)}
                  accessibilityRole="button"
                  accessibilityLabel={`Selecionar ${contact.name}`}
                >
                  <View style={[styles.suggestionAvatar, { backgroundColor: Colors.brand.primarySoft }]}>
                    <Text style={[Typography.caption, { color: Colors.brand.primary, fontWeight: '700' }]}>
                      {contact.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[Typography.bodyStrong, { color: colors.text }]} numberOfLines={1}>
                      {contact.name}
                    </Text>
                    <Text style={[Typography.caption, { color: colors.textMuted }]} numberOfLines={1}>
                      {[contact.default_role, contact.email].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  {selectedContactId === contact.id && (
                    <Check size={16} color={Colors.brand.primary} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ── Email ── */}
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
          onFocus={() => setShowSuggestions(false)}
        />

        {/* ── Telefone ── */}
        <Label mt>TELEFONE</Label>
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
          placeholder="+55 11 99999-9999"
          placeholderTextColor={colors.textSoft}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          onFocus={() => setShowSuggestions(false)}
        />

        {/* ── Equipe ── */}
        {teams.length > 0 && (
          <>
            <Label mt>EQUIPE</Label>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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

        {/* ── Função (RolePicker) ── */}
        <Label mt>FUNÇÃO</Label>
        <RolePicker value={role} onChange={setRole} placeholder="Selecionar função..." />

        {/* ── Horário específico ── */}
        <TouchableOpacity
          style={[styles.toggleRow, { borderColor: colors.border }]}
          onPress={() => setUseCustomTime(!useCustomTime)}
        >
          <View style={[styles.checkbox, { borderColor: useCustomTime ? primary : colors.border, backgroundColor: useCustomTime ? primary : 'transparent' }]} />
          <Text style={[Typography.body, { color: colors.text, marginLeft: Spacing.sm }]}>
            Horário específico para esta convocação
          </Text>
        </TouchableOpacity>

        {useCustomTime && (
          <View style={styles.timeRow}>
            <View style={styles.timeCol}>
              <Label>INÍCIO</Label>
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

        {/* ── Observações ── */}
        <Label mt>OBSERVAÇÕES</Label>
        <TextInput
          style={[styles.input, styles.textarea, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
          placeholder="Ex: Chegar 30 min antes para passagem de som"
          placeholderTextColor={colors.textSoft}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          onFocus={() => setShowSuggestions(false)}
        />

        <View style={{ marginTop: Spacing.xl }}>
          <Button label="Salvar convocação" onPress={handleSave} loading={loading} />
        </View>

        {/* Link rápido para a agenda de contatos */}
        <TouchableOpacity
          style={styles.contactsLink}
          onPress={() => router.push('/contatos' as any)}
          accessibilityRole="button"
          accessibilityLabel="Gerenciar agenda de contatos"
        >
          <UserRound size={14} color={colors.textMuted} strokeWidth={2} />
          <Text style={[Typography.caption, { color: colors.textMuted }]}>
            Gerenciar agenda de contatos
          </Text>
        </TouchableOpacity>
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
  autocompleteWrap: {
    position: 'relative',
    zIndex: 10,
  },
  suggestionList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: Radius.md,
    borderBottomRightRadius: Radius.md,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 20,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 52,
    borderBottomWidth: 1,
  },
  suggestionAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
});
