import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { api, Expense, Member } from '@/api';
import { Button, Chip, ErrorBox, Field, Muted, Screen } from '@/components/ui';
import { money, parseAmount } from '@/format';

export default function PaymentFormScreen() {
  const { expenseId, id } = useLocalSearchParams<{ expenseId: string; id?: string }>();
  const editing = id !== undefined;
  const [expense, setExpense] = useState<Expense | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberId, setMemberId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [available, setAvailable] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const exp = await api.expenses.get(Number(expenseId));
      setExpense(exp);
      setMembers(await api.members.list(exp.event_id));
      const current = editing ? exp.payments.find((p) => p.id === Number(id)) : undefined;
      // Al editar, el monto actual del pago también está "disponible".
      const avail = exp.pending_amount + (current?.amount ?? 0);
      setAvailable(avail);
      setMemberId(current?.member_id ?? null);
      setAmount(String(current?.amount ?? avail));
    })().catch((e) => setError(e.message));
  }, [expenseId, id, editing]);

  async function save() {
    const value = parseAmount(amount);
    if (value === null) {
      setError('Ingresá un monto válido mayor a 0 (hasta 2 decimales)');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const data = { member_id: memberId!, amount: value };
      if (editing) await api.payments.update(Number(id), data);
      else await api.payments.create(Number(expenseId), data);
      router.back();
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: editing ? 'Editar pago' : 'Nuevo pago' }} />
      {expense && (
        <Muted>
          {expense.description}: disponible para cubrir {money(available)}
        </Muted>
      )}
      <Muted>¿Quién pagó?</Muted>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {members.map((m) => (
          <Chip key={m.id} label={m.name} selected={memberId === m.id} onPress={() => setMemberId(m.id)} />
        ))}
      </View>
      <Field label="Monto" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
      <ErrorBox message={error} />
      <Button title="Guardar" onPress={save} loading={saving} disabled={memberId === null || !amount} />
    </Screen>
  );
}
