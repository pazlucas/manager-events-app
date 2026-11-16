import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { api, Debt, PaymentMethod } from '@/api';
import { DateField } from '@/components/DateField';
import { PaymentMethodField } from '@/components/PaymentMethodField';
import { Button, ErrorBox, Field, Muted, Screen } from '@/components/ui';
import { money, parseAmount, todayIso } from '@/format';

export default function DebtPaymentFormScreen() {
  const { debtId, id } = useLocalSearchParams<{ debtId: string; id?: string }>();
  const editing = id !== undefined;
  const [debt, setDebt] = useState<Debt | null>(null);
  const [available, setAvailable] = useState(0);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(editing ? '' : todayIso());
  const [method, setMethod] = useState<PaymentMethod | null>(editing ? null : 'efectivo');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.debts.get(Number(debtId)).then((d) => {
      setDebt(d);
      const current = editing ? d.payments.find((p) => p.id === Number(id)) : undefined;
      // Al editar, el monto actual del pago también está disponible.
      const avail = d.pending_amount + (current?.amount ?? 0);
      setAvailable(avail);
      setAmount(String(current?.amount ?? avail));
      if (current) {
        setDate(current.payment_date ?? '');
        setMethod(current.payment_method);
      }
    }, (e) => setError(e.message));
  }, [debtId, id, editing]);

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
    const data = { amount: value, payment_date: date, payment_method: method };
    try {
      if (editing) await api.debts.updatePayment(Number(id), data);
      else await api.debts.pay(Number(debtId), data);
      router.back();
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: editing ? 'Editar pago' : 'Registrar pago' }} />
      {debt && (
        <Muted>
          {debt.from_member_name} le paga a {debt.to_member_name} · saldo {money(available)}. Podés registrar un pago
          parcial o el total.
        </Muted>
      )}
      <DateField label="Fecha del pago" value={date} onChange={setDate} />
      <Field label="Importe $" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
      <PaymentMethodField value={method} onChange={setMethod} />
      <ErrorBox message={error} />
      <Button title="Guardar" onPress={save} loading={saving} disabled={!amount || !method} />
    </Screen>
  );
}
