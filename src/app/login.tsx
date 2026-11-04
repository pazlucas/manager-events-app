import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { api } from '@/api';
import { useAuth } from '@/auth/AuthContext';
import { GoogleButton, googleAvailable } from '@/auth/GoogleButton';
import { Button, Card, colors, ErrorBox, Field, Muted, Screen } from '@/components/ui';

type Mode = 'login' | 'register';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isRegister = mode === 'register';
  const canSubmit = email.trim() && password && (!isRegister || name.trim());

  async function submit() {
    if (isRegister && password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const auth = isRegister
        ? await api.auth.register({ name: name.trim(), email: email.trim(), password })
        : await api.auth.login({ email: email.trim(), password });
      await signIn(auth);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  async function signInWithGoogle(idToken: string) {
    setError(null);
    await signIn(await api.auth.google(idToken));
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.appName}>Gastos de Eventos</Text>
        <Muted>Dividí los gastos de tus eventos sin vueltas.</Muted>
      </View>

      <Card style={{ gap: 14, padding: 18 }}>
        <View style={styles.tabs}>
          {(
            [
              ['login', 'Ingresar'],
              ['register', 'Crear cuenta'],
            ] as [Mode, string][]
          ).map(([key, label]) => (
            <Pressable key={key} onPress={() => switchMode(key)} style={[styles.tab, mode === key && styles.tabActive]}>
              <Text style={[styles.tabText, mode === key && { color: colors.primary }]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {isRegister && <Field label="Nombre" value={name} onChangeText={setName} autoComplete="name" />}
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <Field
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          placeholder={isRegister ? 'Mínimo 8 caracteres' : undefined}
          onSubmitEditing={() => canSubmit && submit()}
        />
        <ErrorBox message={error} />
        <Button
          title={isRegister ? 'Crear cuenta' : 'Ingresar'}
          onPress={submit}
          loading={busy}
          disabled={!canSubmit}
        />

        <GoogleSection onIdToken={signInWithGoogle} onError={setError} />
      </Card>
    </Screen>
  );
}

function GoogleSection(props: { onIdToken: (idToken: string) => Promise<void>; onError: (m: string) => void }) {
  if (!googleAvailable) return null;
  return (
    <>
      <View style={styles.divider}>
        <View style={styles.line} />
        <Muted>o</Muted>
        <View style={styles.line} />
      </View>
      <GoogleButton {...props} />
    </>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: 6, marginTop: 32, marginBottom: 8 },
  appName: { fontSize: 26, fontWeight: '800', color: colors.text },
  tabs: { flexDirection: 'row', backgroundColor: colors.bg, borderRadius: 10, padding: 4 },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: colors.card },
  tabText: { fontWeight: '600', color: colors.muted },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
});
