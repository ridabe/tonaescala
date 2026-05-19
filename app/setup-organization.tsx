import { useState } from 'react';
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
import { router } from 'expo-router';
import { Building2 } from 'lucide-react-native';
import { createOrganization } from '@/lib/organizations';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, Radius, Layout } from '@/constants/Theme';
import { Button } from '@/components/Button';

export default function SetupOrganizationScreen() {
  const { colors } = useColorScheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!name.trim()) {
      Alert.alert('Nome obrigatório', 'Informe o nome da sua organização.');
      return;
    }
    setLoading(true);
    try {
      await createOrganization(name.trim(), description.trim() || undefined);
      router.replace('/(tabs)/eventos');
    } catch (e: any) {
      Alert.alert('Erro', e.message ?? 'Não foi possível criar a organização.');
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
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
      >
        <Building2 size={48} color={primary} strokeWidth={1.5} style={styles.icon} />

        <Text style={[Typography.display, { color: colors.text, textAlign: 'center' }]}>
          Crie sua organização
        </Text>
        <Text style={[Typography.body, { color: colors.textMuted, textAlign: 'center', marginTop: Spacing.sm }]}>
          Você poderá criar eventos, equipes e escalas dentro dela.
        </Text>

        <View style={styles.form}>
          <Text style={[Typography.caption, styles.label, { color: colors.textMuted }]}>
            NOME DA ORGANIZAÇÃO *
          </Text>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
            placeholder="Ex: Igreja Exemplo, Ministério Louvor"
            placeholderTextColor={colors.textSoft}
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="next"
          />

          <Text style={[Typography.caption, styles.label, { color: colors.textMuted, marginTop: Spacing.md }]}>
            DESCRIÇÃO (opcional)
          </Text>
          <TextInput
            style={[styles.input, styles.textarea, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
            placeholder="Descreva brevemente sua organização"
            placeholderTextColor={colors.textSoft}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            returnKeyType="done"
          />

          <View style={{ marginTop: Spacing.xl }}>
            <Button label="Criar organização" onPress={handleCreate} loading={loading} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  icon: { alignSelf: 'center', marginBottom: Spacing.lg },
  form: { marginTop: Spacing.xxl },
  label: {
    marginBottom: Spacing.xs,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Typography.body,
    minHeight: Layout.minTouchTarget,
  },
  textarea: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
});
