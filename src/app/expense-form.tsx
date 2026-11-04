import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { api, Member } from '@/api';
import { Button, Chip, ErrorBox, Field, Muted, Screen } from '@/components/ui';
import { parseAmount } from '@/format';

export default function ExpenseFormScreen() {
  const params = useLocalSearchParams<{ eventId?: string; id?: string }>();
  const editing = params.id !== undefined;
  const [eventId, setEventId] = useState(params.eventId ? Number(params.eventId) : null);
  const [members, setMembers] = useState<Member[]>([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [createdBy, setCreatedBy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api.expenses.get(Number(params.id)).then((e) => {
      setEventId(e.event_id);
      setDescription(e.description);
      setAmount(String(e.amount));
      setCreatedBy(e.created_by_id);
    }, (e) => setError(e.message));
  }, [params.id, editing]);

  useEffect(() => {
    if (eventId !== null) api.members.list(eventId).then(setMembers, (e) => setError(e.message));
  }, [eventId]);

  async function save() {
    const value = parseAmount(amount);
    if (value === null) {
      setError('Ingresá un monto válido mayor a 0 (hasta 2 decimales)');
      return;
    }
    setSaving(true);
    setError(null);
    const data = { description: description.trim(), amount: value, created_by_id: createdBy };
    try {
      if (editing) {
        await api.expenses.update(Number(params.id), data);
        router.back();
      } else {
        const created = await api.expenses.create(eventId!, data);
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
      <Muted>¿Quién cargó el gasto? (opcional)</Muted>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {members.map((m) => (
          <Chip
            key={m.id}
            label={m.name}
            selected={createdBy === m.id}
            onPress={() => setCreatedBy(createdBy === m.id ? null : m.id)}
          />
        ))}
      </View>
      <ErrorBox message={error} />
      <Button title="Guardar" onPress={save} loading={saving} disabled={!description.trim() || !amount} />
    </Screen>
  );
}
