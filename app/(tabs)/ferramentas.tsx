import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import {
  BarChart3,
  BookUser,
  Guitar,
  Music,
} from 'lucide-react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, Radius } from '@/constants/Theme';

type Tool = {
  icon: typeof Guitar;
  label: string;
  description: string;
  color: string;
  softColor: string;
  href: string;
};

const TOOLS: Tool[] = [
  {
    icon: Music,
    label: 'Repertório',
    description: 'Gerencie o catálogo de músicas da sua organização',
    color: Colors.brand.primary,
    softColor: Colors.brand.primarySoft,
    href: '/musicas',
  },
  {
    icon: BookUser,
    label: 'Contatos',
    description: 'Pessoas salvas para escalar rapidamente',
    color: Colors.brand.accent,
    softColor: Colors.brand.accentSoft,
    href: '/contatos',
  },
  {
    icon: Guitar,
    label: 'Afinador',
    description: 'Afinador cromático para músicos',
    color: Colors.status.success,
    softColor: Colors.status.successSoft,
    href: '/afinador',
  },
  {
    icon: BarChart3,
    label: 'Insights',
    description: 'Métricas e estatísticas dos seus eventos',
    color: Colors.status.info,
    softColor: Colors.status.infoSoft,
    href: '/(tabs)/insights',
  },
];

export default function FerramentasScreen() {
  const { colors } = useColorScheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: Colors.brand.primary, borderBottomColor: Colors.brand.primaryPressed }]}>
        <Text style={[Typography.titleMd, { color: '#FFFFFF' }]}>Ferramentas</Text>
        <Text style={[Typography.caption, { color: Colors.brand.primarySoft, marginTop: 2 }]}>
          Recursos para organizar sua equipe e repertório
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {TOOLS.map((tool) => (
          <ToolCard key={tool.label} tool={tool} colors={colors} />
        ))}
      </ScrollView>
    </View>
  );
}

function ToolCard({
  tool,
  colors,
}: {
  tool: Tool;
  colors: ReturnType<typeof import('@/hooks/useColorScheme').useColorScheme>['colors'];
}) {
  const Icon = tool.icon;
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => router.push(tool.href as any)}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={tool.label}
    >
      <View style={[styles.iconWrap, { backgroundColor: tool.softColor }]}>
        <Icon size={28} color={tool.color} strokeWidth={2} />
      </View>
      <Text style={[Typography.bodyStrong, { color: colors.text, marginTop: Spacing.md }]}>
        {tool.label}
      </Text>
      <Text style={[Typography.caption, { color: colors.textMuted, marginTop: Spacing.xs }]}>
        {tool.description}
      </Text>
    </TouchableOpacity>
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
  grid: {
    padding: Spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  card: {
    width: '47%',
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    minHeight: 150,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
