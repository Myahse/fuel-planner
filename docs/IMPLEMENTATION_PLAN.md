# Implementation plan

## Repository status (initial)

- **Existing code:** none — greenfield monorepo.
- **Database:** PostgreSQL via `docker-compose.yml`.
- **API:** Go REST service under `backend/`.

## Phase 1 — Backend foundation (in progress)

- [x] Monorepo skeleton
- [x] PostgreSQL + migrations (full schema for MVP)
- [x] Config & database connection
- [x] JWT auth (register, login, refresh)
- [x] Users & user settings (defaults on register)
- [x] Vehicles CRUD + default vehicle
- [x] Middleware: CORS, auth, request logging

## Phase 2 — Fuel system (in progress)

- [x] `pkg/fuelcalc` pure calculation engine + unit tests
- [x] Fuel level (percentage model) per vehicle
- [x] Fuel transactions (add fuel)
- [x] User fuel price preferences
- [ ] Fuel gauge bar count in vehicle/settings (UI later)

## Phase 3 — Trip calculation

- [x] `MapProvider` abstraction + mock provider (demo distances)
- [x] `POST /trips/calculate`
- [x] Trip persistence (`POST /trips`, list/get)
- [x] Start/end lifecycle + fuel level update on trip end
- [x] Round-trip distance aggregation

## Phase 4 — React web (MVP in progress)

- [x] Vite + Tailwind + TanStack Query + Zustand
- [x] `FuelGauge` component (bars + slider + estimated liters)
- [x] Onboarding, auth, dashboard, vehicles, fuel, plan trip, result, history
- [ ] Add fuel (liters/amount), map view, stations, settings, statistics charts

## Phase 5 — Flutter mobile

- [ ] Riverpod + GoRouter feature modules mirroring web UX

## Phase 6 — Fuel stations

- [ ] Station seed/import + along-route query

## Phase 7 — History & analytics

- [ ] Statistics endpoints + charts

## Phase 8 — Polish

- [ ] Offline, notifications, performance, OpenAPI publish

## Architecture notes

- **Fuel level:** store `fuel_percentage`; liters are always *estimated* in API responses.
- **Calculations:** authoritative on server via `pkg/fuelcalc`; clients may preview.
- **Maps:** `internal/maps` provider interface; no provider keys in repo.
- **EV / OBD:** reserved extension points (`VehicleDataProvider`) — not in MVP.
