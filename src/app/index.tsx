import { router, Stack } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { api, EventItem } from '@/api';
import { useAuth } from '@/auth/AuthContext';
import { confirm } from '@/confirm';
import { Badge, Button, Card, colors, Empty, ErrorBox, Loading, Muted, Row, Screen, Title } from '@/components/ui';
import { formatDate, money } from '@/format';
import { useLoader } from '@/useLoader';

async function loadEvents() {
  const [owned, member] = await Promise.all([api.events.list('owner'), api.events.list('member')]);
  return { owned, member };
}

export default function EventsScreen() {
  const { data, error } = useLoader(loadEvents, []);
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
      <ErrorBox message={error} />
      {!data && !error && <Loading />}

      {data && (
        <>
          <SectionTitle>Mis eventos</SectionTitle>
          <Button title="+ Nuevo evento" onPress={() => router.push('/event-form')} />
          {data.owned.length === 0 && <Empty text="Todavía no creaste eventos. ¡Creá el primero!" />}
          {data.owned.map((ev) => (
            <EventCard key={ev.id} event={ev} />
          ))}

          <SectionTitle>Eventos en los que soy miembro</SectionTitle>
          {data.member.length === 0 && (
            <Empty text={`Cuando alguien te agregue a un evento con tu email (${user?.email}), va a aparecer acá.`} />
          )}
          {data.member.map((ev) => (
            <EventCard key={ev.id} event={ev} />
          ))}
        </>
      )}
    </Screen>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>{children}</Text>
    </View>
  );
}

function EventCard({ event: ev }: { event: EventItem }) {
  return (
    <Card onPress={() => router.push(`/events/${ev.id}`)}>
      <Row>
        <Title>{ev.name}</Title>
        <Badge
          label={ev.status === 'open' ? 'Abierto' : 'Cerrado'}
          color={ev.status === 'open' ? colors.success : colors.muted}
        />
      </Row>
      {ev.role === 'member' && ev.owner_name && <Muted>Creado por {ev.owner_name}</Muted>}
      {ev.event_date && <Muted>{formatDate(ev.event_date)}</Muted>}
      <Row>
        <Muted>
          {ev.member_count} miembros · {ev.expense_count} gastos
        </Muted>
        <Text style={{ fontWeight: '700', color: colors.text }}>{money(ev.total_amount)}</Text>
      </Row>
    </Card>
  );
}
