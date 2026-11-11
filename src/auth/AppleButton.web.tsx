// En web no se ofrece "Iniciar sesión con Apple" (la App Store solo lo exige en la app de iOS).
export function useAppleAvailable(): boolean {
  return false;
}

export function AppleButton(_: {
  onCredential: (identityToken: string, name: string | null) => Promise<void>;
  onError: (message: string) => void;
}) {
  return null;
}
