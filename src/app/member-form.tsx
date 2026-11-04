import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { api } from '@/api';
import { Button, ErrorBox, Field, Screen } from '@/components/ui';

export default function MemberFormScreen() {
  const { eventId, id } = useLocalSearchParams<{ eventId: string; id?: string }>();
  const editing = id !== undefined;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api.members.get(Number(id)).then((m) => {
      setName(m.name);
      setEmail(m.email ?? '');
    }, (e) => setError(e.message));
  }, [id, editing]);

  async function save() {
    setSaving(true);
    setError(null);
    const data = { name: name.trim(), email: email.trim() || null };
    try {
      if (editing) await api.members.update(Number(id), data);
      else await api.members.create(Number(eventId), data);
      router.back();
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: editing ? 'Editar miembro' : 'Nuevo miembro' }} />
      <Field label="Nombre" value={name} onChangeText={setName} placeholder="Ej: Juan" autoFocus />
      <Field
        label="Email (opcional)"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <ErrorBox message={error} />
      <Button title="Guardar" onPress={save} loading={saving} disabled={!name.trim()} />
    </Screen>
  );
}
