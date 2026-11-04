import { router, Stack } from 'expo-router';
import { Pressable, Text } from 'react-native';

import { api } from '@/api';
import { useAuth } from '@/auth/AuthContext';
import { confirm } from '@/confirm';
import { Badge, Button, Card, colors, Empty, ErrorBox, Loading, Muted, Row, Screen, Title } from '@/components/ui';
import { formatDate, money } from '@/format';
import { useLoader } from '@/useLoader';

export default function EventsScreen() {
  const { data: events, error } = useLoader(api.events.list, []);
  const { user, signOut } = useAuth();

  async function logout() {
    if (await confirm('Cerrar sesión', `¿Salir de la cuenta ${user?.email}?`)) await signOut();
  }

  return (
    <Screen>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={logout} hitSlop={8} style={{ paddingHorizontal: 8 }}>
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Salir</Text>
            </Pressable>
          ),
        }}
      />
      {user && <Muted>Hola, {user.name}</Muted>}
      <Button title="+ Nuevo evento" onPress={() => router.push('/event-form')} />
      <ErrorBox message={error} />
      {!events && !error && <Loading />}
      {events?.length === 0 && <Empty text="Todavía no hay eventos. ¡Creá el primero!" />}
      {events?.map((ev) => (
        <Card key={ev.id} onPress={() => router.push(`/events/${ev.id}`)}>
          <Row>
            <Title>{ev.name}</Title>
            <Badge
              label={ev.status === 'open' ? 'Abierto' : 'Cerrado'}
              color={ev.status === 'open' ? colors.success : colors.muted}
            />
          </Row>
          {ev.event_date && <Muted>{formatDate(ev.event_date)}</Muted>}
          <Row>
            <Muted>
              {ev.member_count} miembros · {ev.expense_count} gastos
            </Muted>
            <Text style={{ fontWeight: '700', color: colors.text }}>{money(ev.total_amount)}</Text>
          </Row>
        </Card>
      ))}
    </Screen>
  );
}
