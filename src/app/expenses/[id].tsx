import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { api, Payment } from '@/api';
import { confirm, notify } from '@/confirm';
import { Badge, Button, Card, colors, Empty, ErrorBox, Loading, Muted, Row, Screen, Title } from '@/components/ui';
import { money } from '@/format';
import { useLoader } from '@/useLoader';

async function loadExpense(id: number) {
  const expense = await api.expenses.get(id);
  const event = await api.events.get(expense.event_id);
  return { expense, isOpen: event.status === 'open' };
}

export default function ExpenseDetailScreen() {
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const { data, error, reload } = useLoader(() => loadExpense(id), [id]);

  if (!data) {
    return (
      <Screen>
        <ErrorBox message={error} />
        {!error && <Loading />}
      </Screen>
    );
  }
  const { expense, isOpen } = data;
  const progress = expense.amount ? Math.min(expense.paid_amount / expense.amount, 1) : 0;

  async function removeExpense() {
    if (await confirm('Eliminar gasto', `Se eliminará "${expense.description}" y sus pagos.`)) {
      try {
        await api.expenses.remove(id);
        router.back();
      } catch (e) {
        notify('No se pudo eliminar', (e as Error).message);
      }
    }
  }

  async function removePayment(p: Payment) {
    if (await confirm('Eliminar pago', `¿Eliminar el pago de ${p.member_name} por ${money(p.amount)}?`)) {
      try {
        await api.payments.remove(p.id);
        await reload();
      } catch (e) {
        notify('No se pudo eliminar', (e as Error).message);
      }
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: expense.description }} />
      <Card>
        <Row>
          <Title>{expense.description}</Title>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>{money(expense.amount)}</Text>
        </Row>
        {(expense.created_by_email || expense.created_by_name) && (
          <Muted>Cargado por {expense.created_by_email ?? expense.created_by_name}</Muted>
        )}
        <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden', marginTop: 6 }}>
          <View
            style={{
              width: `${progress * 100}%`,
              height: '100%',
              backgroundColor: expense.is_covered ? colors.success : colors.primary,
            }}
          />
        </View>
        <Row>
          <Muted>Pagado {money(expense.paid_amount)}</Muted>
          {expense.is_covered ? (
            <Badge label="Cubierto" color={colors.success} />
          ) : (
            <Badge label={`Faltan ${money(expense.pending_amount)}`} color={colors.warning} />
          )}
        </Row>
        {isOpen && (
          <Row style={{ justifyContent: 'flex-start', marginTop: 6 }}>
            <Button small variant="secondary" title="Editar" onPress={() => router.push(`/expense-form?id=${id}`)} />
            <Button small variant="danger" title="Eliminar" onPress={removeExpense} />
          </Row>
        )}
      </Card>

      <Title>Pagos</Title>
      {isOpen && !expense.is_covered && (
        <Button title="+ Agregar pago" onPress={() => router.push(`/payment-form?expenseId=${id}`)} />
      )}
      {expense.payments.length === 0 && <Empty text="Todavía nadie pagó este gasto." />}
      {expense.payments.map((p) => (
        <Card key={p.id}>
          <Row>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', color: colors.text }}>{p.member_name}</Text>
              <Muted>{money(p.amount)}</Muted>
            </View>
            {isOpen && (
              <Row>
                <Button
                  small
                  variant="secondary"
                  title="Editar"
                  onPress={() => router.push(`/payment-form?expenseId=${id}&id=${p.id}`)}
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
