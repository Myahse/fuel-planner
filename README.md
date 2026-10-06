# FUELGO (Fuel Trip Planner)

Fuel intelligence for trip planning — estimate range, cost, and refuel needs before you drive.

> **Product name:** `FUELGO` — rename globally via `web/src/config/product.ts` and `mobile/lib/config/product.dart`.

## Monorepo layout

| Path | Stack |
|------|--------|
| `backend/` | Go API + PostgreSQL |
| `web/` | React + TypeScript (Vite) |
| `mobile/` | Flutter |
| `infra/` | Docker & deployment helpers |
| `docs/` | Architecture & OpenAPI |
| `shared/` | Shared API contracts |

## Local development

1. Start PostgreSQL:

```bash
docker compose up -d
```

2. Backend API:

```bash
cp backend/.env.example backend/.env
cd backend
go run ./cmd/api
```

3. Web app:

```bash
cd web
cp .env.example .env
npm install
npm run dev
```

- API: `http://localhost:8080/api/v1`
- Web: `http://localhost:5173`

### Maps (Mapbox)

Use **two** Mapbox tokens (same account is fine):

| Where | Token | Variable | What it does |
|------|--------|----------|--------------|
| `backend/.env` | **Secret** `sk.…` | `MAP_PROVIDER=mapbox`, `MAP_API_KEY=sk.…`, `MAP_COUNTRY=ci` | Geocoding, Directions, Search Box fuel POIs (never expose this in the browser) |
| `web/.env` | **Public** `pk.…` | `VITE_MAPBOX_TOKEN=pk.…` | Map tiles and place suggestions in the UI |

Without Mapbox config the app still runs on demo routes and free CARTO tiles. Restrict the **pk.** token to your dev URLs in the Mapbox dashboard. Mapbox does not provide fuel prices.

### Testing on a phone

The fuel tank tilts and sloshes with the phone's motion sensors, which browsers only expose to secure pages. Run the web app over HTTPS on your network:

```bash
cd web && npm run dev:phone
```

Open the **Network** `https://…:5173` address on the phone (accept the self-signed certificate warning once). API calls are proxied to the backend on `localhost:8080`, so keep it running on the same computer. On iPhone, tap anywhere once and allow motion access. If the Mapbox `pk.` token is URL-restricted, add this address to it.

### 3D vehicle models (web)

Car models are generated with [Meshy](https://www.meshy.ai) — one per body type — and optimised to well under 1 MB each:

```bash
cd web
MESHY_API_KEY=… npm run models:meshy               # all body types
MESHY_API_KEY=… npm run models:meshy -- --only suv # one body type
npm run models:meshy -- --dry-run                   # show prompts, no API calls
```

Until a model exists for a body type, the app shows a built-in extruded car. Paint colour, body style
(sedan, hatchback, SUV, pickup, minivan) and an optional custom `model_3d_url` are stored per vehicle
(migrations `002_vehicle_visual` and `003_more_body_styles`). See `web/public/models/README.md`.

## Default demo context

Demo defaults use Côte d'Ivoire (FCFA). Country and currency are user-configurable in settings — not hardcoded in business logic.

## Implementation phases

See `docs/IMPLEMENTATION_PLAN.md`.
