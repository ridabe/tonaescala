import { useEffect, useRef } from 'react';
import { Animated, View, type ViewStyle } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Spacing, Radius } from '@/constants/Theme';

type Props = {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
};

export function SkeletonBlock({ width = '100%', height = 16, borderRadius = Radius.sm, style }: Props) {
  const { colors } = useColorScheme();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
    return () => anim.stopAnimation();
  }, [anim]);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] });

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: colors.border, opacity }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  const { colors } = useColorScheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: Radius.lg,
          padding: Spacing.md,
          gap: Spacing.sm,
        },
        style,
      ]}
    >
      <SkeletonBlock height={14} width="55%" />
      <SkeletonBlock height={12} width="35%" />
    </View>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <View style={{ gap: Spacing.sm, padding: Spacing.lg }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}
