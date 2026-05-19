import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, Radius } from '@/constants/Theme';

const FRAME_SIZE = 260;
const CORNER_SIZE = 28;
const BORDER_W = 3;

export default function ScanQrScreen() {
  const { colors } = useColorScheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [validating, setValidating] = useState(false);

  const primary = Colors.brand.primary;

  async function handleBarcodeScan({ data }: { data: string }) {
    if (scanned || validating) return;
    setScanned(true);
    setValidating(true);

    const code = data.trim().toUpperCase();
    const { data: result, error } = await supabase.rpc('get_public_event_by_invite_code', {
      p_invite_code: code,
    });
    setValidating(false);

    if (error || !result?.length) {
      Alert.alert('QR Code inválido', 'Evento não encontrado ou convite expirado.', [
        { text: 'Tentar novamente', onPress: () => setScanned(false) },
      ]);
      return;
    }

    router.replace({ pathname: '/enter-event', params: { invite_code: code } });
  }

  if (!permission) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, padding: Spacing.xl }]}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <X size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={[Typography.titleSm, { color: colors.text, textAlign: 'center', marginBottom: Spacing.md }]}>
            Câmera necessária
          </Text>
          <Text style={[Typography.body, { color: colors.textMuted, textAlign: 'center', marginBottom: Spacing.xl }]}>
            Permita o acesso à câmera para escanear o QR Code do evento.
          </Text>
          <TouchableOpacity
            style={[styles.permBtn, { backgroundColor: primary }]}
            onPress={requestPermission}
          >
            <Text style={[Typography.bodyStrong, { color: '#FFF' }]}>Permitir câmera</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScan}
      />

      {/* Dark overlay */}
      <View style={styles.overlay}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <X size={24} color="#FFF" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={[Typography.bodyStrong, { color: '#FFF' }]}>Escanear QR Code</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Scanning frame */}
        <View style={styles.frameArea}>
          <View style={styles.frame}>
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
          </View>
        </View>

        {/* Bottom hint */}
        <View style={styles.bottomBar}>
          {validating ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={[Typography.body, { color: '#FFF', textAlign: 'center' }]}>
              Aponte para o QR Code do evento
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  closeBtn: { padding: 8 },
  frameArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: '#FFF',
  },
  tl: { top: 0, left: 0, borderTopWidth: BORDER_W, borderLeftWidth: BORDER_W, borderTopLeftRadius: Radius.sm },
  tr: { top: 0, right: 0, borderTopWidth: BORDER_W, borderRightWidth: BORDER_W, borderTopRightRadius: Radius.sm },
  bl: { bottom: 0, left: 0, borderBottomWidth: BORDER_W, borderLeftWidth: BORDER_W, borderBottomLeftRadius: Radius.sm },
  br: { bottom: 0, right: 0, borderBottomWidth: BORDER_W, borderRightWidth: BORDER_W, borderBottomRightRadius: Radius.sm },
  bottomBar: {
    padding: Spacing.xl,
    paddingBottom: 60,
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permBtn: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md,
  },
});
