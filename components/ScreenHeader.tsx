import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { router, type Href } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, Layout } from '@/constants/Theme';

type Props = {
  title: string;
  showBack?: boolean;
  fallbackHref?: Href;
  right?: React.ReactNode;
};

export function ScreenHeader({ title, showBack = true, fallbackHref = '/(tabs)/agenda', right }: Props) {
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
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={8}>
            <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2} />
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
