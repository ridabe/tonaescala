import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Mail, Phone, Plus, Search, UserRound } from 'lucide-react-native';
import { useOrganization } from '@/hooks/useOrganization';
import { useColorScheme } from '@/hooks/useColorScheme';
import { listOrgContacts, deleteOrgContact, type OrgContact } from '@/lib/contacts';
import { reportError } from '@/lib/errorReporting';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, Radius, Layout } from '@/constants/Theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonList } from '@/components/SkeletonBlock';
import { ErrorState } from '@/components/ErrorState';

export default function ContatosScreen() {
  const { org } = useOrganization();
  const { colors } = useColorScheme();
  const [contacts, setContacts] = useState<OrgContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    if (!org) return;
    setLoading(true);
    setLoadError(null);
    try {
      const data = await listOrgContacts(org.id);
      setContacts(data);
    } catch (err) {
      reportError(err, { context: 'ContatosScreen.load' });
      setLoadError('Não foi possível carregar os contatos.');
    } finally {
      setLoading(false);
    }
  }, [org]);

  useEffect(() => { load(); }, [load]);

  const filtered = query.trim()
    ? contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          (c.email ?? '').toLowerCase().includes(query.toLowerCase()) ||
          (c.phone ?? '').includes(query) ||
          (c.default_role ?? '').toLowerCase().includes(query.toLowerCase()),
      )
    : contacts;

  function confirmDelete(contact: OrgContact) {
    Alert.alert(
      'Remover contato',
      `Remover "${contact.name}" da agenda? Os escalamentos já feitos não serão afetados.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteOrgContact(contact.id, org!.id);
              setContacts((prev) => prev.filter((c) => c.id !== contact.id));
            } catch (err) {
              reportError(err, { context: 'ContatosScreen.delete' });
              Alert.alert('Erro', 'Não foi possível remover o contato.');
            }
          },
        },
      ],
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Agenda de Contatos" fallbackHref="/(tabs)/perfil" />

      <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Search size={18} color={colors.textMuted} strokeWidth={2} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Buscar por nome, email ou função..."
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
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            query.trim() ? (
              <EmptyState icon={Search} title="Nenhum contato encontrado" subtitle={`Sem resultados para "${query}"`} />
            ) : (
              <EmptyState
                icon={UserRound}
                title="Agenda vazia"
                subtitle="Adicione contatos para acelerar o preenchimento das escalas."
              />
            )
          }
          renderItem={({ item }) => (
            <ContactRow
              contact={item}
              colors={colors}
              onPress={() => router.push(`/contatos/${item.id}` as any)}
              onDelete={() => confirmDelete(item)}
            />
          )}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
          )}
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: Colors.brand.accent }]}
        onPress={() => router.push('/contatos/novo' as any)}
        accessibilityRole="button"
        accessibilityLabel="Novo contato"
      >
        <Plus size={26} color="#FFF" strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}

function ContactRow({
  contact,
  colors,
  onPress,
  onDelete,
}: {
  contact: OrgContact;
  colors: any;
  onPress: () => void;
  onDelete: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      onLongPress={onDelete}
      accessibilityRole="button"
      accessibilityLabel={`Editar ${contact.name}`}
      accessibilityHint="Pressione longamente para remover"
    >
      <View style={[styles.avatar, { backgroundColor: Colors.brand.primarySoft }]}>
        <Text style={[Typography.bodyStrong, { color: Colors.brand.primary }]}>
          {contact.name.trim().charAt(0).toUpperCase()}
        </Text>
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[Typography.bodyStrong, { color: colors.text }]} numberOfLines={1}>
          {contact.name}
        </Text>

        <View style={styles.metaRow}>
          {contact.default_role ? (
            <View style={[styles.roleBadge, { backgroundColor: Colors.brand.primarySoft }]}>
              <Text style={[Typography.micro, { color: Colors.brand.primaryPressed, fontWeight: '700' }]} numberOfLines={1}>
                {contact.default_role}
              </Text>
            </View>
          ) : null}
          {contact.email ? (
            <View style={styles.metaItem}>
              <Mail size={12} color={colors.textMuted} strokeWidth={2} />
              <Text style={[Typography.micro, { color: colors.textMuted }]} numberOfLines={1}>
                {contact.email}
              </Text>
            </View>
          ) : null}
          {contact.phone ? (
            <View style={styles.metaItem}>
              <Phone size={12} color={colors.textMuted} strokeWidth={2} />
              <Text style={[Typography.micro, { color: colors.textMuted }]} numberOfLines={1}>
                {contact.phone}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
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
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: Layout.minTouchTarget,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  roleBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  separator: { height: 1, marginLeft: 58 },
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
