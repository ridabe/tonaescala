import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Check, Music, Search, X } from 'lucide-react-native';
import { fetchSongs, type Song } from '@/lib/songs';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, Radius, Layout } from '@/constants/Theme';
import { SkeletonList } from './SkeletonBlock';

type Props = {
  visible: boolean;
  orgId: string;
  selectedIds: string[];
  onConfirm: (ids: string[]) => void;
  onClose: () => void;
};

export function SongSelector({ visible, orgId, selectedIds, onConfirm, onClose }: Props) {
  const { colors } = useColorScheme();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<string[]>([]);

  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const data = await fetchSongs(orgId);
      setSongs(data);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (visible) {
      setDraft([...selectedIds]);
      setQuery('');
      load();
    }
  }, [visible, selectedIds, load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.artist ?? '').toLowerCase().includes(q),
    );
  }, [songs, query]);

  function toggle(id: string) {
    setDraft((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function handleConfirm() {
    onConfirm(draft);
    onClose();
  }

  const primary = Colors.brand.primary;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} hitSlop={8} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Fechar">
            <X size={22} color={colors.textMuted} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={[Typography.titleSm, { color: colors.text, flex: 1, textAlign: 'center' }]}>
            Músicas
          </Text>
          <TouchableOpacity onPress={handleConfirm} hitSlop={8} style={styles.confirmBtn} accessibilityRole="button" accessibilityLabel="Confirmar seleção">
            <Text style={[Typography.bodyStrong, { color: primary }]}>
              Confirmar{draft.length > 0 ? ` (${draft.length})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Search size={18} color={colors.textMuted} strokeWidth={2} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Buscar..."
            placeholderTextColor={colors.textSoft}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>

        {loading ? (
          <View style={styles.listContent}>
            <SkeletonList count={6} />
          </View>
        ) : songs.length === 0 ? (
          <View style={styles.emptyBox}>
            <Music size={36} color={colors.textMuted} strokeWidth={1.5} />
            <Text style={[Typography.body, { color: colors.textMuted, marginTop: Spacing.md, textAlign: 'center' }]}>
              Nenhuma música na biblioteca.{'\n'}Adicione músicas em Perfil → Biblioteca.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const selected = draft.includes(item.id);
              return (
                <TouchableOpacity
                  style={[styles.row, { borderBottomColor: colors.border }]}
                  onPress={() => toggle(item.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={item.title}
                >
                  <View style={[
                    styles.checkbox,
                    {
                      borderColor: selected ? primary : colors.border,
                      backgroundColor: selected ? primary : 'transparent',
                    },
                  ]}>
                    {selected && <Check size={14} color="#FFF" strokeWidth={3} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[Typography.bodyStrong, { color: colors.text }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    {item.artist ? (
                      <Text style={[Typography.caption, { color: colors.textMuted }]} numberOfLines={1}>
                        {item.artist}
                      </Text>
                    ) : null}
                  </View>
                  {item.default_key ? (
                    <View style={[styles.keyBadge, { backgroundColor: Colors.brand.primarySoft }]}>
                      <Text style={[Typography.micro, { color: primary, fontWeight: '700' }]}>
                        {item.default_key}
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  closeBtn: { width: 44 },
  confirmBtn: { minWidth: 44, alignItems: 'flex-end' },
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
    paddingBottom: Spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: Layout.minTouchTarget,
    borderBottomWidth: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
});
