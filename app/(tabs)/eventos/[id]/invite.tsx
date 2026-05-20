import { useEffect, useState } from 'react';
import {
  Alert,
  Clipboard,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { Copy, RefreshCw, Share2, Trash2 } from 'lucide-react-native';
import { fetchEventById, generateInvite, revokeInvite } from '@/lib/events';
import type { Event } from '@/lib/types';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, Radius } from '@/constants/Theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button } from '@/components/Button';

export default function InviteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useColorScheme();
  const [event, setEvent] = useState<Event | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) fetchEventById(id).then(setEvent);
  }, [id]);

  async function handleShare() {
    if (!event?.invite_code) return;
    try {
      await Share.share({
        message: `Entre no evento "${event.title}" pelo ToNaEscala!\n\nCodigo: ${event.invite_code}`,
        title: `Convite - ${event.title}`,
      });
    } catch {
      // User dismissed the native sheet.
    }
  }

  async function handleCopy() {
    if (!event?.invite_code) return;
    Clipboard.setString(event.invite_code);
    Alert.alert('Copiado', `Codigo ${event.invite_code} copiado.`);
  }

  async function handleRotate() {
    Alert.alert(
      'Gerar novo codigo',
      'O codigo atual deixara de funcionar. Quem ainda nao entrou precisara do novo codigo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Gerar novo',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              const newCode = await generateInvite(id!);
              setEvent((prev) => prev ? { ...prev, invite_code: newCode } : prev);
            } catch (e: any) {
              Alert.alert('Erro', e.message ?? 'Nao foi possivel gerar o convite.');
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  }

  async function handleRevoke() {
    if (!event?.invite_code) return;
    Alert.alert(
      'Remover convite',
      'O codigo atual deixara de funcionar. Escalados ainda existentes precisarao de um novo codigo para acessar.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              await revokeInvite(id!);
              setEvent((prev) => prev ? { ...prev, invite_code: null } : prev);
            } catch (e: any) {
              Alert.alert('Erro', e.message ?? 'Nao foi possivel remover o convite.');
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  }

  const primary = Colors.brand.primary;
  const inviteCode = event?.invite_code ?? '';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Convite do evento" fallbackHref={`/eventos/${id}`} />

      <View style={styles.content}>
        <Text style={[Typography.titleSm, { color: colors.text, textAlign: 'center' }]}>
          {event?.title ?? ''}
        </Text>

        <View style={[styles.qrWrapper, { backgroundColor: colors.surface }]}>
          {inviteCode ? (
            <QRCode
              value={inviteCode}
              size={220}
              color={Colors.light.text}
              backgroundColor={colors.surface}
            />
          ) : (
            <View style={styles.qrPlaceholder}>
              <Text style={[Typography.body, { color: colors.textMuted, textAlign: 'center' }]}>
                Convite removido
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.codeBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[Typography.display, { color: primary, letterSpacing: 4, textAlign: 'center' }]}>
            {inviteCode || '---'}
          </Text>
          <Text style={[Typography.caption, { color: colors.textMuted, textAlign: 'center', marginTop: Spacing.xs }]}>
            {inviteCode ? 'Compartilhe este codigo com os participantes' : 'Nenhum convite ativo'}
          </Text>
        </View>

        <View style={styles.actions}>
          {inviteCode ? (
            <Button label="Compartilhar" variant="accent" icon={Share2} onPress={handleShare} />
          ) : (
            <Button label="Gerar convite" variant="accent" icon={RefreshCw} onPress={handleRotate} loading={saving} />
          )}

          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={[styles.secondaryBtn, { backgroundColor: colors.surface, borderColor: colors.border, opacity: inviteCode ? 1 : 0.5 }]}
              onPress={handleCopy}
              disabled={!inviteCode}
              accessibilityRole="button"
              accessibilityLabel="Copiar codigo do convite"
            >
              <Copy size={18} color={colors.text} strokeWidth={2} />
              <Text style={[Typography.bodyStrong, { color: colors.text }]}>Copiar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleRotate}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Gerar novo codigo de convite"
            >
              <RefreshCw size={18} color={colors.textMuted} strokeWidth={2} />
              <Text style={[Typography.bodyStrong, { color: colors.textMuted }]}>Novo codigo</Text>
            </TouchableOpacity>
          </View>

          {inviteCode ? (
            <TouchableOpacity
              style={[styles.removeBtn, { borderColor: Colors.status.danger }]}
              onPress={handleRevoke}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Remover convite atual"
            >
              <Trash2 size={18} color={Colors.status.danger} strokeWidth={2} />
              <Text style={[Typography.bodyStrong, { color: Colors.status.danger }]}>Remover convite</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  qrWrapper: {
    padding: Spacing.xl,
    borderRadius: Radius.lg,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  qrPlaceholder: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeBox: {
    width: '100%',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  actions: { width: '100%', gap: Spacing.md },
  secondaryActions: { flexDirection: 'row', gap: Spacing.sm },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  removeBtn: {
    minHeight: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
});
