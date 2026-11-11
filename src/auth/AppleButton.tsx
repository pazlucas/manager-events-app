import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

/** "Iniciar sesión con Apple": solo en iOS (lo exige la App Store al ofrecer login con Google). */
export function useAppleAvailable(): boolean {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    if (Platform.OS === 'ios') AppleAuthentication.isAvailableAsync().then(setAvailable, () => {});
  }, []);
  return available;
}

export function AppleButton({
  onCredential,
  onError,
}: {
  onCredential: (identityToken: string, name: string | null) => Promise<void>;
  onError: (message: string) => void;
}) {
  async function signIn() {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) throw new Error('Apple no devolvió un token de identidad');
      // Apple entrega el nombre solo la primera vez que la persona autoriza la app.
      const name = credential.fullName ? AppleAuthentication.formatFullName(credential.fullName) : '';
      await onCredential(credential.identityToken, name.trim() || null);
    } catch (e) {
      if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return;
      onError((e as Error).message);
    }
  }

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={10}
      style={{ height: 46, width: '100%' }}
      onPress={signIn}
    />
  );
}
