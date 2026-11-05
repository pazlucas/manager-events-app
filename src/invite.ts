import { Platform } from 'react-native';

// Los links de invitación siempre abren la versión web, donde la persona se registra o ingresa.
const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL ?? 'https://manager-event.netlify.app').replace(/\/$/, '');

export function inviteUrl(token: string): string {
  const base = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : WEB_URL;
  return `${base}/invite/${token}`;
}

// Invitación pendiente mientras la persona inicia sesión o crea su cuenta. En web se guarda en
// localStorage para que sobreviva a una recarga; en el teléfono alcanza con memoria.
const KEY = 'pendingInvite';
let pending: string | null = null;

function storage(): Storage | null {
  try {
    return Platform.OS === 'web' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function savePendingInvite(token: string) {
  pending = token;
  try {
    storage()?.setItem(KEY, token);
  } catch {}
}

/** Devuelve la invitación pendiente (si hay) y la borra. */
export function takePendingInvite(): string | null {
  let token = pending;
  try {
    token = token ?? storage()?.getItem(KEY) ?? null;
    storage()?.removeItem(KEY);
  } catch {}
  pending = null;
  return token;
}
