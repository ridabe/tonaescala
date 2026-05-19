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
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { QrCode } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, Radius, Layout } from '@/constants/Theme';

type Mode = 'options' | 'email';

export default function LoginScreen() {
  const { colors } = useColorScheme();

  const [mode, setMode] = useState<Mode>('options');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleEmailLogin() {
    if (!email || !password) { Alert.alert('Preencha e-mail e senha.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert('Erro ao entrar', error.message);
  }

  async function handleEmailSignUp() {
    if (!email || !password) { Alert.alert('Preencha e-mail e senha.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) Alert.alert('Erro ao criar conta', error.message);
    else Alert.alert('Conta criada!', 'Verifique seu e-mail para confirmar.');
  }

  async function handleGoogleLogin() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    setLoading(false);
    if (error) Alert.alert('Erro', error.message);
  }

  async function handleEnterByCode() {
    const code = inviteCode.trim().toUpperCase();
    if (!code) { Alert.alert('Digite o código do evento.'); return; }
    setLoading(true);
    const { data, error } = await supabase.rpc('get_public_event_by_invite_code', {
      p_invite_code: code,
    });
    setLoading(false);
    if (error || !data?.length) {
      Alert.alert('Código inválido', 'Evento não encontrado ou convite expirado.');
      return;
    }
    router.push({ pathname: '/enter-event', params: { invite_code: code } });
  }

  const s = styles(colors);
  const primary = Colors.brand.primary;

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={s.inner}>
        <View style={s.logoRow}>
          <Image source={require('@/assets/images/icon.png')} style={s.logoImg} />
          <Text style={[s.appName, { color: primary }]}>ToNaEscala</Text>
        </View>
        <Text style={[s.tagline, { color: colors.textMuted }]}>
          Escalas organizadas para pessoas que servem juntas
        </Text>

        {/* Entrada por código — sempre visível */}
        <View style={s.codeSection}>
          <Text style={[s.sectionLabel, { color: colors.textMuted }]}>Entrar em evento</Text>
          <View style={s.codeRow}>
            <TextInput
              style={[s.input, s.codeInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
              placeholder="Código  TNE-XXXXXX"
              placeholderTextColor={colors.textSoft}
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              returnKeyType="go"
              onSubmitEditing={handleEnterByCode}
            />
            <TouchableOpacity
              style={[s.qrBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push('/scan-qr')}
              accessibilityRole="button"
              accessibilityLabel="Escanear QR Code"
            >
              <QrCode size={22} color={primary} strokeWidth={2} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[s.btn, s.btnOutline, { borderColor: primary }]}
            onPress={handleEnterByCode}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Entrar no evento pelo código"
            accessibilityState={{ disabled: loading }}
          >
            {loading ? (
              <ActivityIndicator color={primary} />
            ) : (
              <Text style={[s.btnText, { color: primary }]}>Entrar no evento</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={s.divider}>
          <View style={[s.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[s.dividerText, { color: colors.textSoft }]}>ou</Text>
          <View style={[s.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        {/* Login do organizador */}
        {mode === 'options' ? (
          <View>
            <TouchableOpacity
              style={[s.btn, s.btnPrimary, { backgroundColor: primary }]}
              onPress={handleGoogleLogin}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Entrar com Google"
              accessibilityState={{ disabled: loading }}
            >
              <Text style={[s.btnText, { color: '#FFF' }]}>Entrar com Google</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btn, s.btnOutline, { borderColor: primary, marginTop: Spacing.sm }]}
              onPress={() => setMode('email')}
              accessibilityRole="button"
              accessibilityLabel="Entrar com e-mail"
            >
              <Text style={[s.btnText, { color: primary }]}>Entrar com e-mail</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <TextInput
              style={[s.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
              placeholder="E-mail"
              placeholderTextColor={colors.textSoft}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={[s.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border, marginTop: Spacing.sm }]}
              placeholder="Senha"
              placeholderTextColor={colors.textSoft}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TouchableOpacity
              style={[s.btn, s.btnPrimary, { backgroundColor: primary, marginTop: Spacing.md }]}
              onPress={handleEmailLogin}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Entrar com e-mail e senha"
              accessibilityState={{ disabled: loading, busy: loading }}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={[s.btnText, { color: '#FFF' }]}>Entrar</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btn, { marginTop: Spacing.sm }]}
              onPress={handleEmailSignUp}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Criar conta nova"
            >
              <Text style={[s.btnText, { color: colors.textMuted }]}>Criar conta</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMode('options')}
              style={s.back}
              accessibilityRole="button"
              accessibilityLabel="Voltar para opções de login"
            >
              <Text style={[Typography.caption, { color: colors.textMuted }]}>Voltar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = (colors: ReturnType<typeof import('@/hooks/useColorScheme').useColorScheme>['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    inner: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.xxl,
      width: '100%',
      maxWidth: 440,
      alignSelf: 'center',
    },
    logoRow: {
      alignItems: 'center',
      marginBottom: Spacing.xs,
    },
    logoImg: {
      width: 64,
      height: 64,
      borderRadius: 14,
      marginBottom: Spacing.sm,
    },
    appName: {
      ...Typography.display,
      textAlign: 'center',
    },
    tagline: {
      ...Typography.body,
      textAlign: 'center',
      marginTop: Spacing.xs,
      marginBottom: Spacing.xxl,
    },
    sectionLabel: {
      ...Typography.caption,
      marginBottom: Spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    codeSection: { marginBottom: Spacing.lg },
    codeRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    codeInput: { flex: 1 },
    qrBtn: {
      width: Layout.minTouchTarget,
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
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
      justifyContent: 'center',
      minHeight: Layout.minTouchTarget,
    },
    btnPrimary: {},
    btnOutline: { borderWidth: 1 },
    btnText: { ...Typography.bodyStrong },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: Spacing.lg,
      gap: Spacing.sm,
    },
    dividerLine: { flex: 1, height: 1 },
    dividerText: { ...Typography.caption },
    back: { marginTop: Spacing.md, alignSelf: 'center' },
  });
