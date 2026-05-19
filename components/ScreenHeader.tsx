import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Typography, Spacing, Layout } from '@/constants/Theme';

type Props = {
  title: string;
  showBack?: boolean;
  right?: React.ReactNode;
};

export function ScreenHeader({ title, showBack = true, right }: Props) {
  const { colors } = useColorScheme();

  return (
    <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <ArrowLeft size={22} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={[Typography.titleSm, { color: colors.text }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.right}>{right ?? null}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: Layout.headerHeight,
    paddingTop: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
  },
  left: { width: 36, alignItems: 'flex-start' },
  right: { width: 36, alignItems: 'flex-end' },
  backBtn: { padding: 4 },
});
