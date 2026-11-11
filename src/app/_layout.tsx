import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { api } from '@/api';
import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { colors, Loading } from '@/components/ui';
import { notify } from '@/confirm';
import { takePendingInvite } from '@/invite';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <RootStack />
    </AuthProvider>
  );
}

function RootStack() {
  const { loading, user } = useAuth();

  // Si la persona llegó por un link de invitación, al iniciar sesión se la suma al evento y se lo abre.
  useEffect(() => {
    if (loading || !user) return;
    const token = takePendingInvite();
    if (!token) return;
    api.invitations.accept(token).then(
      (event) => router.push(`/events/${event.id}`),
      (e) => notify('No se pudo aceptar la invitación', e.message),
    );
  }, [loading, user]);

  if (loading) return <Loading />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      {/* Sin sesión solo se puede acceder al login; con sesión, al resto de la app. */}
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="index" options={{ title: 'Gastos de Eventos' }} />
        <Stack.Screen name="events/[id]" options={{ title: 'Evento' }} />
        <Stack.Screen name="expenses/[id]" options={{ title: 'Gasto' }} />
        <Stack.Screen name="event-form" options={{ presentation: 'modal', title: 'Evento' }} />
        <Stack.Screen name="member-form" options={{ presentation: 'modal', title: 'Miembro' }} />
        <Stack.Screen name="expense-form" options={{ presentation: 'modal', title: 'Gasto' }} />
        <Stack.Screen name="payment-form" options={{ presentation: 'modal', title: 'Pago' }} />
        <Stack.Screen name="invite-share" options={{ presentation: 'modal', title: 'Invitar' }} />
        <Stack.Screen name="account" options={{ title: 'Mi cuenta' }} />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
      {/* El link de invitación funciona con o sin sesión. */}
      <Stack.Screen name="invite/[token]" options={{ title: 'Invitación' }} />
    </Stack>
  );
}
