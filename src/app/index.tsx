import { router } from 'expo-router';
import { Text } from 'react-native';

import { api } from '@/api';
import { Badge, Button, Card, colors, Empty, ErrorBox, Loading, Muted, Row, Screen, Title } from '@/components/ui';
import { formatDate, money } from '@/format';
import { useLoader } from '@/useLoader';

export default function EventsScreen() {
  const { data: events, error } = useLoader(api.events.list, []);

  return (
    <Screen>
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
