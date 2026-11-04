import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useState } from 'react';

import { Button } from '@/components/ui';

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

// Expo Go no incluye el módulo nativo de Google: ahí el botón no se muestra.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export const googleAvailable = !!webClientId && !isExpoGo;

type GoogleSigninModule = typeof import('@react-native-google-signin/google-signin');

let googleModule: GoogleSigninModule | null = null;
function getGoogle(): GoogleSigninModule {
  if (!googleModule) {
    googleModule = require('@react-native-google-signin/google-signin') as GoogleSigninModule;
    googleModule.GoogleSignin.configure({ webClientId, iosClientId });
  }
  return googleModule;
}

export function GoogleButton({
  onIdToken,
  onError,
}: {
  onIdToken: (idToken: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  if (!googleAvailable) return null;

  async function signIn() {
    const { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } = getGoogle();
    setBusy(true);
    try {
      await GoogleSignin.hasPlayServices();
      const res = await GoogleSignin.signIn();
      if (!isSuccessResponse(res)) return; // el usuario canceló
      if (!res.data.idToken) throw new Error('Google no devolvió un token de identidad');
      await onIdToken(res.data.idToken);
    } catch (e) {
      if (isErrorWithCode(e) && e.code === statusCodes.IN_PROGRESS) return;
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return <Button title="Continuar con Google" variant="secondary" onPress={signIn} loading={busy} />;
}
