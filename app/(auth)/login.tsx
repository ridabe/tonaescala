import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  BarChart3,
  CalendarPlus,
  CheckCircle2,
  Fingerprint,
  Mail,
  QrCode,
  ShieldCheck,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { signInWithGoogle } from '@/lib/authOAuth';
import {
  authenticate,
  enableBiometric,
  getBiometricLabel,
  getStoredCredentials,
  isBiometricAvailable,
  isBiometricEnabled,
} from '@/lib/biometric';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, Radius, Layout } from '@/constants/Theme';

type Mode = 'options' | 'email';

const HERO_SLIDES = [
  {
    eyebrow: 'Eventos',
    title: 'Crie eventos em minutos',
    subtitle: 'Monte a estrutura, defina equipes e deixe tudo pronto para convidar.',
    color: Colors.brand.primary,
    softColor: Colors.brand.primarySoft,
    Icon: CalendarPlus,
    metric: '4 etapas',
  },
  {
    eyebrow: 'Convites',
    title: 'Convide por código ou QR Code',
    subtitle: 'Quem recebeu convite entra rápido, sem precisar criar conta.',
    color: Colors.brand.accent,
    softColor: Colors.brand.accentSoft,
    Icon: QrCode,
    metric: 'TNE-2026',
  },
  {
    eyebrow: 'Equipe',
    title: 'Acompanhe aceites e recusas',
    subtitle: 'Veja quem confirmou, quem recusou e quem ainda precisa responder.',
    color: Colors.status.info,
    softColor: Colors.status.infoSoft,
    Icon: CheckCircle2,
    metric: '86%',
  },
  {
    eyebrow: 'Insights',
    title: 'Tenha a escala sob controle',
    subtitle: 'Use métricas por evento para decidir o que precisa de atenção.',
    color: Colors.status.success,
    softColor: Colors.status.successSoft,
    Icon: BarChart3,
    metric: 'Ao vivo',
  },
];

