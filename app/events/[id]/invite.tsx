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
import { Copy, RefreshCw, Share2 } from 'lucide-react-native';
import { fetchEventById, generateInvite } from '@/lib/events';
import type { Event } from '@/lib/types';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, Radius } from '@/constants/Theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button } from '@/components/Button';

export default function InviteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, scheme } = useColorScheme();
  const [event, setEvent] = useState<Event | null>(null);
  const [rotating, setRotating] = useState(false);

  useEffect(() => {
    if (id) fetchEventById(id).then(setEvent);
  }, [id]);

  async function handleShare() {
    if (!event?.invite_code) return;
    try {
      await Share.share({
        message: `Entre no evento "${event.title}" pelo ToNaEscala!\n\nCódigo: ${event.invite_code}`,
        title: `Convite — ${event.title}`,
      });
    } catch {
      // user dismissed
    }
  }

  async function handleCopy() {
    if (!event?.invite_code) return;
    Clipboard.setString(event.invite_code);
    Alert.alert('Copiado!', `Código ${event.invite_code} copiado.`);
  }

  async function handleRotate() {
    Alert.alert(
      'Gerar novo código',
      'O código atual deixará de funcionar. Quem ainda não entrou precisará do novo código.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Gerar novo',
          style: 'destructive',
          onPress: async () => {
            setRotating(true);
            try {
              const newCode = await generateInvite(id!);
              setEvent((prev) => prev ? { ...prev, invite_code: newCode } : prev);
            } catch (e: any) {
              Alert.alert('Erro', e.message);
            } finally {
              setRotating(false);
            }
          },
        },
      ],
    );
  }

  const primary = Colors.brand.primary;
  const inviteCode = event?.invite_code ?? '';
  const qrBg = scheme === 'dark' ? '#1F2937' : '#FFFFFF';
  const qrFg = scheme === 'dark' ? '#F8FAFC' : '#0F172A';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Convite do evento" />

      <View style={styles.content}>
        {/* Event name */}
        <Text style={[Typography.titleSm, { color: colors.text, textAlign: 'center' }]}>
          {event?.title ?? ''}
        </Text>

        {/* QR Code */}
        <View style={[styles.qrWrapper, { backgroundColor: qrBg }]}>
          {inviteCode ? (
            <QRCode
              value={inviteCode}
              size={220}
              color={qrFg}
              backgroundColor={qrBg}
            />
          ) : (
            <View style={styles.qrPlaceholder}>
              <Text style={[Typography.body, { color: colors.textMuted }]}>Gerando QR Code…</Text>
            </View>
          )}
        </View>

        {/* Code text */}
        <View style={[styles.codeBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[Typography.display, { color: primary, letterSpacing: 4, textAlign: 'center' }]}>
            {inviteCode || '—'}
          </Text>
          <Text style={[Typography.caption, { color: colors.textMuted, textAlign: 'center', marginTop: Spacing.xs }]}>
            Compartilhe este código com os participantes
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button label="Compartilhar" icon={Share2} onPress={handleShare} />

          <View style={styles.secondaryActions}>
            <TouchableOpacity style={[styles.secondaryBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={handleCopy}>
              <Copy size={18} color={colors.text} strokeWidth={2} />
              <Text style={[Typography.bodyStrong, { color: colors.text }]}>Copiar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleRotate}
              disabled={rotating}
            >
              <RefreshCw size={18} color={colors.textMuted} strokeWidth={2} />
              <Text style={[Typography.bodyStrong, { color: colors.textMuted }]}>Novo código</Text>
            </TouchableOpacity>
          </View>
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
});
