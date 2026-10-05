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

### 3D vehicle models (web)

GLB files live in `web/public/models/`. Download samples (or refresh after clone):

```bash
cd web
npm run models:download
```

Map body style and paint in `web/src/config/vehicleModels.ts`. Replace GLBs with your licensed production car assets when ready — see `web/public/models/README.md`.

Per-vehicle **paint color**, **body style**, and optional **`model_3d_url`** are stored on the vehicle record (API + DB migration `002_vehicle_visual`). Edit them under **My Vehicles** or when adding a car.

## Default demo context

Demo defaults use Côte d'Ivoire (FCFA). Country and currency are user-configurable in settings — not hardcoded in business logic.

## Implementation phases

See `docs/IMPLEMENTATION_PLAN.md`.