export default function LoginScreen() {
  const { colors } = useColorScheme();

  const [mode, setMode] = useState<Mode>('options');
  const [activeSlide, setActiveSlide] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricReady, setBiometricReady] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState('Digital');

  const heroAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setInterval(() => {
      Animated.timing(heroAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => {
        setActiveSlide((current) => (current + 1) % HERO_SLIDES.length);
        Animated.timing(heroAnim, {
          toValue: 1,
          duration: 360,
          useNativeDriver: true,
        }).start();
      });
    }, 4200);

    return () => clearInterval(timer);
  }, [heroAnim]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1100, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);


  useEffect(() => {
    async function checkBiometric() {
      const available = await isBiometricAvailable();
      const enabled = await isBiometricEnabled();
      if (available && enabled) {
        setBiometricLabel(await getBiometricLabel());
        setBiometricReady(true);
      }
    }
    checkBiometric();
  }, []);

  async function handleEmailLogin() {
    if (!email || !password) { Alert.alert('Preencha e-mail e senha.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { Alert.alert('Erro ao entrar', error.message); return; }
    offerBiometricEnrollment(email, password);
  }

  async function offerBiometricEnrollment(savedEmail: string, savedPassword: string) {
    const available = await isBiometricAvailable();
    const alreadyEnabled = await isBiometricEnabled();
    if (!available || alreadyEnabled) return;
    const label = await getBiometricLabel();
    Alert.alert(
      `Ativar login por ${label}?`,
      `Da próxima vez você pode entrar usando ${label} sem precisar digitar a senha.`,
      [
        { text: 'Agora não', style: 'cancel' },
        {
          text: 'Ativar',
          onPress: () => enableBiometric(savedEmail, savedPassword),
        },
      ],
    );
  }

  async function handleBiometricLogin() {
    setLoading(true);
    try {
      const ok = await authenticate(`Entrar como organizador`);
      if (!ok) return;
      const creds = await getStoredCredentials();
      if (!creds) {
        Alert.alert('Credenciais não encontradas', 'Entre com e-mail e senha novamente.');
        setBiometricReady(false);
        return;
      }
      const { error } = await supabase.auth.signInWithPassword(creds);
      if (error) Alert.alert('Erro ao entrar', error.message);
    } finally {
      setLoading(false);
    }
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
    try {
      await signInWithGoogle();
    } catch (error: any) {
      Alert.alert('Erro', error.message ?? 'Não foi possível entrar com Google.');
    } finally {
      setLoading(false);
    }
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
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.inner}>
          <View style={s.brandRow}>
            <Image source={require('@/assets/images/icon.png')} style={s.logoImg} />
            <View style={{ flex: 1 }}>
              <Text style={[s.appName, { color: primary }]}>ToNaEscala</Text>
              <Text style={[Typography.caption, { color: colors.textMuted }]}>
                Escalas organizadas para pessoas que servem juntas
              </Text>
            </View>
          </View>

          <HeroCarousel
            activeSlide={activeSlide}
            animation={heroAnim}
            pulse={pulseAnim}
            onSelect={setActiveSlide}
          />

          <View style={[s.guestPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={s.panelHeader}>
              <View style={[s.panelIcon, { backgroundColor: Colors.brand.primarySoft }]}>
                <QrCode size={18} color={Colors.brand.primary} strokeWidth={2.3} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[Typography.bodyStrong, { color: colors.text }]}>Recebeu um convite?</Text>
                <Text style={[Typography.caption, { color: colors.textMuted }]}>
                  Insira o código recebido ou escaneie o QR Code.
                </Text>
              </View>
            </View>

            <View style={s.codeRow}>
              <TextInput
                style={[s.input, s.codeInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
                placeholder="Código TNE-XXXXXX"
                placeholderTextColor={colors.textSoft}
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="characters"
                returnKeyType="go"
                onSubmitEditing={handleEnterByCode}
              />
              <TouchableOpacity
                style={[s.qrBtn, { backgroundColor: Colors.brand.primary, borderColor: Colors.brand.primary }]}
                onPress={() => router.push('/scan-qr')}
                accessibilityRole="button"
                accessibilityLabel="Escanear QR Code"
              >
                <QrCode size={22} color="#FFFFFF" strokeWidth={2.3} />
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

          <View style={s.organizerIntro}>
            <View style={[s.organizerIcon, { backgroundColor: Colors.brand.accentSoft }]}>
              <ShieldCheck size={18} color={Colors.brand.accentPressed} strokeWidth={2.3} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[Typography.bodyStrong, { color: colors.text }]}>Quer criar seu próprio evento?</Text>
              <Text style={[Typography.caption, { color: colors.textMuted }]}>
                Cadastre-se para administrar eventos, convidar sua equipe e acompanhar as escalas.
              </Text>
            </View>
          </View>

          {mode === 'options' ? (
            <View style={s.actionStack}>
              {biometricReady && (
                <TouchableOpacity
                  style={[s.btn, s.btnPrimary, { backgroundColor: primary }]}
                  onPress={handleBiometricLogin}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel={`Entrar com ${biometricLabel}`}
                  accessibilityState={{ disabled: loading, busy: loading }}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Fingerprint size={17} color="#FFF" strokeWidth={2.2} />
                      <Text style={[s.btnText, { color: '#FFF' }]}>Entrar com {biometricLabel}</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[s.btn, biometricReady ? s.btnOutline : s.btnPrimary, biometricReady ? { borderColor: primary } : { backgroundColor: primary }]}
                onPress={handleGoogleLogin}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Entrar com Google"
                accessibilityState={{ disabled: loading }}
              >
                <Text style={[s.btnText, { color: biometricReady ? primary : '#FFF' }]}>Entrar com Google</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.btn, s.btnOutline, { borderColor: primary }]}
                onPress={() => setMode('email')}
                accessibilityRole="button"
                accessibilityLabel="Entrar com e-mail"
              >
                <Mail size={17} color={primary} strokeWidth={2.2} />
                <Text style={[s.btnText, { color: primary }]}>Entrar com e-mail</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.actionStack}>
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
                style={[s.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                placeholder="Senha"
                placeholderTextColor={colors.textSoft}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <TouchableOpacity
                style={[s.btn, s.btnPrimary, { backgroundColor: primary }]}
                onPress={handleEmailLogin}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Entrar com e-mail e senha"
                accessibilityState={{ disabled: loading, busy: loading }}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={[s.btnText, { color: '#FFF' }]}>Entrar</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={s.btn}
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function HeroCarousel({
  activeSlide,
  animation,
  pulse,
  onSelect,
}: {
  activeSlide: number;
  animation: Animated.Value;
  pulse: Animated.Value;
  onSelect: (index: number) => void;
}) {
  const { colors } = useColorScheme();
  const slide = HERO_SLIDES[activeSlide];
  const Icon = slide.Icon;
  const translateY = animation.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  return (
    <View style={[heroStyles.wrap, { backgroundColor: slide.color }]}>
      <View style={heroStyles.textureOne} />
      <View style={[heroStyles.textureTwo, { backgroundColor: slide.softColor }]} />

      <Animated.View style={[heroStyles.content, { opacity: animation, transform: [{ translateY }] }]}>
        <View style={heroStyles.heroTop}>
          <View style={heroStyles.logoBadge}>
            <Image source={require('@/assets/images/icon.png')} style={heroStyles.badgeLogo} />
          </View>
          <View style={[heroStyles.metricPill, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
            <Text style={heroStyles.metricText}>{slide.metric}</Text>
          </View>
        </View>

        <View style={heroStyles.heroBody}>
          <View style={{ flex: 1 }}>
            <Text style={heroStyles.eyebrow}>{slide.eyebrow}</Text>
            <Text style={heroStyles.title}>{slide.title}</Text>
            <Text style={heroStyles.subtitle}>{slide.subtitle}</Text>
          </View>
          <Animated.View style={[heroStyles.featureIcon, { transform: [{ scale: pulseScale }] }]}>
            <Icon size={34} color={slide.color} strokeWidth={2.2} />
          </Animated.View>
        </View>

        <View style={heroStyles.mockPanel}>
          <View style={heroStyles.mockHeader}>
            <View style={heroStyles.avatarStack}>
              {[0, 1, 2].map((item) => (
                <View key={item} style={[heroStyles.avatar, { marginLeft: item === 0 ? 0 : -7, backgroundColor: item === 1 ? Colors.brand.accent : Colors.status.info }]} />
              ))}
            </View>
            <Text style={[Typography.micro, { color: colors.textMuted }]}>Equipe escalada</Text>
          </View>
          <View style={heroStyles.mockRows}>
            <View style={[heroStyles.mockBar, { width: '86%', backgroundColor: slide.color }]} />
            <View style={[heroStyles.mockBar, { width: '62%', backgroundColor: Colors.brand.accent }]} />
            <View style={[heroStyles.mockBar, { width: '42%', backgroundColor: Colors.status.info }]} />
          </View>
        </View>
      </Animated.View>

      <View style={heroStyles.dots}>
        {HERO_SLIDES.map((item, index) => (
          <TouchableOpacity
            key={item.title}
            onPress={() => onSelect(index)}
            accessibilityRole="button"
            accessibilityLabel={`Ver slide ${index + 1}`}
            style={[
              heroStyles.dot,
              {
                width: activeSlide === index ? 20 : 7,
                backgroundColor: activeSlide === index ? '#FFFFFF' : 'rgba(255,255,255,0.45)',
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = (colors: ReturnType<typeof import('@/hooks/useColorScheme').useColorScheme>['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: Spacing.lg,
      paddingTop: Platform.OS === 'ios' ? 54 : 34,
      paddingBottom: Spacing.xxl,
    },
    inner: {
      width: '100%',
      maxWidth: 440,
      alignSelf: 'center',
      gap: Spacing.md,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    logoImg: {
      width: 48,
      height: 48,
      borderRadius: Radius.md,
    },
    appName: {
      ...Typography.titleLg,
    },
    guestPanel: {
      borderWidth: 1,
      borderRadius: Radius.md,
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    panelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    panelIcon: {
      width: 38,
      height: 38,
      borderRadius: Radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    codeRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
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
      minHeight: Math.max(Layout.minTouchTarget, 48),
      flexDirection: 'row',
      gap: Spacing.xs,
    },
    btnPrimary: {},
    btnOutline: { borderWidth: 1 },
    btnText: { ...Typography.bodyStrong },
    organizerIntro: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      paddingHorizontal: Spacing.xs,
    },
    organizerIcon: {
      width: 38,
      height: 38,
      borderRadius: Radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionStack: {
      gap: Spacing.sm,
    },
    back: { marginTop: Spacing.xs, alignSelf: 'center' },
  });

const heroStyles = StyleSheet.create({
  wrap: {
    minHeight: 270,
    borderRadius: Radius.md,
    overflow: 'hidden',
    padding: Spacing.lg,
  },
  textureOne: {
    position: 'absolute',
    right: -36,
    top: -42,
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: 'rgba(255,255,255,0.13)',
  },
  textureTwo: {
    position: 'absolute',
    left: -42,
    bottom: -64,
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.22,
  },
  content: {
    flex: 1,
    gap: Spacing.md,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLogo: {
    width: 26,
    height: 26,
    borderRadius: Radius.sm,
  },
  metricPill: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  metricText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  heroBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 27,
    lineHeight: 32,
    fontWeight: '800',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    marginTop: Spacing.xs,
  },
  featureIcon: {
    width: 62,
    height: 62,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  mockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  mockRows: {
    gap: 6,
  },
  mockBar: {
    height: 7,
    borderRadius: Radius.full,
  },
  dots: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.lg,
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    height: 7,
    borderRadius: Radius.full,
  },
});
