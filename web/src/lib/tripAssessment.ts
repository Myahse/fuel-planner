import type { TripAssessment, Vehicle } from '../api/types'
import { fuelRequiredLiters, estimatedRangeKm } from './fuelMath'

/** Mirrors backend `fuelcalc.LowFuelThresholdLiters` — arriving with this much or less is "low". */
export const RESERVE_LITERS = 5

export type VehicleFuelProfile = {
  startingLiters: number
  tankLiters: number
  consumption: number
}

export function vehicleFuelProfile(
  vehicle: Pick<Vehicle, 'tank_capacity_liters' | 'mixed_consumption' | 'estimated_fuel_liters' | 'fuel_percentage'>,
): VehicleFuelProfile {
  const tankLiters = vehicle.tank_capacity_liters
  const startingLiters =
    vehicle.estimated_fuel_liters ??
    (vehicle.fuel_percentage != null ? (tankLiters * vehicle.fuel_percentage) / 100 : tankLiters * 0.5)
  return { startingLiters, tankLiters, consumption: vehicle.mixed_consumption }
}

/** Client preview of backend `fuelcalc.AssessTripFuel` — the server result stays authoritative. */
export function assessTripFuel(distanceKm: number, profile: VehicleFuelProfile): TripAssessment {
  const required = fuelRequiredLiters(distanceKm, profile.consumption)
  const remaining = profile.startingLiters - required
  const base = {
    fuel_required: required,
    starting_fuel: profile.startingLiters,
    remaining_fuel: remaining,
    remaining_range_km: estimatedRangeKm(remaining, profile.consumption),
  }
  if (remaining < 0) {
    return {
      ...base,
      status: 'insufficient',
      shortage_liters: -remaining,
      recommended_refuel: recommendRefuelLiters(-remaining, profile.tankLiters, profile.startingLiters),
    }
  }
  if (remaining <= RESERVE_LITERS) return { ...base, status: 'low' }
  return { ...base, status: 'enough' }
}

/** Mirrors backend `recommendRefuelLiters`: shortage plus reserve, rounded up to 5 L (min 10 L), capped by tank space. */
function recommendRefuelLiters(shortage: number, tankLiters: number, currentLiters: number) {
  const suggested = Math.max(10, Math.ceil((shortage + RESERVE_LITERS) / 5) * 5)
  const maxAdd = tankLiters - currentLiters
  return maxAdd > 0 && suggested > maxAdd ? Math.ceil(maxAdd) : suggested
}

/** Distance (km from start) at which fuel drops to `liters`, or null if it never does on this trip. */
export function kmWhenFuelReaches(liters: number, distanceKm: number, profile: VehicleFuelProfile) {
  if (profile.startingLiters <= liters) return 0
  if (profile.consumption <= 0) return null
  const km = estimatedRangeKm(profile.startingLiters - liters, profile.consumption)
  return km < distanceKm ? km : null
}
