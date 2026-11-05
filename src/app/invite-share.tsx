import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Platform, Share, Text } from 'react-native';

import { api } from '@/api';
import { useAuth } from '@/auth/AuthContext';
import { confirm, notify } from '@/confirm';
import { Button, Card, colors, ErrorBox, Field, Label, Loading, Muted, Screen } from '@/components/ui';
import { inviteUrl } from '@/invite';

export default function InviteShareScreen() {
  const eventId = Number(useLocalSearchParams<{ eventId: string }>().eventId);
  const { user } = useAuth();
  const [eventName, setEventName] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.events.get(eventId), api.invitations.token(eventId)]).then(([event, invite]) => {
      setEventName(event.name);
      setToken(invite.token);
    }, (e) => setError(e.message));
  }, [eventId]);

  if (!token) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Invitar' }} />
        <ErrorBox message={error} />
        {!error && <Loading />}
      </Screen>
    );
  }

  const url = inviteUrl(token);
  const message =
    `${user?.name ?? 'Te'} te invita a sumarte al evento "${eventName}" en Gastos de Eventos. ` +
    `Entrá a este link, creá tu cuenta o ingresá con Google y vas a quedar como miembro: ${url}`;

  function openExternal(link: string) {
    if (Platform.OS === 'web') {
      // mailto en la misma pestaña abre el cliente de correo; WhatsApp en una pestaña nueva.
      if (link.startsWith('mailto:')) window.location.href = link;
      else window.open(link, '_blank', 'noopener');
    } else {
      Linking.openURL(link).catch(() => notify('No se pudo abrir', 'No hay una app disponible para este envío.'));
    }
  }

  function sendWhatsApp() {
    openExternal(`https://wa.me/?text=${encodeURIComponent(message)}`);
  }

  function sendEmail() {
    const subject = encodeURIComponent(`Invitación al evento "${eventName}"`);
    openExternal(`mailto:${encodeURIComponent(email.trim())}?subject=${subject}&body=${encodeURIComponent(message)}`);
  }

  async function copyOrShare() {
    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      } catch {
        notify('No se pudo copiar', url);
      }
    } else {
      await Share.share({ message });
    }
  }

  async function regenerate() {
    const ok = await confirm('Generar link nuevo', 'El link anterior va a dejar de funcionar.');
    if (!ok) return;
    try {
      setToken((await api.invitations.token(eventId, true)).token);
      setCopied(false);
    } catch (e) {
      notify('No se pudo generar', (e as Error).message);
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Invitar al evento' }} />
      <Muted>
        Quien abra este link va a poder crear su usuario o ingresar con Google, y queda sumado automáticamente
        como miembro de "{eventName}".
      </Muted>
      <Card>
        <Label>Link de invitación</Label>
        <Text selectable style={{ color: colors.primary }}>
          {url}
        </Text>
        <Button small variant="secondary" title={Platform.OS === 'web' ? (copied ? '¡Copiado!' : 'Copiar link') : 'Compartir…'} onPress={copyOrShare} />
      </Card>

      <Button title="Enviar por WhatsApp" onPress={sendWhatsApp} />

      <Card>
        <Field
          label="Email del invitado (opcional)"
          value={email}
          onChangeText={setEmail}
          placeholder="persona@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Button variant="secondary" title="Enviar por email" onPress={sendEmail} />
        <Muted>Se abre tu app de correo con el mensaje listo para enviar.</Muted>
      </Card>

      <Button small variant="danger" title="Generar un link nuevo" onPress={regenerate} />
    </Screen>
  );
}
