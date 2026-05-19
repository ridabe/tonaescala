import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { reportError } from '@/lib/errorReporting';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing } from '@/constants/Theme';

type Props = { children: React.ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    reportError(error, { componentStack: info.componentStack ?? '' });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={[Typography.titleSm, styles.title]}>Algo inesperado aconteceu</Text>
          <Text style={[Typography.body, styles.subtitle]}>
            O app encontrou um erro. Toque abaixo para tentar novamente.
          </Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => this.setState({ hasError: false })}
            accessibilityRole="button"
            accessibilityLabel="Tentar novamente"
          >
            <Text style={[Typography.bodyStrong, { color: '#FFF' }]}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: '#F8FAFC',
  },
  title: {
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    color: '#64748B',
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  btn: {
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 8,
  },
});
