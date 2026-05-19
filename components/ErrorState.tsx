import { StyleSheet, Text, View } from 'react-native';
import { AlertCircle, WifiOff } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Typography, Spacing } from '@/constants/Theme';
import { Colors } from '@/constants/Colors';
import { Button } from './Button';

type Props = {
  message?: string;
  offline?: boolean;
  onRetry?: () => void;
};

export function ErrorState({
  message = 'Não foi possível carregar os dados.',
  offline = false,
  onRetry,
}: Props) {
  const { colors } = useColorScheme();
  const Icon = offline ? WifiOff : AlertCircle;

  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      <Icon size={48} color={Colors.status.danger} strokeWidth={1.5} />
      <Text style={[Typography.titleSm, { color: colors.text, marginTop: Spacing.md }]}>
        {offline ? 'Sem conexão' : 'Algo deu errado'}
      </Text>
      <Text
        style={[Typography.body, { color: colors.textMuted, textAlign: 'center', marginTop: Spacing.xs }]}
      >
        {message}
      </Text>
      {onRetry && (
        <View style={{ marginTop: Spacing.lg }}>
          <Button
            label="Tentar novamente"
            onPress={onRetry}
            fullWidth={false}
            accessibilityLabel="Tentar carregar novamente"
          />
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
    padding: 40,
  },
});
