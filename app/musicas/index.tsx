import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Music, Plus, Search } from 'lucide-react-native';
import { useOrganization } from '@/hooks/useOrganization';
import { useColorScheme } from '@/hooks/useColorScheme';
import { fetchSongs, type Song } from '@/lib/songs';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, Radius, Layout } from '@/constants/Theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonList } from '@/components/SkeletonBlock';
import { ErrorState } from '@/components/ErrorState';
import { reportError } from '@/lib/errorReporting';

export default function BibliotecaScreen() {
  const { org } = useOrganization();
  const { colors } = useColorScheme();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    if (!org) return;
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchSongs(org.id);
      setSongs(data);
    } catch (err) {
      reportError(err, { context: 'BibliotecaScreen.load' });
      setLoadError('Não foi possível carregar as músicas.');
    } finally {
      setLoading(false);
    }
  }, [org]);

  useEffect(() => { load(); }, [load]);

  const filtered = query.trim()
    ? songs.filter(
        (s) =>
          s.title.toLowerCase().includes(query.toLowerCase()) ||
          (s.artist ?? '').toLowerCase().includes(query.toLowerCase()),
      )
    : songs;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Biblioteca de Músicas" fallbackHref="/(tabs)/perfil" />

      <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Search size={18} color={colors.textMuted} strokeWidth={2} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Buscar por título ou artista..."
          placeholderTextColor={colors.textSoft}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
      </View>

      {loading ? (
        <View style={styles.listContent}>
          <SkeletonList count={6} />
        </View>
      ) : loadError ? (
        <ErrorState message={loadError} onRetry={load} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            query.trim() ? (
              <EmptyState
                icon={Search}
                title="Nenhuma música encontrada"
                subtitle={`Sem resultados para "${query}"`}
              />
            ) : (
              <EmptyState
                icon={Music}
                title="Biblioteca vazia"
                subtitle="Adicione músicas usando o botão abaixo."
              />
            )
          }
          renderItem={({ item }) => <SongRow song={item} colors={colors} />}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
          )}
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: Colors.brand.accent }]}
        onPress={() => router.push('/musicas/nova')}
        accessibilityRole="button"
        accessibilityLabel="Nova música"
      >
        <Plus size={26} color="#FFF" strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}

function SongRow({ song, colors }: { song: Song; colors: any }) {
  const isSystem = song.org_id === null;
  const iconBg = isSystem ? Colors.status.infoSoft : Colors.brand.primarySoft;
  const iconColor = isSystem ? Colors.status.info : Colors.brand.primary;
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push(`/musicas/${song.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${song.title}`}
    >
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Music size={18} color={iconColor} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[Typography.bodyStrong, { color: colors.text }]} numberOfLines={1}>
          {song.title}
        </Text>
        <Text style={[Typography.caption, { color: colors.textMuted }]} numberOfLines={1}>
          {song.artist ? song.artist : isSystem ? 'Música do sistema' : 'Sem artista'}
        </Text>
      </View>
      {song.default_key ? (
        <View style={[styles.keyBadge, { backgroundColor: iconBg }]}>
          <Text style={[Typography.micro, { color: iconColor, fontWeight: '700' }]}>
            {song.default_key}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.lg,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    paddingVertical: 0,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: Layout.minTouchTarget,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  separator: { height: 1, marginLeft: 54 },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
});
