import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { api, ApiError, UserLookup } from '@/api';
import { Button, Card, colors, ErrorBox, Field, Label, Muted, Screen } from '@/components/ui';

type Lookup = { email: string; user: UserLookup | null } | null;

export default function MemberFormScreen() {
  const { eventId, id } = useLocalSearchParams<{ eventId: string; id?: string }>();
  const editing = id !== undefined;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [lookup, setLookup] = useState<Lookup>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api.members.get(Number(id)).then((m) => {
      setName(m.name);
      setEmail(m.email ?? '');
      setIsOwner(m.is_owner);
    }, (e) => setError(e.message));
  }, [id, editing]);

  const trimmedEmail = email.trim().toLowerCase();
  // El resultado de la búsqueda deja de valer si se cambia el email.
  const result = lookup && lookup.email === trimmedEmail ? lookup : null;

  async function search() {
    setSearching(true);
    setError(null);
    try {
      const user = await api.users.lookup(trimmedEmail);
      setLookup({ email: trimmedEmail, user });
      setName(user.name);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setLookup({ email: trimmedEmail, user: null });
      else setError((e as Error).message);
    } finally {
      setSearching(false);
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    const data = { name: name.trim(), email: trimmedEmail || null };
    try {
      if (editing) await api.members.update(Number(id), data);
      else await api.members.create(Number(eventId), data);
      router.back();
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Editar miembro' }} />
        <Field label="Nombre" value={name} onChangeText={setName} autoFocus />
        <Field
          label="Email (opcional)"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isOwner}
        />
        {isOwner && <Muted>El email del creador del evento no se puede cambiar.</Muted>}
        <ErrorBox message={error} />
        <Button title="Guardar" onPress={save} loading={saving} disabled={!name.trim()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Nuevo miembro' }} />
      <Label>Buscar usuario de la app por email</Label>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
        <View style={{ flex: 1 }}>
          <Field
            label=""
            value={email}
            onChangeText={setEmail}
            placeholder="persona@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoFocus
            onSubmitEditing={() => trimmedEmail && search()}
          />
        </View>
        <Button title="Buscar" onPress={search} loading={searching} disabled={!trimmedEmail.includes('@')} />
      </View>

      {result?.user && (
        <Card style={{ borderColor: colors.success }}>
          <Label>✓ Usuario encontrado: {result.user.name}</Label>
          <Muted>Al agregarlo va a ver el evento en "Eventos en los que soy miembro" y podrá cargar gastos.</Muted>
        </Card>
      )}
      {result && !result.user && (
        <Card style={{ borderColor: colors.warning }}>
          <Label>No hay ningún usuario con ese email</Label>
          <Muted>
            Podés agregarlo igual como miembro: no se le crea una cuenta. Si más adelante se registra con este email,
            va a ver el evento.
          </Muted>
        </Card>
      )}
      {!result && (
        <Muted>También podés agregar un miembro sin email completando solo el nombre.</Muted>
      )}

      <Field label="Nombre" value={name} onChangeText={setName} placeholder="Ej: Juan" />
      <ErrorBox message={error} />
      <Button
        title={result?.user ? 'Agregar usuario al evento' : 'Agregar miembro'}
        onPress={save}
        loading={saving}
        disabled={!name.trim()}
      />
    </Screen>
  );
}
