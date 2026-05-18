import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Typography, Spacing } from '@/constants/Theme';

export default function AgendaScreen() {
  const { colors } = useColorScheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[Typography.titleMd, { color: colors.text }]}>Agenda</Text>
      </View>
      <View style={styles.empty}>
        <Text style={[Typography.body, { color: colors.textMuted, textAlign: 'center' }]}>
          Nenhum compromisso por aqui.{'\n'}Entre em um evento com seu código.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
  },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
});
