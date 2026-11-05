import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { api, InvitationInfo } from '@/api';
import { useAuth } from '@/auth/AuthContext';
import { Button, Card, ErrorBox, Loading, Muted, Screen, Title } from '@/components/ui';
import { savePendingInvite } from '@/invite';

/** Destino del link de invitación. Accesible con o sin sesión. */
export default function InviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { user } = useAuth();
  const [info, setInfo] = useState<InvitationInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const accepting = useRef(false);

  useEffect(() => {
    api.invitations.get(token).then(setInfo, (e) => setError(e.message));
  }, [token]);

  // Con sesión iniciada, la invitación se acepta sola y se abre el evento.
  useEffect(() => {
    if (!user || !info || accepting.current) return;
    accepting.current = true;
    api.invitations.accept(token).then(
      (event) => router.replace(`/events/${event.id}`),
      (e) => setError(e.message),
    );
  }, [user, info, token]);

  function goToLogin() {
    savePendingInvite(token);
    router.replace('/login');
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Invitación' }} />
      <ErrorBox message={error} />
      {!info && !error && <Loading />}
      {info && (
        <Card style={{ gap: 10, padding: 18 }}>
          <Muted>{info.owner_name ? `${info.owner_name} te invitó a` : 'Te invitaron a'}</Muted>
          <Title>{info.event_name}</Title>
          {user ? (
            !error && <Muted>Sumándote al evento…</Muted>
          ) : (
            <>
              <Muted>Ingresá o creá tu cuenta (también podés usar Google) y vas a quedar como miembro del evento.</Muted>
              <Button title="Ingresar o crear cuenta" onPress={goToLogin} />
            </>
          )}
        </Card>
      )}
      {user && error && <Button variant="secondary" title="Ir a mis eventos" onPress={() => router.replace('/')} />}
    </Screen>
  );
}
