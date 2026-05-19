import { StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Typography, Spacing } from '@/constants/Theme';
import { Button } from './Button';

type Props = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon: Icon, title, subtitle, actionLabel, onAction }: Props) {
  const { colors } = useColorScheme();

  return (
    <View style={styles.container}>
      <Icon size={48} color={colors.textSoft} strokeWidth={1.5} />
      <Text style={[Typography.titleSm, { color: colors.text, marginTop: Spacing.md }]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={[Typography.body, { color: colors.textMuted, textAlign: 'center', marginTop: Spacing.xs }]}>
          {subtitle}
        </Text>
      )}
      {actionLabel && onAction && (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} fullWidth={false} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  action: { marginTop: Spacing.lg },
});
