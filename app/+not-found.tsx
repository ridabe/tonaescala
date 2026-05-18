import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Theme';

export default function NotFoundScreen() {
  const { colors } = useColorScheme();
  return (
    <>
      <Stack.Screen options={{ title: 'Página não encontrada' }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[Typography.titleSm, { color: colors.text }]}>Tela não encontrada.</Text>
        <Link href="/" style={styles.link}>
          <Text style={{ color: Colors.brand.primary, ...Typography.body }}>Voltar ao início</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  link: { marginTop: 16 },
});
