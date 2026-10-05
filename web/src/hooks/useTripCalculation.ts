import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { calculateTrip } from '../api/endpoints'
import type { TripCalculateResult } from '../api/types'
import { useActiveVehicle } from './useActiveVehicle'
import { useTripStore, type TripPlanDraft } from '../store/tripStore'

function useCalculateRequest() {
  const { vehicle, fuelPricePerLiter } = useActiveVehicle()
  const request = (plan: TripPlanDraft) =>
    calculateTrip({
      vehicle_id: vehicle?.id,
      origin: plan.origin,
      destination: plan.destination,
      trip_type: plan.trip_type === 'multi_stop' ? 'one_way' : plan.trip_type,
      consumption_profile: plan.profile,
      fuel_price_per_liter: fuelPricePerLiter,
    })
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
    mutationFn: (destination: string) => request({ ...draft, destination, trip_type: 'one_way' }),
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
