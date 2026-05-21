import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useOrganization } from '@/hooks/useOrganization';
import { useColorScheme } from '@/hooks/useColorScheme';
import { listOrgContacts, upsertOrgContact, deleteOrgContact, type OrgContact } from '@/lib/contacts';
import { reportError } from '@/lib/errorReporting';
import { Typography, Spacing, Radius, Layout } from '@/constants/Theme';
import { Colors } from '@/constants/Colors';
import { Button } from '@/components/Button';
import { ScreenHeader } from '@/components/ScreenHeader';
import { RolePicker } from '@/components/RolePicker';

export default function EditContatoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { org } = useOrganization();
  const { colors } = useColorScheme();
  const [contact, setContact] = useState<OrgContact | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!org || !id) return;
    listOrgContacts(org.id).then((all) => {
      const found = all.find((c) => c.id === id) ?? null;
      if (found) {
        setContact(found);
        setName(found.name);
        setEmail(found.email ?? '');
        setPhone(found.phone ?? '');
        setRole(found.default_role ?? '');
      }
    });
  }, [org, id]);

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Nome obrigatório', 'Informe o nome do contato.');
      return;
    }
    if (!org) return;
    setLoading(true);
    try {
      await upsertOrgContact(org.id, {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        default_role: role || undefined,
      });
      router.back();
    } catch (err) {
      reportError(err, { context: 'EditContatoScreen.save' });
      Alert.alert('Erro', 'Não foi possível salvar o contato.');
    } finally {
      setLoading(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Remover contato',
      `Remover "${name}" da agenda? Os escalamentos já feitos não serão afetados.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteOrgContact(id as string, org!.id);
              router.back();
            } catch (err) {
              reportError(err, { context: 'EditContatoScreen.delete' });
              Alert.alert('Erro', 'Não foi possível remover o contato.');
            }
          },
        },
      ],
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader title="Editar Contato" fallbackHref={'/contatos' as any} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <Label>NOME *</Label>
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
          placeholder="Ex: Alexandre Silva"
          placeholderTextColor={colors.textSoft}
          value={name}
          onChangeText={setName}
        />

        <Label mt>EMAIL</Label>
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

        <Label mt>FUNÇÃO PADRÃO</Label>
        <RolePicker value={role} onChange={setRole} placeholder="Selecionar função padrão..." />
        <Text style={[Typography.caption, { color: colors.textSoft, marginTop: Spacing.xs }]}>
          Será sugerida automaticamente ao escalar esta pessoa.
        </Text>

        <View style={{ marginTop: Spacing.xl }}>
          <Button label="Salvar alterações" onPress={handleSave} loading={loading} />
        </View>

        <View style={[styles.deleteBox, { borderTopColor: colors.border }]}>
          <Button label="Remover contato" variant="danger" onPress={confirmDelete} />
        </View>
      </ScrollView>
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
  deleteBox: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.xl,
    borderTopWidth: 1,
  },
});
