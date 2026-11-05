import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { api, EventItem, Expense, Member, paymentMethodLabel, Summary } from '@/api';
import { confirm, notify } from '@/confirm';
import {
  Badge,
  Button,
  Card,
  colors,
  Empty,
  ErrorBox,
  Loading,
  Muted,
  Row,
  Screen,
  Title,
} from '@/components/ui';
import { formatDate, money } from '@/format';
import { useLoader } from '@/useLoader';

type Tab = 'members' | 'expenses' | 'summary';

interface EventData {
  event: EventItem;
  members: Member[];
  expenses: Expense[];
  summary: Summary | null;
}

async function loadEvent(id: number): Promise<EventData> {
  const [event, members, expenses] = await Promise.all([
    api.events.get(id),
    api.members.list(id),
    api.expenses.list(id),
  ]);
  // Sin miembros no hay resumen posible (la API responde 409).
  const summary = members.length ? await api.events.summary(id) : null;
  return { event, members, expenses, summary };
}

export default function EventDetailScreen() {
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const [tab, setTab] = useState<Tab>('expenses');
  const [busy, setBusy] = useState(false);
  const { data, error, reload } = useLoader(() => loadEvent(id), [id]);

  if (!data) {
    return (
      <Screen>
        <ErrorBox message={error} />
        {!error && <Loading />}
      </Screen>
    );
  }

  const { event, members, expenses, summary } = data;
  const isOpen = event.status === 'open';
  // Los miembros pueden cargar gastos y pagos; editar, cerrar o borrar el evento es solo del creador.
  const isOwner = event.role === 'owner';

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    try {
      await action();
      await reload();
    } catch (e) {
      notify('No se pudo completar', (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function closeEvent() {
    const ok = await confirm(
      'Cerrar evento',
      'Se calculará la liquidación final y no se podrán cargar más cambios hasta reabrirlo.',
    );
    if (ok) {
      await run(() => api.events.close(id));
      setTab('summary');
    }
  }

  async function reopenEvent() {
    if (await confirm('Reabrir evento', 'Se descartará el resumen final calculado.')) {
      await run(() => api.events.reopen(id));
    }
  }

  async function deleteEvent() {
    if (await confirm('Eliminar evento', `Se eliminará "${event.name}" con todos sus datos.`)) {
      try {
        await api.events.remove(id);
        router.back();
      } catch (e) {
        notify('No se pudo eliminar', (e as Error).message);
      }
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: event.name }} />

      <Card>
        <Row>
          <Title>{event.name}</Title>
          <Badge label={isOpen ? 'Abierto' : 'Cerrado'} color={isOpen ? colors.success : colors.muted} />
        </Row>
        {!isOwner && <Muted>Creado por {event.owner_name ?? 'otro usuario'} · Participás como miembro</Muted>}
        {event.event_date && <Muted>{formatDate(event.event_date)}</Muted>}
        {event.description && <Text style={{ color: colors.text }}>{event.description}</Text>}
        <Row style={{ marginTop: 4 }}>
          <Muted>Total de gastos</Muted>
          <Text style={styles.total}>{money(event.total_amount)}</Text>
        </Row>
        {isOwner && (
          <Row style={{ justifyContent: 'flex-start', marginTop: 6 }}>
            {isOpen && (
              <Button small variant="secondary" title="Editar" onPress={() => router.push(`/event-form?id=${id}`)} />
            )}
            {isOpen ? (
              <Button small title="Cerrar evento" onPress={closeEvent} loading={busy} />
            ) : (
              <Button small variant="secondary" title="Reabrir" onPress={reopenEvent} loading={busy} />
            )}
            <Button small variant="danger" title="Eliminar" onPress={deleteEvent} />
          </Row>
        )}
      </Card>

      <View style={styles.tabs}>
        {(
          [
            ['expenses', `Gastos (${expenses.length})`],
            ['members', `Miembros (${members.length})`],
            ['summary', 'Resumen'],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <Pressable key={key} onPress={() => setTab(key)} style={[styles.tab, tab === key && styles.tabActive]}>
            <Text style={[styles.tabText, tab === key && { color: colors.primary }]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {tab === 'members' && (
        <MembersTab eventId={id} members={members} canManage={isOpen && isOwner} onChange={(a) => run(a)} />
      )}
      {tab === 'expenses' && <ExpensesTab eventId={id} expenses={expenses} members={members} isOpen={isOpen} />}
      {tab === 'summary' && <SummaryTab summary={summary} />}
    </Screen>
  );
}

function MembersTab({
  eventId,
  members,
  canManage,
  onChange,
}: {
  eventId: number;
  members: Member[];
  canManage: boolean;
  onChange: (action: () => Promise<unknown>) => void;
}) {
  async function remove(m: Member) {
    if (await confirm('Eliminar miembro', `¿Eliminar a ${m.name} del evento?`)) {
      onChange(() => api.members.remove(m.id));
    }
  }

  return (
    <>
      {canManage && (
        <Row style={{ justifyContent: 'flex-start' }}>
          <Button title="+ Agregar miembro" onPress={() => router.push(`/member-form?eventId=${eventId}`)} />
          <Button
            variant="secondary"
            title="Invitar por WhatsApp o email"
            onPress={() => router.push(`/invite-share?eventId=${eventId}`)}
          />
        </Row>
      )}
      {members.length === 0 && <Empty text="Sumá a los participantes del evento." />}
      {members.map((m) => (
        <Card key={m.id}>
          <Row>
            <View style={{ flex: 1 }}>
              <Row style={{ justifyContent: 'flex-start' }}>
                <Title>{m.name}</Title>
                {m.is_owner && <Badge label="Creador" color={colors.primary} />}
              </Row>
              {m.email && <Muted>{m.email}</Muted>}
              <Muted>Pagó {money(m.total_paid)}</Muted>
            </View>
            {canManage && (
              <Row>
                <Button
                  small
                  variant="secondary"
                  title="Editar"
                  onPress={() => router.push(`/member-form?eventId=${eventId}&id=${m.id}`)}
                />
                {!m.is_owner && <Button small variant="danger" title="Quitar" onPress={() => remove(m)} />}
              </Row>
            )}
          </Row>
        </Card>
      ))}
    </>
  );
}

function ExpensesTab({
  eventId,
  expenses,
  members,
  isOpen,
}: {
  eventId: number;
  expenses: Expense[];
  members: Member[];
  isOpen: boolean;
}) {
  return (
    <>
      {isOpen &&
        (members.length ? (
          <Button title="+ Cargar gasto" onPress={() => router.push(`/expense-form?eventId=${eventId}`)} />
        ) : (
          <Muted>Agregá miembros antes de cargar gastos.</Muted>
        ))}
      {expenses.length === 0 && <Empty text="No hay gastos cargados." />}
      {expenses.map((e) => (
        <Card key={e.id} onPress={() => router.push(`/expenses/${e.id}`)}>
          <Row>
            <Title>{e.description}</Title>
            <Text style={styles.total}>{money(e.amount)}</Text>
          </Row>
          {(e.expense_date || e.payment_method) && (
            <Muted>
              {[e.expense_date && formatDate(e.expense_date), paymentMethodLabel(e.payment_method)]
                .filter(Boolean)
                .join(' · ')}
            </Muted>
          )}
          <Row>
            <Muted>
              {e.created_by_email || e.created_by_name
                ? `Cargado por ${e.created_by_email ?? e.created_by_name}`
                : `${e.payments.length} pagos`}
            </Muted>
            {e.is_covered ? (
              <Badge label="Cubierto" color={colors.success} />
            ) : (
              <Badge label={`Faltan ${money(e.pending_amount)}`} color={colors.warning} />
            )}
          </Row>
        </Card>
      ))}
    </>
  );
}

function SummaryTab({ summary }: { summary: Summary | null }) {
  if (!summary) return <Empty text="Agregá miembros para ver el resumen." />;
  const debtors = summary.balances.filter((b) => b.balance < 0);
  const creditors = summary.balances.filter((b) => b.balance > 0);

  return (
    <>
      {summary.kind === 'preview' && (
        <Card style={{ backgroundColor: '#FFF7E6', borderColor: '#F3D9A4' }}>
          <Text style={{ fontWeight: '600', color: colors.warning }}>Vista previa</Text>
          <Muted>El resumen definitivo se genera al cerrar el evento.</Muted>
          {summary.pending_expenses.map((p) => (
            <Muted key={p.id}>
              • {p.description}: faltan {money(p.pending_amount)}
            </Muted>
          ))}
        </Card>
      )}

      <Card>
        <Row>
          <Muted>Total</Muted>
          <Text style={styles.total}>{money(summary.total_amount)}</Text>
        </Row>
        <Row>
          <Muted>Miembros</Muted>
          <Text style={{ color: colors.text }}>{summary.member_count}</Text>
        </Row>
        <Row>
          <Muted>Cada uno debe aportar</Muted>
          <Text style={styles.total}>{money(summary.share_amount)}</Text>
        </Row>
      </Card>

      <Title>Transferencias para saldar</Title>
      {summary.transfers.length === 0 && <Empty text="No hay deudas: todos aportaron lo mismo." />}
      {summary.transfers.map((t, i) => (
        <Card key={i}>
          <Row>
            <Text style={{ color: colors.text, flex: 1 }}>
              <Text style={{ fontWeight: '700', color: colors.danger }}>{t.from_member_name}</Text> le paga a{' '}
              <Text style={{ fontWeight: '700', color: colors.success }}>{t.to_member_name}</Text>
            </Text>
            <Text style={styles.total}>{money(t.amount)}</Text>
          </Row>
        </Card>
      ))}

      <Title>Detalle por miembro</Title>
      <Card>
        {summary.balances.map((b) => (
          <Row key={b.member_id} style={styles.balanceRow}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', color: colors.text }}>{b.member_name}</Text>
              <Muted>
                Pagó {money(b.paid)} · le corresponde {money(b.share)}
              </Muted>
            </View>
            <Text
              style={{
                fontWeight: '700',
                color: b.balance > 0 ? colors.success : b.balance < 0 ? colors.danger : colors.muted,
              }}
            >
              {b.balance > 0 ? 'Recibe ' : b.balance < 0 ? 'Debe ' : ''}
              {b.balance === 0 ? 'Saldado' : money(Math.abs(b.balance))}
            </Text>
          </Row>
        ))}
      </Card>

      <Muted>
        {debtors.length} deben abonar · {creditors.length} deben recibir
      </Muted>
    </>
  );
}

const styles = StyleSheet.create({
  total: { fontWeight: '700', fontSize: 16, color: colors.text },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 9 },
  tabActive: { backgroundColor: '#E8F0FE' },
  tabText: { fontWeight: '600', color: colors.muted },
  balanceRow: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
});
