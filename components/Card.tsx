import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Radius, Spacing } from '@/constants/Theme';

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  leftAccent?: string;
};

export function Card({ children, onPress, leftAccent }: Props) {
  const { colors } = useColorScheme();

  const content = (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        leftAccent ? { borderLeftColor: leftAccent, borderLeftWidth: 3 } : undefined,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
  },
});
