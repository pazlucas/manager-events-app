import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@/components/ui';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Mis eventos' }} />
        <Stack.Screen name="events/[id]" options={{ title: 'Evento' }} />
        <Stack.Screen name="expenses/[id]" options={{ title: 'Gasto' }} />
        <Stack.Screen name="event-form" options={{ presentation: 'modal', title: 'Evento' }} />
        <Stack.Screen name="member-form" options={{ presentation: 'modal', title: 'Miembro' }} />
        <Stack.Screen name="expense-form" options={{ presentation: 'modal', title: 'Gasto' }} />
        <Stack.Screen name="payment-form" options={{ presentation: 'modal', title: 'Pago' }} />
      </Stack>
    </>
  );
}
