import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { api, DebtPayment, paymentMethodLabel } from '@/api';
import { confirm, notify } from '@/confirm';
import { Badge, Button, Card, colors, Empty, ErrorBox, Loading, Muted, Row, Screen, Title } from '@/components/ui';
import { formatDate, money } from '@/format';
import { useLoader } from '@/useLoader';

export default function DebtDetailScreen() {
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const { data: debt, error, reload } = useLoader(() => api.debts.get(id), [id]);

  if (!debt) {
    return (
      <Screen>
        <ErrorBox message={error} />
        {!error && <Loading />}
      </Screen>
    );
  }
  const settled = debt.status === 'saldada';
  const progress = Math.min(debt.paid_amount / debt.amount, 1);

  async function removePayment(p: DebtPayment) {
    if (await confirm('Eliminar pago', `¿Eliminar el pago de ${money(p.amount)}?`)) {
      try {
        await api.debts.removePayment(p.id);
        await reload();
      } catch (e) {
        notify('No se pudo eliminar', (e as Error).message);
      }
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Deuda a saldar' }} />
      <Card>
        <Row>
          <Text style={{ color: colors.text, flex: 1, fontSize: 16 }}>
            <Text style={{ fontWeight: '700', color: colors.danger }}>{debt.from_member_name}</Text> le debe a{' '}
            <Text style={{ fontWeight: '700', color: colors.success }}>{debt.to_member_name}</Text>
          </Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>{money(debt.amount)}</Text>
        </Row>
        <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden', marginTop: 6 }}>
          <View
            style={{
              width: `${progress * 100}%`,
              height: '100%',
              backgroundColor: settled ? colors.success : colors.primary,
            }}
          />
        </View>
        <Row>
          <Muted>
            Pagado {money(debt.paid_amount)}
            {!settled && ` · faltan ${money(debt.pending_amount)}`}
          </Muted>
          <Badge label={settled ? 'Saldada' : 'Pendiente'} color={settled ? colors.success : colors.warning} />
        </Row>
        {settled && debt.settled_at && <Muted>Saldada el {formatDate(debt.settled_at)}</Muted>}
      </Card>

      <Title>Pagos de {debt.from_member_name}</Title>
      {debt.can_pay && !settled && (
        <Button title="+ Registrar pago" onPress={() => router.push(`/debt-payment-form?debtId=${id}`)} />
      )}
      {!debt.can_pay && (
        <Muted>Solo {debt.from_member_name}, {debt.to_member_name} o el creador del evento pueden registrar pagos.</Muted>
      )}
      {debt.payments.length === 0 && <Empty text="Todavía no hay pagos de esta deuda." />}
      {debt.payments.map((p) => (
        <Card key={p.id}>
          <Row>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', color: colors.text }}>{money(p.amount)}</Text>
              <Muted>
                {[p.payment_date && formatDate(p.payment_date), paymentMethodLabel(p.payment_method)]
                  .filter(Boolean)
                  .join(' · ') || 'Sin fecha'}
              </Muted>
              {p.created_by_email && <Muted>Registrado por {p.created_by_email}</Muted>}
            </View>
            {debt.can_pay && (
              <Row>
                <Button
                  small
                  variant="secondary"
                  title="Editar"
                  onPress={() => router.push(`/debt-payment-form?debtId=${id}&id=${p.id}`)}
                />
                <Button small variant="danger" title="Quitar" onPress={() => removePayment(p)} />
              </Row>
            )}
          </Row>
        </Card>
      ))}
    </Screen>
  );
}
