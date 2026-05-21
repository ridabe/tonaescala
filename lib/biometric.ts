import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const KEY_ENABLED = 'biometric_enabled';
const KEY_CREDENTIALS = 'biometric_credentials';

export async function isBiometricAvailable(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) return false;
  return LocalAuthentication.isEnrolledAsync();
}

export async function isBiometricEnabled(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(KEY_ENABLED);
  return value === 'true';
}

export async function enableBiometric(email: string, password: string): Promise<void> {
  await SecureStore.setItemAsync(KEY_CREDENTIALS, JSON.stringify({ email, password }));
  await SecureStore.setItemAsync(KEY_ENABLED, 'true');
}

export async function disableBiometric(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY_CREDENTIALS);
  await SecureStore.setItemAsync(KEY_ENABLED, 'false');
}

export async function getStoredCredentials(): Promise<{ email: string; password: string } | null> {
  const raw = await SecureStore.getItemAsync(KEY_CREDENTIALS);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function authenticate(promptMessage = 'Entrar no ToNaEscala'): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: 'Cancelar',
    fallbackLabel: 'Usar senha',
    disableDeviceFallback: false,
  });
  return result.success;
}

export async function getBiometricLabel(): Promise<string> {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'Face ID';
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'Digital';
  return 'Biometria';
}
