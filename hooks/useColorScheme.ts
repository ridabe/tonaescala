import { Colors } from '@/constants/Colors';

export function useColorScheme() {
  // The product direction and prototype define the MVP as a clear, clean
  // light interface. Keep the app stable even when the device uses dark mode.
  const scheme = 'light';
  const colors = Colors.light;
  return { scheme, colors };
}
