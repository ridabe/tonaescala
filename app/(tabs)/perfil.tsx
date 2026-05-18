import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LogOut } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, Radius } from '@/constants/Theme';
import { supabase } from '@/lib/supabase';

export default function PerfilScreen() {
  const { colors } = useColorScheme();

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[Typography.titleMd, { color: colors.text }]}>Perfil</Text>
      </View>
      <View style={styles.content}>
        <TouchableOpacity
          style={[styles.signOutBtn, { borderColor: Colors.status.danger }]}
          onPress={handleSignOut}
        >
          <LogOut size={18} color={Colors.status.danger} strokeWidth={2} />
          <Text style={[Typography.bodyStrong, { color: Colors.status.danger, marginLeft: Spacing.sm }]}>
            Sair
          </Text>
        </TouchableOpacity>
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
  content: { padding: Spacing.lg },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: Spacing.lg,
  },
});
