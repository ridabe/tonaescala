import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { router, type Href } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, Layout } from '@/constants/Theme';

type Props = {
  title: string;
  showBack?: boolean;
  backLabel?: string;
  fallbackHref?: Href;
  right?: React.ReactNode;
};

export function ScreenHeader({ title, showBack = true, backLabel = 'Voltar', fallbackHref = '/agenda', right }: Props) {
  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(fallbackHref);
  }

  return (
    <View style={[styles.header, { backgroundColor: Colors.brand.primary, borderBottomColor: Colors.brand.primaryPressed }]}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={8} accessibilityRole="button" accessibilityLabel={backLabel}>
            <ChevronLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.backLabel}>{backLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={[Typography.titleSm, { color: '#FFFFFF' }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.right}>{right ?? null}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: Layout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
  },
  left: { flex: 1, alignItems: 'flex-start' },
  right: { flex: 1, alignItems: 'flex-end', paddingRight: Spacing.sm },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    gap: 2,
  },
  backLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});
