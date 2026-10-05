import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { calculateTrip } from '../api/endpoints'
import type { TripCalculateResult } from '../api/types'
import { originForApi } from '../lib/placeCoords'
import { useAppStore } from '../store/appStore'
import { useActiveVehicle } from './useActiveVehicle'
import { waypointsForApi } from '../lib/tripWaypoints'
import { useTripStore, type TripPlanDraft } from '../store/tripStore'

function useCalculateRequest() {
  const { vehicle, fuelPricePerLiter } = useActiveVehicle()
  const userLocation = useAppStore((s) => s.userLocation)
  const request = (plan: TripPlanDraft) => {
    const originCoords =
      plan.origin_lat != null && plan.origin_lng != null ? { lat: plan.origin_lat, lng: plan.origin_lng } : null
    const origin = originForApi(plan.origin, originCoords, userLocation)
    const destination =
      plan.destination_lat != null && plan.destination_lng != null
        ? `${plan.destination_lat},${plan.destination_lng}`
        : plan.destination
    const waypointQueries =
      plan.trip_type === 'multi_stop' ? waypointsForApi(plan.waypoints) : []

    return calculateTrip({
      vehicle_id: vehicle?.id,
      origin,
      destination,
      waypoints: waypointQueries.length > 0 ? waypointQueries : [],
      trip_type: plan.trip_type,
      consumption_profile: plan.profile,
      route_profile: plan.preference,
      fuel_price_per_liter: fuelPricePerLiter,
    })
  }
  return { vehicle, fuelPricePerLiter, request }
}

/** Remembers a calculated trip so the result page (and a reload) can show it. */
function useRememberTrip() {
  const { setLastResult } = useTripStore()
  return (result: TripCalculateResult, plan: TripPlanDraft, vehicleId?: string) => {
    setLastResult(result)
    sessionStorage.setItem('lastTripResult', JSON.stringify(result))
    sessionStorage.setItem('lastTripPlan', JSON.stringify({ ...plan, vehicle_id: vehicleId }))
  }
}

/** Calculates a trip for the active vehicle and opens the result page. */
export function useTripCalculation() {
  const navigate = useNavigate()
  const { draft } = useTripStore()
  const { vehicle, fuelPricePerLiter, request } = useCalculateRequest()
  const remember = useRememberTrip()

  const mutation = useMutation({
    mutationFn: request,
    onSuccess: (result, plan) => {
      remember(result, plan, vehicle?.id)
      navigate('/app/trip-result')
    },
  })

  return {
    vehicle,
    fuelPricePerLiter,
    calculate: (patch: Partial<TripPlanDraft> = {}) => mutation.mutate({ ...draft, ...patch }),
    isPending: mutation.isPending,
    isError: mutation.isError,
  }
}

/**
 * Calculates a one-way trip without leaving the page, so Home can drain the tank to the
 * arrival level. `open()` then shows the full result.
 */
export function useTripPreview() {
  const navigate = useNavigate()
  const { draft } = useTripStore()
  const { vehicle, request } = useCalculateRequest()
  const remember = useRememberTrip()

  const mutation = useMutation({
    mutationFn: (destination: string) => {
      const hasOrigin =
        draft.origin.trim() ||
        (draft.origin_lat != null && draft.origin_lng != null) ||
        useAppStore.getState().userLocation
      if (!hasOrigin) throw new Error('Set a starting point or allow location access first.')
      return request({ ...draft, destination, trip_type: 'one_way' })
    },
  })

  return {
    preview: (destination: string) => mutation.mutate(destination),
    clear: () => mutation.reset(),
    result: mutation.data ?? null,
    destination: mutation.variables ?? null,
    isPending: mutation.isPending,
    isError: mutation.isError,
    open: () => {
      if (!mutation.data || !mutation.variables) return
      remember(mutation.data, { ...draft, destination: mutation.variables, trip_type: 'one_way' }, vehicle?.id)
      navigate('/app/trip-result')
    },
  }
}
