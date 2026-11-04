import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { api } from '@/api';
import { useAuth } from '@/auth/AuthContext';
import { Button, ErrorBox, Field, Muted, Screen } from '@/components/ui';
import { parseAmount } from '@/format';

export default function ExpenseFormScreen() {
  const params = useLocalSearchParams<{ eventId?: string; id?: string }>();
  const editing = params.id !== undefined;
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [author, setAuthor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api.expenses.get(Number(params.id)).then((e) => {
      setDescription(e.description);
      setAmount(String(e.amount));
      setAuthor(e.created_by_email ?? e.created_by_name);
    }, (e) => setError(e.message));
  }, [params.id, editing]);

  async function save() {
    const value = parseAmount(amount);
    if (value === null) {
      setError('Ingresá un monto válido mayor a 0 (hasta 2 decimales)');
      return;
    }
    setSaving(true);
    setError(null);
    const data = { description: description.trim(), amount: value };
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
      <Field label="Monto total" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0,00" />
      {/* El autor lo registra la API con la cuenta que carga el gasto; no se elige a mano. */}
      <Muted>
        {editing
          ? author
            ? `Cargado por ${author}`
            : 'Sin autor registrado'
          : `Se registrará a nombre de ${user?.email}`}
      </Muted>
      <ErrorBox message={error} />
      <Button title="Guardar" onPress={save} loading={saving} disabled={!description.trim() || !amount} />
    </Screen>
  );
}
