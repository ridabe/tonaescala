import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, Radius, Layout } from '@/constants/Theme';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon: Icon,
  fullWidth = true,
  accessibilityLabel,
  accessibilityHint,
}: Props) {
  const { colors } = useColorScheme();
  const primary = Colors.brand.primary;

  const bg: Record<Variant, string> = {
    primary: primary,
    outline: 'transparent',
    ghost: 'transparent',
    danger: Colors.status.danger,
  };

  const textColor: Record<Variant, string> = {
    primary: '#FFFFFF',
    outline: primary,
    ghost: colors.textMuted,
    danger: '#FFFFFF',
  };

  const borderColor: Record<Variant, string | undefined> = {
    primary: undefined,
    outline: primary,
    ghost: undefined,
    danger: undefined,
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        styles.base,
        { backgroundColor: bg[variant], alignSelf: fullWidth ? 'stretch' : 'flex-start' },
        borderColor[variant] ? { borderWidth: 1, borderColor: borderColor[variant] } : undefined,
        isDisabled && styles.disabled,
      ]}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator color={textColor[variant]} size="small" />
      ) : (
        <>
          {Icon && <Icon size={18} color={textColor[variant]} strokeWidth={2} style={styles.icon} />}
          <Text style={[Typography.bodyStrong, { color: textColor[variant] }]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Layout.minTouchTarget,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
  },
  disabled: { opacity: 0.5 },
  icon: {},
});
