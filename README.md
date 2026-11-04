# Manager Events App

App para gestionar los gastos compartidos de un evento. Un solo código en React Native (Expo) para **web, iOS y
Android**. Consume la API [manager-events-api](https://github.com/pazlucas/manager-events-api).

## Desarrollo

```bash
npm install
cp .env.example .env     # EXPO_PUBLIC_API_URL: API local o https://manager-events-api.onrender.com
npx expo start --clear   # w = web, i = iOS, a = Android, o escanear el QR con Expo Go
npm run typecheck
```

## Web (Netlify)

Netlify compila y publica automáticamente cada push a `main` usando `netlify.toml`
(`npx expo export --platform web` → carpeta `dist/`). La regla de `public/_redirects` hace que las rutas internas
(por ej. `/events/2`) funcionen al recargar la página.

## App Store / Google Play (EAS)

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform all --profile production
npx eas-cli@latest submit --platform ios
npx eas-cli@latest submit --platform android
```

La URL de la API de producción está en `eas.json`.
