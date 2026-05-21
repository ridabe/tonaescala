import { useState } from 'react';
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
import { router } from 'expo-router';
import { Minus, Plus } from 'lucide-react-native';
import { useOrganization } from '@/hooks/useOrganization';
import { useColorScheme } from '@/hooks/useColorScheme';
import { createSong } from '@/lib/songs';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, Radius, Layout } from '@/constants/Theme';
import { Button } from '@/components/Button';
import { ScreenHeader } from '@/components/ScreenHeader';

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export default function NovaMusicaScreen() {
  const { org } = useOrganization();
  const { colors } = useColorScheme();
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [defaultKey, setDefaultKey] = useState('');
  const [maleKey, setMaleKey] = useState('');
  const [femaleKey, setFemaleKey] = useState('');
  const [chords, setChords] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [notes, setNotes] = useState('');
  const [links, setLinks] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);

  function addLink() {
    if (links.length < 4) setLinks((prev) => [...prev, '']);
  }
  function removeLink(index: number) {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  }
  function updateLink(index: number, value: string) {
    setLinks((prev) => prev.map((l, i) => (i === index ? value : l)));
  }

  async function handleSave() {
    if (!title.trim()) { Alert.alert('Título obrigatório'); return; }
    if (!org) { Alert.alert('Erro', 'Organização não encontrada.'); return; }
    setLoading(true);
    try {
      await createSong({
        org_id: org.id,
        title: title.trim(),
        artist: artist.trim() || undefined,
        default_key: defaultKey || undefined,
        male_key: maleKey || undefined,
        female_key: femaleKey || undefined,
        chords: chords.trim() || undefined,
        lyrics: lyrics.trim() || undefined,
        notes: notes.trim() || undefined,
        links: links.map((l) => l.trim()).filter(Boolean),
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Erro ao salvar', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader title="Nova música" fallbackHref="/musicas" />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <SongForm
          title={title} setTitle={setTitle}
          artist={artist} setArtist={setArtist}
          defaultKey={defaultKey} setDefaultKey={setDefaultKey}
          maleKey={maleKey} setMaleKey={setMaleKey}
          femaleKey={femaleKey} setFemaleKey={setFemaleKey}
          chords={chords} setChords={setChords}
          lyrics={lyrics} setLyrics={setLyrics}
          notes={notes} setNotes={setNotes}
          links={links}
          addLink={addLink}
          removeLink={removeLink}
          updateLink={updateLink}
          colors={colors}
        />

        <View style={{ marginTop: Spacing.xl }}>
          <Button label="Salvar música" onPress={handleSave} loading={loading} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function SongForm({
  title, setTitle,
  artist, setArtist,
  defaultKey, setDefaultKey,
  maleKey, setMaleKey,
  femaleKey, setFemaleKey,
  chords, setChords,
  lyrics, setLyrics,
  notes, setNotes,
  links, addLink, removeLink, updateLink,
  colors,
}: {
  title: string; setTitle: (v: string) => void;
  artist: string; setArtist: (v: string) => void;
  defaultKey: string; setDefaultKey: (v: string) => void;
  maleKey: string; setMaleKey: (v: string) => void;
  femaleKey: string; setFemaleKey: (v: string) => void;
  chords: string; setChords: (v: string) => void;
  lyrics: string; setLyrics: (v: string) => void;
  notes: string; setNotes: (v: string) => void;
  links: string[];
  addLink: () => void;
  removeLink: (i: number) => void;
  updateLink: (i: number, v: string) => void;
  colors: any;
}) {
  const primary = Colors.brand.primary;

  return (
    <>
      <Label>TÍTULO *</Label>
      <TextInput
        style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
        placeholder="Ex: Quão Grande É o Meu Deus"
        placeholderTextColor={colors.textSoft}
        value={title}
        onChangeText={setTitle}
        autoFocus
      />

      <Label mt>ARTISTA / AUTOR</Label>
      <TextInput
        style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
        placeholder="Ex: Chris Tomlin"
        placeholderTextColor={colors.textSoft}
        value={artist}
        onChangeText={setArtist}
      />

      <Label mt>TOM PADRÃO</Label>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {KEYS.map((k) => (
          <TouchableOpacity
            key={k}
            onPress={() => setDefaultKey(defaultKey === k ? '' : k)}
            style={[styles.keyChip, {
              borderColor: defaultKey === k ? primary : colors.border,
              backgroundColor: defaultKey === k ? primary : colors.surface,
            }]}
            accessibilityRole="button"
            accessibilityLabel={`Tom ${k}`}
            accessibilityState={{ selected: defaultKey === k }}
          >
            <Text style={[Typography.caption, { color: defaultKey === k ? '#FFF' : colors.textMuted, fontWeight: '700' }]}>
              {k}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.keyRow}>
        <View style={{ flex: 1 }}>
          <Label>TOM MASC.</Label>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {KEYS.map((k) => (
              <TouchableOpacity
                key={k}
                onPress={() => setMaleKey(maleKey === k ? '' : k)}
                style={[styles.keyChipSm, {
                  borderColor: maleKey === k ? primary : colors.border,
                  backgroundColor: maleKey === k ? primary : colors.surface,
                }]}
              >
                <Text style={[Typography.micro, { color: maleKey === k ? '#FFF' : colors.textMuted, fontWeight: '700' }]}>
                  {k}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <View style={{ flex: 1 }}>
          <Label>TOM FEM.</Label>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {KEYS.map((k) => (
              <TouchableOpacity
                key={k}
                onPress={() => setFemaleKey(femaleKey === k ? '' : k)}
                style={[styles.keyChipSm, {
                  borderColor: femaleKey === k ? primary : colors.border,
                  backgroundColor: femaleKey === k ? primary : colors.surface,
                }]}
              >
                <Text style={[Typography.micro, { color: femaleKey === k ? '#FFF' : colors.textMuted, fontWeight: '700' }]}>
                  {k}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <Label mt>CIFRA</Label>
      <TextInput
        style={[styles.input, styles.textarea, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
        placeholder="Cole aqui a cifra..."
        placeholderTextColor={colors.textSoft}
        value={chords}
        onChangeText={setChords}
        multiline
        textAlignVertical="top"
      />

      <Label mt>LETRA</Label>
      <TextInput
        style={[styles.input, styles.textareaLg, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
        placeholder="Cole aqui a letra..."
        placeholderTextColor={colors.textSoft}
        value={lyrics}
        onChangeText={setLyrics}
        multiline
        textAlignVertical="top"
      />

      <Label mt>LINKS</Label>
      {links.map((link, i) => (
        <View key={i} style={[styles.linkRow, { marginBottom: Spacing.xs }]}>
          <TextInput
            style={[styles.input, styles.linkInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
            placeholder={`Ex: https://youtube.com/...`}
            placeholderTextColor={colors.textSoft}
            value={link}
            onChangeText={(v) => updateLink(i, v)}
            autoCapitalize="none"
            keyboardType="url"
          />
          {links.length > 1 && (
            <TouchableOpacity
              onPress={() => removeLink(i)}
              style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              accessibilityRole="button"
              accessibilityLabel="Remover link"
            >
              <Minus size={18} color={colors.textMuted} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>
      ))}
      {links.length < 4 && (
        <TouchableOpacity onPress={addLink} style={styles.addLinkBtn}>
          <Plus size={16} color={primary} strokeWidth={2.5} />
          <Text style={[Typography.caption, { color: primary, marginLeft: 4 }]}>Adicionar link</Text>
        </TouchableOpacity>
      )}

      <Label mt>OBSERVAÇÕES</Label>
      <TextInput
        style={[styles.input, styles.textarea, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
        placeholder="Notas internas, contexto litúrgico..."
        placeholderTextColor={colors.textSoft}
        value={notes}
        onChangeText={setNotes}
        multiline
        textAlignVertical="top"
      />
    </>
  );
}

function Label({ children, mt }: { children: string; mt?: boolean }) {
  const { colors } = useColorScheme();
  return (
    <Text style={[Typography.caption, {
      color: colors.textMuted,
      letterSpacing: 0.5,
      marginBottom: Spacing.xs,
      marginTop: mt ? Spacing.md : 0,
    }]}>
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
    justifyContent: 'center',
  },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  textareaLg: { minHeight: 160, textAlignVertical: 'top' },
  chipRow: { marginBottom: 0 },
  keyChip: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    width: 42,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xs,
  },
  keyRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md },
  keyChipSm: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    width: 36,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  linkRow: { flexDirection: 'row', gap: Spacing.xs, alignItems: 'center' },
  linkInput: { flex: 1 },
  iconBtn: {
    borderWidth: 1,
    borderRadius: Radius.md,
    width: Layout.minTouchTarget,
    height: Layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    marginTop: Spacing.xs,
  },
});
