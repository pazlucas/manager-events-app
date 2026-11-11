import { Stack } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, Text } from 'react-native';

import { api } from '@/api';
import { useAuth } from '@/auth/AuthContext';
import { confirm, notify } from '@/confirm';
import { Button, Card, colors, Label, Muted, Screen, Title } from '@/components/ui';
import { PRIVACY_URL } from '@/invite';

export default function AccountScreen() {
  const { user, signOut } = useAuth();
  const [deleting, setDeleting] = useState(false);
  if (!user) return null;

  const methods = [
    user.has_password && 'email y contraseña',
    user.has_google && 'Google',
    user.has_apple && 'Apple',
  ].filter(Boolean);

  async function logout() {
    if (await confirm('Cerrar sesión', `¿Salir de la cuenta ${user!.email}?`)) await signOut();
  }

  async function deleteAccount() {
    const ok = await confirm(
      'Eliminar cuenta',
      'Se eliminará tu cuenta y todos los eventos que creaste, con sus gastos y pagos. ' +
        'En los eventos de otras personas seguirás figurando como miembro para no alterar sus cuentas. ' +
        'Esta acción no se puede deshacer.',
    );
    if (!ok) return;
    setDeleting(true);
    try {
      await api.auth.deleteAccount();
      await signOut();
    } catch (e) {
      notify('No se pudo eliminar la cuenta', (e as Error).message);
      setDeleting(false);
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Mi cuenta' }} />
      <Card>
        <Title>{user.name}</Title>
        <Muted>{user.email}</Muted>
        <Muted>Ingresás con {methods.join(', ')}</Muted>
      </Card>
      <Button variant="secondary" title="Cerrar sesión" onPress={logout} />
      <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} style={{ alignSelf: 'center', padding: 8 }}>
        <Text style={{ color: colors.primary }}>Política de privacidad</Text>
      </Pressable>

      <Card style={{ marginTop: 24, borderColor: '#F3C4C4' }}>
        <Label>Eliminar cuenta</Label>
        <Muted>Borra tu cuenta y los eventos que creaste. No se puede deshacer.</Muted>
        <Button variant="danger" title="Eliminar mi cuenta" onPress={deleteAccount} loading={deleting} />
      </Card>
    </Screen>
  );
}
