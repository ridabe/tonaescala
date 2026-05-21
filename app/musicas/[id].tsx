import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Edit2, ExternalLink, Trash2 } from 'lucide-react-native';
import { fetchSongById, updateSong, deactivateSong, type Song } from '@/lib/songs';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, Radius } from '@/constants/Theme';
import { Button } from '@/components/Button';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SkeletonList } from '@/components/SkeletonBlock';
import { ErrorState } from '@/components/ErrorState';
import { reportError } from '@/lib/errorReporting';
import { SongForm } from './nova';

export default function SongDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useColorScheme();
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // edit state
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [defaultKey, setDefaultKey] = useState('');
  const [maleKey, setMaleKey] = useState('');
  const [femaleKey, setFemaleKey] = useState('');
  const [chords, setChords] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [notes, setNotes] = useState('');
  const [links, setLinks] = useState<string[]>(['']);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchSongById(id);
      if (!data) { setLoadError('Música não encontrada.'); return; }
      setSong(data);
      populateForm(data);
    } catch (err) {
      reportError(err, { context: 'SongDetailScreen.load' });
      setLoadError('Não foi possível carregar a música.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function populateForm(s: Song) {
    setTitle(s.title);
    setArtist(s.artist ?? '');
    setDefaultKey(s.default_key ?? '');
    setMaleKey(s.male_key ?? '');
    setFemaleKey(s.female_key ?? '');
    setChords(s.chords ?? '');
    setLyrics(s.lyrics ?? '');
    setNotes(s.notes ?? '');
    setLinks(s.links.length > 0 ? s.links : ['']);
  }

  function handleStartEdit() {
    if (song) populateForm(song);
    setEditing(true);
  }

  function handleCancelEdit() {
    setEditing(false);
  }

  async function handleSave() {
    if (!title.trim() || !id) { Alert.alert('Título obrigatório'); return; }
    setSaving(true);
    try {
      await updateSong(id, {
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
      await load();
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Erro ao salvar', e.message);
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    Alert.alert(
      'Remover música',
      `"${song?.title}" será removida da biblioteca. Os eventos que já a utilizam não serão afetados.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await deactivateSong(id!);
              router.back();
            } catch (e: any) {
              Alert.alert('Erro', e.message);
            }
          },
        },
      ],
    );
  }

  function addLink() { if (links.length < 4) setLinks((p) => [...p, '']); }
  function removeLink(i: number) { setLinks((p) => p.filter((_, idx) => idx !== i)); }
  function updateLink(i: number, v: string) { setLinks((p) => p.map((l, idx) => idx === i ? v : l)); }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Música" fallbackHref="/musicas" />
        <SkeletonList count={5} />
      </View>
    );
  }

  if (loadError || !song) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Música" fallbackHref="/musicas" />
        <ErrorState message={loadError ?? 'Música não encontrada.'} onRetry={load} />
      </View>
    );
  }

  const isSystem = song.org_id === null;

  const headerRight = isSystem ? null : editing ? (
    <TouchableOpacity onPress={handleCancelEdit} hitSlop={8}>
      <Text style={[Typography.bodyStrong, { color: Colors.brand.primary }]}>Cancelar</Text>
    </TouchableOpacity>
  ) : (
    <TouchableOpacity onPress={handleStartEdit} hitSlop={8} accessibilityRole="button" accessibilityLabel="Editar música">
      <Edit2 size={20} color={Colors.brand.primary} strokeWidth={2} />
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader
        title={editing ? 'Editar música' : song.title}
        fallbackHref="/musicas"
        right={headerRight}
      />

      {editing ? (
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
          <View style={{ marginTop: Spacing.xl, gap: Spacing.sm }}>
            <Button label="Salvar alterações" onPress={handleSave} loading={saving} />
            <Button
              label="Remover da biblioteca"
              variant="danger"
              icon={Trash2}
              onPress={handleDelete}
            />
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <DetailSection label="Artista / Autor" value={song.artist} />

          <View style={[styles.keysCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <KeyItem label="Tom padrão" value={song.default_key} colors={colors} />
            <KeyItem label="Tom masculino" value={song.male_key} colors={colors} />
            <KeyItem label="Tom feminino" value={song.female_key} colors={colors} last />
          </View>

          {song.chords ? (
            <View style={{ marginTop: Spacing.lg }}>
              <SectionTitle label="CIFRA" colors={colors} />
              <View style={[styles.preBlock, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.monoText, { color: colors.text }]}>{song.chords}</Text>
              </View>
            </View>
          ) : null}

          {song.lyrics ? (
            <View style={{ marginTop: Spacing.lg }}>
              <SectionTitle label="LETRA" colors={colors} />
              <View style={[styles.preBlock, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[Typography.body, { color: colors.text, lineHeight: 24 }]}>{song.lyrics}</Text>
              </View>
            </View>
          ) : null}

          {song.links.length > 0 ? (
            <View style={{ marginTop: Spacing.lg }}>
              <SectionTitle label="LINKS" colors={colors} />
              {song.links.filter(Boolean).map((link, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.linkRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => Linking.openURL(link)}
                  accessibilityRole="link"
                >
                  <ExternalLink size={16} color={Colors.brand.primary} strokeWidth={2} />
                  <Text
                    style={[Typography.body, { color: Colors.brand.primary, flex: 1 }]}
                    numberOfLines={1}
                  >
                    {link}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          {song.notes ? (
            <View style={{ marginTop: Spacing.lg }}>
              <SectionTitle label="OBSERVAÇÕES" colors={colors} />
              <Text style={[Typography.body, { color: colors.text, lineHeight: 22 }]}>{song.notes}</Text>
            </View>
          ) : null}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

function DetailSection({ label, value }: { label: string; value: string | null }) {
  const { colors } = useColorScheme();
  if (!value) return null;
  return (
    <View style={{ marginBottom: Spacing.md }}>
      <SectionTitle label={label.toUpperCase()} colors={colors} />
      <Text style={[Typography.body, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

function SectionTitle({ label, colors }: { label: string; colors: any }) {
  return (
    <Text style={[Typography.caption, {
      color: colors.textMuted,
      letterSpacing: 0.5,
      marginBottom: Spacing.sm,
    }]}>
      {label}
    </Text>
  );
}

function KeyItem({ label, value, colors, last }: { label: string; value: string | null; colors: any; last?: boolean }) {
  return (
    <View style={[styles.keyItem, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <Text style={[Typography.caption, { color: colors.textMuted, flex: 1 }]}>{label}</Text>
      <Text style={[Typography.bodyStrong, { color: value ? Colors.brand.primary : colors.textMuted }]}>
        {value ?? '—'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  keysCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginTop: Spacing.md,
  },
  keyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 48,
  },
  preBlock: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  monoText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    lineHeight: 20,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
  },
});
