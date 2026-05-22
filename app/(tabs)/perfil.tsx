import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Fingerprint,
  LogOut,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react-native';
import { useSession } from '@/hooks/useSession';
import { useOrganization } from '@/hooks/useOrganization';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, Radius } from '@/constants/Theme';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabase';
import {
  disableBiometric,
  getBiometricLabel,
  isBiometricAvailable,
  isBiometricEnabled,
} from '@/lib/biometric';

const CURRENT_PLAN = {
  name: 'Free',
  status: 'Ativo',
  description: 'Plano inicial para validar o uso do Minha Escala com sua equipe.',
  features: [
    'Criacao de eventos habilitada',
    'Convocacoes por codigo + email',
    'Status de aceite e recusa',
  ],
};

function formatDate(value?: string | null) {
  if (!value) return 'Nao informado';
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function getInitials(value?: string | null) {
  const source = value?.trim() || 'Admin';
  const [first, second] = source.split(/[\s@.]+/).filter(Boolean);
  return `${first?.[0] ?? 'A'}${second?.[0] ?? ''}`.toUpperCase();
}

export default function PerfilScreen() {
  const { session } = useSession();
  const { org } = useOrganization();
  const { colors } = useColorScheme();

  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState('Digital');

  const user = session?.user;
  const email = user?.email ?? 'Conta nao identificada';
  const isEmailUser = user?.app_metadata?.provider === 'email';
  const displayName =
    (typeof user?.user_metadata?.name === 'string' && user.user_metadata.name.trim()) ||
    (typeof user?.user_metadata?.full_name === 'string' && user.user_metadata.full_name.trim()) ||
    email.split('@')[0] ||
    'Administrador';

  useEffect(() => {
    async function loadBiometric() {
      const available = await isBiometricAvailable();
      setBiometricAvailable(available);
      if (available) {
        setBiometricLabel(await getBiometricLabel());
        setBiometricEnabled(await isBiometricEnabled());
      }
    }
    loadBiometric();
  }, []);

  async function handleToggleBiometric(value: boolean) {
    if (!value) {
      Alert.alert(
        `Desativar login por ${biometricLabel}?`,
        'Voce precisara usar e-mail e senha na proxima vez.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Desativar',
            style: 'destructive',
            onPress: async () => {
              await disableBiometric();
              setBiometricEnabled(false);
            },
          },
        ],
      );
    } else {
      if (!isEmailUser) {
        Alert.alert(
          'Nao disponivel',
          'O login por biometria esta disponivel apenas para contas com e-mail e senha.',
        );
        return;
      }
      Alert.alert(
        `Ativar login por ${biometricLabel}`,
        `Para ativar, saia da conta e entre novamente com e-mail e senha. A opcao de ativar ${biometricLabel} sera oferecida automaticamente.`,
        [{ text: 'Entendido' }],
      );
    }
  }

  async function handleSignOut() {
    Alert.alert('Sair da conta', 'Voce precisara entrar novamente para administrar seus eventos.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.auth.signOut();
          if (error && error.message !== 'Auth session missing!') {
            Alert.alert('Erro ao sair', error.message);
            return;
          }
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: Colors.brand.primary, borderBottomColor: Colors.brand.primaryPressed }]}>
        <View style={styles.avatar}>
          <Text style={[Typography.titleSm, { color: Colors.brand.primary }]}>
            {getInitials(displayName)}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[Typography.titleMd, { color: '#FFFFFF' }]} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={[Typography.caption, { color: Colors.brand.primarySoft }]} numberOfLines={1}>
            Administrador
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <SectionTitle label="Conta" />
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <InfoRow icon={Mail} label="Email" value={email} />
          <InfoRow icon={UserRound} label="Perfil" value="Administrador da organizacao" />
          <InfoRow icon={ShieldCheck} label="Conta criada" value={formatDate(user?.created_at)} last />
        </View>

        <SectionTitle label="Organizacao" />
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <InfoRow icon={Building2} label="Nome" value={org?.name ?? 'Organizacao nao carregada'} />
          <InfoRow icon={CalendarDays} label="Criada em" value={formatDate(org?.created_at)} last />
        </View>

        <SectionTitle label="Plano" />
        <View style={[styles.planCard, { backgroundColor: colors.surface, borderColor: Colors.brand.primary }]}>
          <View style={styles.planHeader}>
            <View style={[styles.planIcon, { backgroundColor: Colors.brand.primarySoft }]}>
              <Sparkles size={22} color={Colors.brand.primary} strokeWidth={2.3} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[Typography.titleSm, { color: colors.text }]}>Plano {CURRENT_PLAN.name}</Text>
              <Text style={[Typography.caption, { color: Colors.status.success }]}>{CURRENT_PLAN.status}</Text>
            </View>
            <View style={[styles.freeBadge, { backgroundColor: Colors.status.infoSoft }]}>
              <Text style={[Typography.micro, { color: Colors.status.info }]}>BETA</Text>
            </View>
          </View>

          <Text style={[Typography.body, { color: colors.textMuted, marginTop: Spacing.md }]}>
            {CURRENT_PLAN.description}
          </Text>

          <View style={styles.featureList}>
            {CURRENT_PLAN.features.map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <CheckCircle2 size={16} color={Colors.status.success} strokeWidth={2.2} />
                <Text style={[Typography.caption, { color: colors.text, flex: 1 }]}>{feature}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.upgradeBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <CreditCard size={18} color={colors.textMuted} strokeWidth={2} />
            <Text style={[Typography.caption, { color: colors.textMuted, flex: 1 }]}>
              Planos Basic e Pro com pagamento ficarao disponiveis em uma proxima fase.
            </Text>
          </View>
        </View>

{biometricAvailable && (
          <>
            <SectionTitle label="Seguranca" />
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.toggleRow}>
                <View style={[styles.iconWrap, { backgroundColor: Colors.brand.primarySoft }]}>
                  <Fingerprint size={20} color={Colors.brand.primary} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[Typography.bodyStrong, { color: colors.text }]}>
                    Login por {biometricLabel}
                  </Text>
                  <Text style={[Typography.caption, { color: colors.textMuted }]}>
                    {biometricEnabled
                      ? 'Ativo — entre sem digitar senha'
                      : isEmailUser
                        ? 'Ative no proximo login com e-mail'
                        : 'Disponivel apenas para conta e-mail'}
                  </Text>
                </View>
                <Switch
                  value={biometricEnabled}
                  onValueChange={handleToggleBiometric}
                  trackColor={{ true: Colors.brand.primary, false: undefined }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          </>
        )}

        <SectionTitle label="Sessao" />
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <InfoRow icon={ShieldCheck} label="Ultimo acesso" value={formatDate(user?.last_sign_in_at)} last />
        </View>

        <Button
          label="Sair"
          variant="danger"
          icon={LogOut}
          onPress={handleSignOut}
          accessibilityHint="Encerra a sessao do administrador neste aparelho"
        />
      </ScrollView>
    </View>
  );
}

function SectionTitle({ label }: { label: string }) {
  const { colors } = useColorScheme();
  return (
    <Text style={[Typography.caption, styles.sectionTitle, { color: colors.textMuted }]}>
      {label.toUpperCase()}
    </Text>
  );
}


function InfoRow({
  icon: Icon,
  label,
  value,
  last,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  last?: boolean;
}) {
  const { colors } = useColorScheme();
  return (
    <View style={[styles.infoRow, !last && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
      <Icon size={18} color={colors.textMuted} strokeWidth={2} />
      <View style={{ flex: 1 }}>
        <Text style={[Typography.caption, { color: colors.textMuted }]}>{label}</Text>
        <Text style={[Typography.bodyStrong, { color: colors.text }]} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.sm,
  },
  sectionTitle: {
    letterSpacing: 0.5,
    marginTop: Spacing.md,
  },
  card: {
    borderWidth: 1,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  infoRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  planCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  planIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freeBadge: {
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  featureList: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  upgradeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 64,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
