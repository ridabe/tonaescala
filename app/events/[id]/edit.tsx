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
import { fetchEventById, updateEvent } from '@/lib/events';
import type { Event } from '@/lib/types';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, Radius, Layout } from '@/constants/Theme';
import { Button } from '@/components/Button';
import { ScreenHeader } from '@/components/ScreenHeader';

const CATEGORIES = ['Culto', 'Ensaio', 'Conferência', 'Reunião', 'Outro'];
const EVENT_COLORS = ['#2563EB', '#0F766E', '#16A34A', '#D97706', '#DC2626', '#7C3AED'];

function pad(n: number) { return String(n).padStart(2, '0'); }
function toISOLocal(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}
function displayDate(d: Date) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function displayTime(d: Date) {
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

type PickerTarget = 'start_date' | 'start_time' | 'end_time' | null;

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useColorScheme();

  const [event, setEvent] = useState<Event | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(EVENT_COLORS[0]);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchEventById(id).then((ev) => {
      if (!ev) return;
      setEvent(ev);
      setTitle(ev.title);
      setCategory(ev.category ?? '');
      setLocation(ev.location ?? '');
      setDescription(ev.description ?? '');
      setColor(ev.color);
      setStartDate(new Date(ev.start_date));
      if (ev.end_date) setEndDate(new Date(ev.end_date));
    });
  }, [id]);

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
    if (!title.trim() || !id) { Alert.alert('Título obrigatório'); return; }
    setLoading(true);
    try {
      await updateEvent(id, {
        title: title.trim(),
        category: category || undefined,
        location: location.trim() || undefined,
        description: description.trim() || undefined,
        color,
        start_date: toISOLocal(startDate),
        end_date: toISOLocal(endDate),
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Erro ao salvar', e.message);
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
      <ScreenHeader title="Editar evento" />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Label>TÍTULO *</Label>
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
          value={title}
          onChangeText={setTitle}
          placeholder="Nome do evento"
          placeholderTextColor={colors.textSoft}
        />

        <Label mt>CATEGORIA</Label>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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

        <Label mt>LOCAL</Label>
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
          value={location}
          onChangeText={setLocation}
          placeholder="Local do evento"
          placeholderTextColor={colors.textSoft}
        />

        <Label mt>DATA *</Label>
        <TouchableOpacity
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, justifyContent: 'center' }]}
          onPress={() => setPickerTarget('start_date')}
        >
          <Text style={[Typography.body, { color: colors.text }]}>{displayDate(startDate)}</Text>
        </TouchableOpacity>

        <View style={styles.timeRow}>
          <View style={styles.timeCol}>
            <Label>INÍCIO</Label>
            <TouchableOpacity style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, justifyContent: 'center' }]} onPress={() => setPickerTarget('start_time')}>
              <Text style={[Typography.body, { color: colors.text }]}>{displayTime(startDate)}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.timeCol}>
            <Label>FIM</Label>
            <TouchableOpacity style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, justifyContent: 'center' }]} onPress={() => setPickerTarget('end_time')}>
              <Text style={[Typography.body, { color: colors.text }]}>{displayTime(endDate)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Label mt>COR</Label>
        <View style={styles.colorRow}>
          {EVENT_COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setColor(c)}
              style={[styles.colorDot, { backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: '#FFF', elevation: color === c ? 6 : 0 }]}
            />
          ))}
        </View>

        <Label mt>DESCRIÇÃO</Label>
        <TextInput
          style={[styles.input, styles.textarea, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
          value={description}
          onChangeText={setDescription}
          placeholder="Informações adicionais"
          placeholderTextColor={colors.textSoft}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <View style={{ marginTop: Spacing.xl }}>
          <Button label="Salvar alterações" onPress={handleSave} loading={loading} />
        </View>
      </ScrollView>

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
  colorRow: { flexDirection: 'row', gap: Spacing.md },
  colorDot: { width: 32, height: 32, borderRadius: Radius.full },
});
