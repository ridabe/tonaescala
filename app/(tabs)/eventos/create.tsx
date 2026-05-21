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
import { Music, Plus, X, FolderOpen } from 'lucide-react-native';
import { createEvent, generateInvite, fetchEventById } from '@/lib/events';
import { setEventSongs, fetchSongs, type Song } from '@/lib/songs';
import type { Event } from '@/lib/types';
import { useOrganization } from '@/hooks/useOrganization';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, Radius, Layout } from '@/constants/Theme';
import { Button } from '@/components/Button';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SongSelector } from '@/components/SongSelector';
import { analytics } from '@/lib/analytics';
import { toDatabaseTimestamp } from '@/lib/datetime';

const CATEGORIES = ['Culto', 'Ensaio', 'Conferência', 'Reunião', 'Outro'];
const EVENT_COLORS = ['#2563EB', '#0F766E', '#16A34A', '#D97706', '#DC2626', '#7C3AED'];

function displayDate(d: Date) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function displayTime(d: Date) {
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

type PickerTarget = 'start_date' | 'start_time' | 'end_time' | null;

export default function CreateEventScreen() {
  const { org } = useOrganization();
  const { colors } = useColorScheme();
  const { parentId } = useLocalSearchParams<{ parentId?: string }>();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(EVENT_COLORS[0]);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(() => { const d = new Date(); d.setHours(d.getHours() + 2); return d; });
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [loading, setLoading] = useState(false);
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [parentEvent, setParentEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (org) fetchSongs(org.id).then(setAllSongs).catch(() => {});
  }, [org]);

  useEffect(() => {
    if (parentId) {
      fetchEventById(parentId).then(setParentEvent).catch(() => {});
    }
  }, [parentId]);

  function handlePickerChange(_: unknown, selected?: Date) {
    if (!selected) { setPickerTarget(null); return; }
    if (pickerTarget === 'start_date') {
      const merged = new Date(selected);
      merged.setHours(startDate.getHours(), startDate.getMinutes());
      setStartDate(merged);
      const mergedEnd = new Date(selected);
      mergedEnd.setHours(endDate.getHours(), endDate.getMinutes());
      setEndDate(mergedEnd);
    } else if (pickerTarget === 'start_time') {
      const merged = new Date(startDate);
      merged.setHours(selected.getHours(), selected.getMinutes());
      setStartDate(merged);
    } else if (pickerTarget === 'end_time') {
      const merged = new Date(endDate);
      merged.setHours(selected.getHours(), selected.getMinutes());
      setEndDate(merged);
    }
    setPickerTarget(null);
  }

  async function handleSave() {
    if (!title.trim()) { Alert.alert('Título obrigatório'); return; }
    if (!org) { Alert.alert('Erro', 'Organização não encontrada.'); return; }
    setLoading(true);
    try {
      const ev = await createEvent({
        organization_id: org.id,
        parent_event_id: parentId || undefined,
        title: title.trim(),
        category: category || undefined,
        location: location.trim() || undefined,
        description: description.trim() || undefined,
        color,
        start_date: toDatabaseTimestamp(startDate),
        end_date: toDatabaseTimestamp(endDate),
      });
      await generateInvite(ev.id);
      if (selectedSongIds.length > 0) {
        await setEventSongs(ev.id, selectedSongIds);
      }
      analytics.track('event_created', { event_id: ev.id, organization_id: org.id });
      router.replace(`/eventos/${ev.id}`);
    } catch (e: any) {
      Alert.alert('Erro ao criar evento', e.message);
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
      <ScreenHeader
        title={parentEvent ? 'Novo sub-evento' : 'Novo evento'}
        fallbackHref={parentEvent ? `/eventos/${parentEvent.id}` : '/(tabs)/eventos'}
      />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Evento mestre (somente se for sub-evento) */}
        {parentEvent && (
          <View style={[styles.parentBanner, { backgroundColor: parentEvent.color + '18', borderColor: parentEvent.color + '44' }]}>
            <FolderOpen size={16} color={parentEvent.color} strokeWidth={2} />
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <Text style={[Typography.micro, { color: parentEvent.color, fontWeight: '700', letterSpacing: 0.5 }]}>
                EVENTO MESTRE
              </Text>
              <Text style={[Typography.bodyStrong, { color: parentEvent.color }]} numberOfLines={1}>
                {parentEvent.title}
              </Text>
            </View>
          </View>
        )}

        {/* Título */}
        <Label mt={!!parentEvent}>TÍTULO *</Label>
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
          placeholder="Ex: Culto de Domingo"
          placeholderTextColor={colors.textSoft}
          value={title}
          onChangeText={setTitle}
          autoFocus
        />

        {/* Categoria */}
        <Label mt>CATEGORIA</Label>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setCategory(category === c ? '' : c)}
              style={[styles.chip, { borderColor: category === c ? primary : colors.border, backgroundColor: category === c ? primary + '18' : colors.surface }]}
            >
              <Text style={[Typography.caption, { color: category === c ? primary : colors.textMuted }]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Local */}
        <Label mt>LOCAL</Label>
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
          placeholder="Ex: Templo principal"
          placeholderTextColor={colors.textSoft}
          value={location}
          onChangeText={setLocation}
        />

        {/* Data e horários */}
        <Label mt>DATA *</Label>
        <TouchableOpacity
          style={[styles.input, styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setPickerTarget('start_date')}
        >
          <Text style={[Typography.body, { color: colors.text }]}>{displayDate(startDate)}</Text>
        </TouchableOpacity>

        <View style={styles.timeRow}>
          <View style={styles.timeCol}>
            <Label>INÍCIO *</Label>
            <TouchableOpacity
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setPickerTarget('start_time')}
            >
              <Text style={[Typography.body, { color: colors.text }]}>{displayTime(startDate)}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.timeCol}>
            <Label>FIM</Label>
            <TouchableOpacity
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setPickerTarget('end_time')}
            >
              <Text style={[Typography.body, { color: colors.text }]}>{displayTime(endDate)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cor */}
        <Label mt>COR</Label>
        <View style={styles.colorRow}>
          {EVENT_COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setColor(c)}
              style={[styles.colorDot, { backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: '#FFF', shadowColor: c, shadowOpacity: color === c ? 0.5 : 0, shadowRadius: 4, shadowOffset: { width: 0, height: 0 }, elevation: color === c ? 6 : 0 }]}
            />
          ))}
        </View>

        {/* Descrição */}
        <Label mt>DESCRIÇÃO</Label>
        <TextInput
          style={[styles.input, styles.textarea, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
          placeholder="Informações adicionais do evento"
          placeholderTextColor={colors.textSoft}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* Músicas */}
        <Label mt>MÚSICAS DO EVENTO</Label>
        <TouchableOpacity
          style={[styles.addSongsBtn, { borderColor: primary, backgroundColor: primary + '10' }]}
          onPress={() => setSelectorVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Adicionar músicas"
        >
          <Music size={18} color={primary} strokeWidth={2} />
          <Text style={[Typography.bodyStrong, { color: primary, flex: 1, marginLeft: Spacing.sm }]}>
            {selectedSongIds.length === 0
              ? 'Adicionar músicas'
              : `${selectedSongIds.length} música${selectedSongIds.length === 1 ? '' : 's'} selecionada${selectedSongIds.length === 1 ? '' : 's'}`}
          </Text>
          <Plus size={18} color={primary} strokeWidth={2.5} />
        </TouchableOpacity>
        {selectedSongIds.length > 0 && (
          <View style={styles.selectedSongs}>
            {selectedSongIds.map((sid) => {
              const s = allSongs.find((x) => x.id === sid);
              if (!s) return null;
              return (
                <View key={sid} style={[styles.songChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[Typography.caption, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                    {s.title}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setSelectedSongIds((prev) => prev.filter((x) => x !== sid))}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Remover ${s.title}`}
                  >
                    <X size={14} color={colors.textMuted} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ marginTop: Spacing.xl }}>
          <Button label="Salvar evento" onPress={handleSave} loading={loading} />
        </View>
      </ScrollView>

      <SongSelector
        visible={selectorVisible}
        orgId={org?.id ?? ''}
        selectedIds={selectedSongIds}
        onConfirm={setSelectedSongIds}
        onClose={() => setSelectorVisible(false)}
      />

      {pickerTarget && (
        <DateTimePicker
          value={pickerTarget === 'end_time' ? endDate : startDate}
          mode={pickerTarget === 'start_date' ? 'date' : 'time'}
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
  parentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Typography.body,
    minHeight: Layout.minTouchTarget,
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', marginBottom: 0 },
  chip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginRight: Spacing.xs,
  },
  timeRow: { flexDirection: 'row', gap: Spacing.md },
  timeCol: { flex: 1 },
  colorRow: { flexDirection: 'row', gap: Spacing.md },
  colorDot: { width: 32, height: 32, borderRadius: Radius.full },
  addSongsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: Layout.minTouchTarget,
    borderStyle: 'dashed',
  },
  selectedSongs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  songChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    maxWidth: 200,
  },
});
