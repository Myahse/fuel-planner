import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { calculateTrip } from '../api/endpoints'
import { useActiveVehicle } from './useActiveVehicle'
import { useTripStore, type TripPlanDraft } from '../store/tripStore'

/** Calculates a trip for the active vehicle and opens the result page. */
export function useTripCalculation() {
  const navigate = useNavigate()
  const { vehicle, fuelPricePerLiter } = useActiveVehicle()
  const { draft, setLastResult } = useTripStore()

  const mutation = useMutation({
    mutationFn: (plan: TripPlanDraft) =>
      calculateTrip({
        vehicle_id: vehicle?.id,
        origin: plan.origin,
        destination: plan.destination,
        trip_type: plan.trip_type === 'multi_stop' ? 'one_way' : plan.trip_type,
        consumption_profile: plan.profile,
        fuel_price_per_liter: fuelPricePerLiter,
      }),
    onSuccess: (result, plan) => {
      setLastResult(result)
      sessionStorage.setItem('lastTripResult', JSON.stringify(result))
      sessionStorage.setItem('lastTripPlan', JSON.stringify({ ...plan, vehicle_id: vehicle?.id }))
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
