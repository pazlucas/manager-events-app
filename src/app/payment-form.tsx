import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { api, Expense, Member, PaymentMethod } from '@/api';
import { DateField } from '@/components/DateField';
import { PaymentMethodField } from '@/components/PaymentMethodField';
import { Button, Chip, ErrorBox, Field, Label, Muted, Screen } from '@/components/ui';
import { money, parseAmount, todayIso } from '@/format';

export default function PaymentFormScreen() {
  const { expenseId, id } = useLocalSearchParams<{ expenseId: string; id?: string }>();
  const editing = id !== undefined;
  const [expense, setExpense] = useState<Expense | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberId, setMemberId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(editing ? '' : todayIso());
  const [method, setMethod] = useState<PaymentMethod | null>(editing ? null : 'efectivo');
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
      if (current) {
        setDate(current.payment_date ?? '');
        setMethod(current.payment_method);
      }
    })().catch((e) => setError(e.message));
  }, [expenseId, id, editing]);

  async function save() {
    const value = parseAmount(amount);
    if (value === null) {
      setError('Ingresá un importe válido mayor a 0 (hasta 2 decimales)');
      return;
    }
    if (!date) {
      setError('Ingresá una fecha válida');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const data = { member_id: memberId!, amount: value, payment_date: date, payment_method: method };
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
      <Label>¿Quién pagó?</Label>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {members.map((m) => (
          <Chip key={m.id} label={m.name} selected={memberId === m.id} onPress={() => setMemberId(m.id)} />
        ))}
      </View>
      <DateField label="Fecha del pago" value={date} onChange={setDate} />
      <Field label="Importe $" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
      <PaymentMethodField value={method} onChange={setMethod} />
      <ErrorBox message={error} />
      <Button
        title="Guardar"
        onPress={save}
        loading={saving}
        disabled={memberId === null || !amount || !method}
      />
    </Screen>
  );
}
