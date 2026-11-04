// Web: no hay almacenamiento seguro del sistema, se usa localStorage.
const KEY = 'session';

export async function loadSession(): Promise<string | null> {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export async function saveSession(value: string): Promise<void> {
  try {
    window.localStorage.setItem(KEY, value);
  } catch {
    // Navegación privada o almacenamiento bloqueado: la sesión dura solo mientras la pestaña esté abierta.
  }
}

export async function clearSession(): Promise<void> {
  try {
    window.localStorage.removeItem(KEY);
  } catch {}
}
