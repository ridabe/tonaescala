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
import * as SecureStore from 'expo-secure-store';
import { supabase } from '@/lib/supabase';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, Radius, Layout } from '@/constants/Theme';
import { getOrCreateDeviceId } from '@/lib/deviceId';

export default function EnterEventScreen() {
  const { invite_code } = useLocalSearchParams<{ invite_code: string }>();
  const { colors } = useColorScheme();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    if (!name.trim()) {
      Alert.alert('Informe seu nome para continuar.');
      return;
    }
    setLoading(true);
    const deviceId = await getOrCreateDeviceId();
    const { data, error } = await supabase.rpc('join_event_by_invite_code', {
      p_invite_code: invite_code,
      p_device_id: deviceId,
      p_name: name.trim(),
      p_phone: phone.trim() || null,
    });
    setLoading(false);
    if (error || !data) {
      Alert.alert('Erro', error?.message ?? 'Não foi possível entrar no evento.');
      return;
    }
    await SecureStore.setItemAsync('participant_id', data.participant_id);
    await SecureStore.setItemAsync('participant_access_token', data.participant_access_token);
    router.replace('/(tabs)/agenda');
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
          Código: {invite_code}
        </Text>

        <Text style={[Typography.caption, { color: colors.textMuted, marginBottom: Spacing.sm }]}>
          Seu nome *
        </Text>
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
          placeholder="Como você quer ser chamado"
          placeholderTextColor={colors.textSoft}
          value={name}
          onChangeText={setName}
          autoFocus
        />

        <Text style={[Typography.caption, { color: colors.textMuted, marginTop: Spacing.md, marginBottom: Spacing.sm }]}>
          WhatsApp (opcional)
        </Text>
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
          placeholder="+55 11 9 9999-9999"
          placeholderTextColor={colors.textSoft}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: Colors.brand.primary, marginTop: Spacing.xl }]}
          onPress={handleJoin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={[Typography.bodyStrong, { color: '#FFF' }]}>Entrar no evento</Text>
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
