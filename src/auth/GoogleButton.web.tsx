import { useEffect, useRef } from 'react';
import { View } from 'react-native';

// Web: se usa Google Identity Services, que entrega el ID token directamente en el callback.
const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
export const googleAvailable = !!clientId;
const SCRIPT_URL = 'https://accounts.google.com/gsi/client';

interface GoogleIdentity {
  accounts: {
    id: {
      initialize(options: { client_id: string; callback: (r: { credential: string }) => void }): void;
      renderButton(el: HTMLElement, options: Record<string, unknown>): void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

let scriptPromise: Promise<void> | null = null;
function loadScript(): Promise<void> {
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('No se pudo cargar el login de Google'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function GoogleButton({
  onIdToken,
  onError,
}: {
  onIdToken: (idToken: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  // En react-native-web, la ref de un View es el elemento del DOM.
  const container = useRef<HTMLElement | null>(null);
  // El callback de Google se registra una sola vez; se lee siempre la versión actual de las props.
  const handlers = useRef({ onIdToken, onError });
  handlers.current = { onIdToken, onError };

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        const el = container.current;
        if (cancelled || !el || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: ({ credential }) =>
            handlers.current.onIdToken(credential).catch((e) => handlers.current.onError(e.message)),
        });
        window.google.accounts.id.renderButton(el, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          locale: 'es',
          width: Math.min(el.offsetWidth || 320, 400),
        });
      })
      .catch((e) => handlers.current.onError(e.message));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!clientId) return null;
  return (
    <View
      ref={(el) => {
        container.current = el as unknown as HTMLElement | null;
      }}
      style={{ alignItems: 'center', minHeight: 44 }}
    />
  );
}
