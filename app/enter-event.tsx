import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, Radius, Layout } from '@/constants/Theme';
import { analytics } from '@/lib/analytics';
import { appStorage } from '@/lib/storage';
import { getGuestEventsByInviteEmail } from '@/lib/assignments';

export default function EnterEventScreen() {
  const { invite_code } = useLocalSearchParams<{ invite_code: string }>();
  const { colors } = useColorScheme();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    const code = String(invite_code ?? '').trim().toUpperCase();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      Alert.alert('Informe seu email para continuar.');
      return;
    }

    setLoading(true);
    try {
      const events = await getGuestEventsByInviteEmail(code, normalizedEmail);
      if (events.length === 0) {
        Alert.alert('Convocacao nao encontrada', 'Este email nao esta convocado para este evento.');
        return;
      }

      await appStorage.setItem('assignment_invite_code', code);
      await appStorage.setItem('assignment_email', normalizedEmail);
      analytics.track('assignment_joined', { event_id: events.find((item) => item.is_current_invite)?.event_id ?? events[0].event_id });
      router.replace('/guest-event');
    } catch (error: any) {
      const message = String(error?.message ?? '');
      if (message.includes('NOT_INVITED')) {
        Alert.alert('Convocacao nao encontrada', 'Este email nao esta convocado para este evento.');
      } else if (message.includes('NOT_FOUND')) {
        Alert.alert('Codigo invalido', 'Evento nao encontrado ou convite expirado.');
      } else {
        Alert.alert('Erro', error?.message ?? 'Nao foi possivel entrar no evento.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={[Typography.titleMd, { color: colors.text, marginBottom: Spacing.xs }]}>
          Entrar no evento
        </Text>
        <Text style={[Typography.body, { color: colors.textMuted, marginBottom: Spacing.xl }]}>
          Codigo: {invite_code}
        </Text>

        <Text style={[Typography.caption, { color: colors.textMuted, marginBottom: Spacing.sm }]}>
          Email convocado *
        </Text>
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
          placeholder="email@exemplo.com"
          placeholderTextColor={colors.textSoft}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
        />
        <Text style={[Typography.caption, { color: colors.textMuted, marginTop: Spacing.sm }]}>
          Use o mesmo email informado pelo organizador na escala.
        </Text>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: Colors.brand.primary, marginTop: Spacing.xl }]}
          onPress={handleJoin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={[Typography.bodyStrong, { color: '#FFF' }]}>Ver minha convocacao</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, padding: Spacing.xl, paddingTop: 80 },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Typography.body,
    minHeight: Layout.minTouchTarget,
  },
  btn: {
    borderRadius: Radius.md,
    alignItems: 'center',
    minHeight: Layout.minTouchTarget,
    justifyContent: 'center',
  },
});
