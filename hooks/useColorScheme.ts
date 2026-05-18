import { useColorScheme as useNativeColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

export function useColorScheme() {
  const scheme = useNativeColorScheme() ?? 'light';
  const colors = scheme === 'dark' ? Colors.dark : Colors.light;
  return { scheme, colors };
}
