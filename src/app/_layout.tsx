import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { colors, Loading } from '@/components/ui';

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
        <Stack.Screen name="index" options={{ title: 'Mis eventos' }} />
        <Stack.Screen name="events/[id]" options={{ title: 'Evento' }} />
        <Stack.Screen name="expenses/[id]" options={{ title: 'Gasto' }} />
        <Stack.Screen name="event-form" options={{ presentation: 'modal', title: 'Evento' }} />
        <Stack.Screen name="member-form" options={{ presentation: 'modal', title: 'Miembro' }} />
        <Stack.Screen name="expense-form" options={{ presentation: 'modal', title: 'Gasto' }} />
        <Stack.Screen name="payment-form" options={{ presentation: 'modal', title: 'Pago' }} />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
