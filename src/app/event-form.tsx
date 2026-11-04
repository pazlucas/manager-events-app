import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { api } from '@/api';
import { Button, ErrorBox, Field, Screen } from '@/components/ui';

export default function EventFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = id !== undefined;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api.events.get(Number(id)).then((ev) => {
      setName(ev.name);
      setDescription(ev.description ?? '');
      setDate(ev.event_date ?? '');
    }, (e) => setError(e.message));
  }, [id, editing]);

  async function save() {
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError('La fecha debe tener el formato AAAA-MM-DD');
      return;
    }
    setSaving(true);
    setError(null);
    const data = { name: name.trim(), description: description.trim() || null, event_date: date || null };
    try {
      if (editing) {
        await api.events.update(Number(id), data);
        router.back();
      } else {
        const ev = await api.events.create(data);
        router.replace(`/events/${ev.id}`);
      }
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: editing ? 'Editar evento' : 'Nuevo evento' }} />
      <Field label="Nombre" value={name} onChangeText={setName} placeholder="Ej: Asado de fin de año" autoFocus />
      <Field label="Descripción (opcional)" value={description} onChangeText={setDescription} multiline />
      <Field label="Fecha (opcional, AAAA-MM-DD)" value={date} onChangeText={setDate} placeholder="2026-12-20" />
      <ErrorBox message={error} />
      <Button title="Guardar" onPress={save} loading={saving} disabled={!name.trim()} />
    </Screen>
  );
}
