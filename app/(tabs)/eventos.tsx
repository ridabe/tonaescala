import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, Radius } from '@/constants/Theme';

export default function EventosScreen() {
  const { colors } = useColorScheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[Typography.titleMd, { color: colors.text }]}>Eventos</Text>
        <TouchableOpacity style={[styles.fab, { backgroundColor: Colors.brand.primary }]}>
          <Plus size={20} color="#FFF" strokeWidth={2} />
        </TouchableOpacity>
      </View>
      <View style={styles.empty}>
        <Text style={[Typography.body, { color: colors.textMuted, textAlign: 'center' }]}>
          Nenhum evento criado.{'\n'}Toque em + para criar o primeiro.
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
  },
  fab: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
});
