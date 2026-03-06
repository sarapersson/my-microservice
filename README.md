# my-microservice

> **Kursuppgift** — Utveckla och driftsätta en microservice med Docker containers.

## Vad är det här?

Ett demo-projekt som visar hur flera Docker-containers kommunicerar **synkront** med varandra.
Projektet består av tre tjänster som körs i separata containers:

| Container | Teknik | Port | Uppgift |
|-----------|--------|------|---------|
| **auth-service** | Spring Boot 4.0.3 / Java 25 | 8081 | Hanterar login och token-validering |
| **info-service** | Spring Boot 4.0.3 / Java 25 | 8080 | Returnerar skyddad data efter att ha validerat token via auth-service |
| **gateway** | Nginx | 80 | Reverse proxy — dirigerar trafik till rätt tjänst |
| **frontend-expo** | Expo / React Native | — | UI för att testa hela flödet (web + mobil) |

## Arkitektur

```
Frontend (Expo)
     │
     ▼
Nginx Gateway (:80)
     │
     ├── /auth/*  →  auth-service (:8081)
     │
     └── /api/*   →  info-service (:8080)
                          │
                          │  ← synkront HTTP-anrop (RestTemplate)
                          ▼
                     auth-service (:8081)
```

**Nyckelflöde (VG-kravet — synkron kommunikation):**
1. Frontend skickar `POST /auth/login` → auth-service skapar en token
2. Frontend skickar `GET /api/info` med Bearer-token → Nginx → info-service
3. info-service gör ett **synkront HTTP-anrop** till auth-service (`GET /auth/validate`) för att kontrollera token
4. auth-service svarar med `{ "valid": true }` → info-service returnerar skyddad data

Det synkrona anropet sker i `InfoController.java` via `RestTemplate.exchange()`.

## Uppfyllda krav

### Godkänt (G)
- ✅ **Egen Docker-image** — Dockerfile med multi-stage build i varje tjänst
- ✅ **Pushad till Docker Hub** — `docker push` (se instruktioner nedan)
- ✅ **Driftsatt i molnet** — docker-compose.cloud.yml för EC2

### Väl Godkänt (VG)
- ✅ **Flera containers (minst två)** — tre stycken: auth-service, info-service, gateway
- ✅ **Synkron kommunikation** — info-service → auth-service via REST (se `InfoController.java`)

## Köra lokalt

Från repo-rooten:

```bash
docker compose up --build
```

Det här bygger alla images och startar tre containers. Gateway lyssnar på port 80.

### Testa med curl

**1) Login (auth-service):**
```bash
curl -s -X POST http://localhost/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"sara","password":"pass"}'
```
Returnerar: `{ "token": "<uuid>" }`

**2) Hämta skyddad info (info-service → anropar auth-service synkront):**
```bash
curl -i http://localhost/api/info \
  -H "Authorization: Bearer <token-från-steg-1>"
```
Returnerar: användardata + `authValidationMs` (hur lång tid det synkrona anropet tog).

**3) Health checks:**
```bash
curl http://localhost/auth/health
curl http://localhost/api/health
```

### Se det synkrona anropet i loggar (VG-bevis)

```bash
docker logs -f info-service
```
Du ser: `Calling auth-service /auth/validate ...` — detta bevisar att info-service anropar auth-service synkront.

## Pusha till Docker Hub

Byt ut `<DOCKERHUB_USER>` mot ditt Docker Hub-användarnamn:

```bash
# Bygga images
docker build -t <DOCKERHUB_USER>/auth-service:1.0 services/auth-service
docker build -t <DOCKERHUB_USER>/info-service:1.0 services/info-service

# Pusha till Docker Hub
docker push <DOCKERHUB_USER>/auth-service:1.0
docker push <DOCKERHUB_USER>/info-service:1.0
```

## Driftsätta på EC2

På en Ubuntu EC2-instans med Docker och Docker Compose installerat:

```bash
git clone <DIN_REPO_URL>
cd my-microservice

# Redigera docker-compose.cloud.yml — byt <DOCKERHUB_USER> mot ditt användarnamn
docker compose -f docker-compose.cloud.yml up -d
```

Testa i webbläsaren:
- `http://<EC2_PUBLIC_IP>/auth/health` — auth-service health check
- `http://<EC2_PUBLIC_IP>/api/health` — info-service health check

Eller kör frontend-appen och peka backend-URL:en mot EC2-IP:n.

## Projektstruktur

```
my-microservice/
├── docker-compose.yml            # Lokal utveckling (bygger från Dockerfiles)
├── docker-compose.cloud.yml      # Molndeploy (pullar från Docker Hub)
├── infra/
│   └── nginx.conf                # Nginx reverse proxy-konfiguration
├── services/
│   ├── auth-service/             # Spring Boot — login + token-validering
│   │   ├── Dockerfile
│   │   ├── pom.xml
│   │   └── src/main/java/com/example/auth/
│   │       ├── AuthController.java         # POST /auth/login, GET /auth/validate
│   │       ├── AuthServiceApplication.java # Entry point
│   │       └── WebConfig.java              # CORS-konfiguration
│   └── info-service/             # Spring Boot — skyddad data + synkront anrop
│       ├── Dockerfile
│       ├── pom.xml
│       └── src/main/java/com/example/info/
│           ├── InfoController.java         # GET /api/info (anropar auth-service!)
│           ├── HealthController.java       # GET /api/health
│           ├── InfoServiceApplication.java # Entry point
│           └── WebConfig.java              # CORS-konfiguration
└── apps/
    └── frontend-expo/            # Expo React Native-app (web + mobil)
```

## Frontend (Expo)

Se [apps/frontend-expo/README.md](apps/frontend-expo/README.md) för instruktioner.
