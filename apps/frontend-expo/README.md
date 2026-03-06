# frontend-expo (React Native + Expo)

Frontend-app för microservice-demot. Byggd med **Expo** och **React Native** — fungerar på både webb och mobil.

## Vad gör appen?

Appen är ett UI för att testa hela microservice-flödet:

1. **Konfigurera backend-URL** — peka mot localhost eller EC2
2. **Health check** — pinga auth-service och info-service
3. **Login** — anropa `POST /auth/login` och få en Bearer-token
4. **Get Info** — anropa `GET /api/info` med token (info-service → auth-service synkront)
5. **Visa resultat** — se JSON-svar, HTTP-statuskod och `authValidationMs` (hur lång tid det synkrona anropet tog)

## Kom igång

Från `apps/frontend-expo`:

```bash
# Installera dependencies
npm install

# Starta appen (öppnas i webbläsaren)
npx expo start --web
```

## Backend-URL

Appen låter dig konfigurera vilken backend den pratar med:

| Miljö | URL | Förklaring |
|-------|-----|------------|
| Lokal (web) | `http://localhost` | Nginx gateway på port 80 |
| Lokal (Android-emulator) | `http://10.0.2.2` | Android-emulatorn alias för host-maskinens localhost |
| EC2 | `http://<EC2_PUBLIC_IP>` | Din EC2-instans publika IP |

URL:en kan ändras direkt i appen under "Backend URL"-kortet.

## Projektstruktur

```
frontend-expo/
├── app/
│   ├── _layout.tsx              # Root-layout med tema (dark/light) och navigation
│   ├── modal.tsx                # Enkel modal-skärm
│   └── (tabs)/
│       ├── _layout.tsx          # Tab-navigation (Home + Explore)
│       ├── index.tsx            # Huvudskärmen — login, health check, get info
│       └── explore.tsx          # Dokumentation och info om projektet
├── components/                  # Återanvändbara UI-komponenter
├── constants/
│   └── theme.ts                 # Färger för dark/light-tema
├── hooks/                       # Custom React hooks (tema, färger)
├── app.json                     # Expo-konfiguration
├── package.json                 # Dependencies
└── tsconfig.json                # TypeScript med strict mode
```

## Tekniker

- **Expo ~54** med file-based routing (expo-router)
- **React 19** + **React Native 0.81**
- **TypeScript** med strict mode
- Dark/light tema-stöd
- Plattformsspecifik kod (`.ios.tsx`, `.web.ts`)
