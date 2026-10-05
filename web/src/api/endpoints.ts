import { apiFetch, setTokens, clearTokens } from './client'
import type {
  FuelCurrent,
  FuelStationsResponse,
  FuelTransaction,
  Trip,
  TripCalculateResult,
  Vehicle,
} from './types'

export async function register(email: string, password: string, displayName: string) {
  const data = await apiFetch<{
    access_token: string
    refresh_token: string
    expires_in: number
  }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, display_name: displayName }),
  })
  setTokens(data)
}

export async function login(email: string, password: string) {
  const data = await apiFetch<{
    access_token: string
    refresh_token: string
    expires_in: number
  }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  setTokens(data)
}

export function logout() {
  clearTokens()
}

export async function listVehicles() {
  const data = await apiFetch<{ vehicles: Vehicle[] }>('/vehicles')
  return data.vehicles
}

export async function createVehicle(payload: Record<string, unknown>) {
  return apiFetch<Vehicle>('/vehicles', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function setDefaultVehicle(id: string) {
  return apiFetch<Vehicle>(`/vehicles/${id}/default`, { method: 'POST' })
}

export async function updateVehicle(id: string, body: Record<string, unknown>) {
  return apiFetch<Vehicle>(`/vehicles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function getFuelCurrent(vehicleId?: string) {
  const q = vehicleId ? `?vehicle_id=${vehicleId}` : ''
  return apiFetch<FuelCurrent>(`/fuel/current${q}`)
}

export async function updateFuelCurrent(vehicleId: string, fuelPercentage: number) {
  return apiFetch<FuelCurrent>('/fuel/current', {
    method: 'PUT',
    body: JSON.stringify({ vehicle_id: vehicleId, fuel_percentage: fuelPercentage }),
  })
}

export async function createFuelTransaction(body: {
  vehicle_id: string
  liters: number
  price_per_liter: number
  notes?: string
  fuel_type?: string
}) {
  return apiFetch<FuelTransaction>('/fuel/transactions', {
    method: 'POST',
    body: JSON.stringify({
      vehicle_id: body.vehicle_id,
      liters: body.liters,
      price_per_liter: body.price_per_liter,
      notes: body.notes ?? '',
      fuel_type: body.fuel_type ?? 'petrol',
    }),
  })
}

export async function listFuelTransactions(vehicleId?: string) {
  const q = vehicleId ? `?vehicle_id=${vehicleId}` : ''
  const data = await apiFetch<{ transactions: FuelTransaction[] }>(`/fuel/transactions${q}`)
  return data.transactions
}

export async function getStationsAlongRoute(body: {
  route_polyline: string
  distance_km: number
  max_detour_km?: number
}) {
  return apiFetch<FuelStationsResponse>('/maps/stations/along-route', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function getStationsNearby(lat: number, lng: number, radiusKm = 25) {
  const q = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    radius_km: String(radiusKm),
  })
  return apiFetch<FuelStationsResponse>(`/maps/stations/nearby?${q}`)
}

export async function calculateTrip(body: Record<string, unknown>) {
  return apiFetch<TripCalculateResult>('/trips/calculate', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function createTrip(body: Record<string, unknown>) {
  return apiFetch<{ trip: Trip; assessment: TripCalculateResult['assessment'] }>('/trips', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function listTrips() {
  const data = await apiFetch<{ trips: Trip[] }>('/trips')
  return data.trips
}

export async function startTrip(id: string) {
  return apiFetch<Trip>(`/trips/${id}/start`, { method: 'POST' })
}

export async function endTrip(id: string) {
  return apiFetch<Trip>(`/trips/${id}/end`, { method: 'POST', body: '{}' })
}
