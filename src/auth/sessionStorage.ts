import * as SecureStore from 'expo-secure-store';

// iOS / Android: la sesión se guarda cifrada en el Keychain / Keystore del dispositivo.
const KEY = 'session';

export async function loadSession(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY);
}

export async function saveSession(value: string): Promise<void> {
  await SecureStore.setItemAsync(KEY, value);
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY);
}
