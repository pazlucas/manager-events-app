import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { api, PaymentMethod } from '@/api';
import { useAuth } from '@/auth/AuthContext';
import { DateField } from '@/components/DateField';
import { PaymentMethodField } from '@/components/PaymentMethodField';
import { Button, ErrorBox, Field, Muted, Screen } from '@/components/ui';
import { parseAmount, parseOptionalAmount, todayIso } from '@/format';

export default function ExpenseFormScreen() {
  const params = useLocalSearchParams<{ eventId?: string; id?: string }>();
  const editing = params.id !== undefined;
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(editing ? '' : todayIso());
  const [amount, setAmount] = useState('');
  const [amountUsd, setAmountUsd] = useState('');
  const [method, setMethod] = useState<PaymentMethod | null>(editing ? null : 'efectivo');
  const [author, setAuthor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api.expenses.get(Number(params.id)).then((e) => {
      setDescription(e.description);
      setDate(e.expense_date ?? '');
      setAmount(String(e.amount));
      setAmountUsd(e.amount_usd !== null ? String(e.amount_usd) : '');
      setMethod(e.payment_method);
      setAuthor(e.created_by_email ?? e.created_by_name);
    }, (e) => setError(e.message));
  }, [params.id, editing]);

  async function save() {
    const value = parseAmount(amount);
    if (value === null) {
      setError('Ingresá un importe en $ válido mayor a 0 (hasta 2 decimales)');
      return;
    }
    const usdValue = parseOptionalAmount(amountUsd);
    if (usdValue === null) {
      setError('El importe en u$d no es válido (hasta 2 decimales)');
      return;
    }
    if (!date) {
      setError('Ingresá una fecha válida');
      return;
    }
    setSaving(true);
    setError(null);
    const data = {
      description: description.trim(),
      amount: value,
      amount_usd: usdValue ?? null,
      expense_date: date,
      payment_method: method,
    };
    try {
      if (editing) {
        await api.expenses.update(Number(params.id), data);
        router.back();
      } else {
        const created = await api.expenses.create(Number(params.eventId), data);
        // Lleva directo al detalle para cargar los pagos.
        router.replace(`/expenses/${created.id}`);
      }
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: editing ? 'Editar gasto' : 'Nuevo gasto' }} />
      <Field label="Descripción" value={description} onChangeText={setDescription} placeholder="Ej: Carne" autoFocus />
      <DateField label="Fecha del pago" value={date} onChange={setDate} />
      <Field label="Importe $" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0,00" />
      <Muted>Es el importe que se usa para los pagos y el resumen.</Muted>
      <Field
        label="Importe u$d (opcional)"
        value={amountUsd}
        onChangeText={setAmountUsd}
        keyboardType="decimal-pad"
        placeholder="0,00"
      />
      <Muted>Solo informativo: no se usa en ningún cálculo.</Muted>
      <PaymentMethodField value={method} onChange={setMethod} />
      {/* El autor lo registra la API con la cuenta que carga el gasto; no se elige a mano. */}
      <Muted>
        {editing
          ? author
            ? `Cargado por ${author}`
            : 'Sin autor registrado'
          : `Se registrará a nombre de ${user?.email}`}
      </Muted>
      <ErrorBox message={error} />
      <Button
        title="Guardar"
        onPress={save}
        loading={saving}
        disabled={!description.trim() || !amount || !method}
      />
    </Screen>
  );
}
