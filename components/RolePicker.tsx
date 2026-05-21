import { useRef, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Check, ChevronDown, Search, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ROLE_CATEGORIES } from '@/lib/roles';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, Radius } from '@/constants/Theme';

type Props = {
  value: string;
  onChange: (role: string) => void;
  placeholder?: string;
};

export function RolePicker({ value, onChange, placeholder = 'Selecionar função' }: Props) {
  const { colors } = useColorScheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [customMode, setCustomMode] = useState(false);
  const [customText, setCustomText] = useState('');
  const insets = useSafeAreaInsets();

  const filteredCategories = search.trim()
    ? ROLE_CATEGORIES.map((cat) => ({
        ...cat,
        roles: cat.roles.filter((r) => r.toLowerCase().includes(search.toLowerCase())),
      })).filter((cat) => cat.roles.length > 0)
    : ROLE_CATEGORIES;

  function selectRole(role: string) {
    onChange(role);
    setOpen(false);
    setSearch('');
    setCustomMode(false);
  }

  function confirmCustom() {
    if (customText.trim()) {
      onChange(customText.trim());
      setCustomText('');
    }
    setOpen(false);
    setSearch('');
    setCustomMode(false);
  }

  function clear() {
    onChange('');
  }

  const hasValue = value.trim().length > 0;

  return (
    <>
      <TouchableOpacity
        style={[
          styles.trigger,
          {
            borderColor: hasValue ? Colors.brand.primary : colors.border,
            backgroundColor: hasValue ? Colors.brand.primarySoft : colors.surface,
          },
        ]}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={hasValue ? `Função: ${value}` : placeholder}
      >
        <Text
          style={[Typography.body, { color: hasValue ? Colors.brand.primaryPressed : colors.textSoft, flex: 1 }]}
          numberOfLines={1}
        >
          {hasValue ? value : placeholder}
        </Text>
        {hasValue ? (
          <TouchableOpacity onPress={clear} hitSlop={8} accessibilityRole="button" accessibilityLabel="Limpar função">
            <X size={16} color={colors.textMuted} strokeWidth={2} />
          </TouchableOpacity>
        ) : (
          <ChevronDown size={18} color={colors.textMuted} strokeWidth={2} />
        )}
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + Spacing.lg }]}>
          {/* Header */}
          <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
            <Text style={[Typography.titleSm, { color: colors.text }]}>Selecionar Função</Text>
            <TouchableOpacity onPress={() => { setOpen(false); setSearch(''); setCustomMode(false); }} hitSlop={8}>
              <X size={22} color={colors.textMuted} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Search size={16} color={colors.textMuted} strokeWidth={2} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Buscar função..."
              placeholderTextColor={colors.textSoft}
              value={search}
              onChangeText={(t) => { setSearch(t); setCustomMode(false); }}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                <X size={14} color={colors.textMuted} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.listContent} keyboardShouldPersistTaps="handled">
            {filteredCategories.map((cat) => (
              <View key={cat.category}>
                <Text style={[Typography.micro, styles.catLabel, { color: colors.textMuted }]}>
                  {cat.category.toUpperCase()}
                </Text>
                <View style={styles.chipGrid}>
                  {cat.roles.map((role) => {
                    const active = value === role;
                    return (
                      <TouchableOpacity
                        key={role}
                        style={[
                          styles.roleChip,
                          {
                            borderColor: active ? Colors.brand.primary : colors.border,
                            backgroundColor: active ? Colors.brand.primarySoft : colors.surface,
                          },
                        ]}
                        onPress={() => selectRole(role)}
                        accessibilityRole="button"
                        accessibilityLabel={role}
                      >
                        {active && <Check size={12} color={Colors.brand.primary} strokeWidth={3} />}
                        <Text
                          style={[
                            Typography.caption,
                            { color: active ? Colors.brand.primaryPressed : colors.text, fontWeight: active ? '700' : '500' },
                          ]}
                        >
                          {role}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}

            {/* Outra função (custom) */}
            <View style={[styles.customSection, { borderTopColor: colors.border }]}>
              <Text style={[Typography.micro, styles.catLabel, { color: colors.textMuted }]}>
                OUTRA FUNÇÃO
              </Text>
              {customMode ? (
                <View style={styles.customRow}>
                  <TextInput
                    style={[styles.customInput, { color: colors.text, backgroundColor: colors.surface, borderColor: Colors.brand.primary }]}
                    placeholder="Digite a função..."
                    placeholderTextColor={colors.textSoft}
                    value={customText}
                    onChangeText={setCustomText}
                    autoFocus
                    onSubmitEditing={confirmCustom}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    style={[styles.customConfirm, { backgroundColor: Colors.brand.primary }]}
                    onPress={confirmCustom}
                  >
                    <Check size={18} color="#fff" strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.customTrigger, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
                  onPress={() => setCustomMode(true)}
                >
                  <Text style={[Typography.body, { color: colors.textMuted }]}>Digitar função personalizada...</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 44,
    gap: Spacing.sm,
  },
  sheet: {
    flex: 1,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingTop: Spacing.xl,
    borderBottomWidth: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.lg,
    marginBottom: Spacing.sm,
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
    gap: Spacing.xs,
  },
  catLabel: {
    letterSpacing: 0.6,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  customSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
  },
  customRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  customInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body,
  },
  customConfirm: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customTrigger: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderStyle: 'dashed',
  },
});
