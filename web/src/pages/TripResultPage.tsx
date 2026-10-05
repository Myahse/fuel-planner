import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { TripCalculateResult } from '../api/types'
import { useTripStore, type TripPlanDraft } from '../store/tripStore'
import { useActiveVehicle } from '../hooks/useActiveVehicle'
import { PageHeader } from '../components/layout/PageHeader'
import { MapView } from '../components/map/MapView'
import { MOCK_STATIONS } from '../data/mockStations'
import { TripResultCard } from '../components/TripResultCard'
import { TripVerdict } from '../components/StatusCard'
import { FuelRouteBar } from '../components/FuelRouteBar'
import { LiquidTank } from '../components/liquid/LiquidTank'
import { ArrowLeft } from 'lucide-react'
import { PrimaryButton } from '../components/buttons/PrimaryButton'
import { SecondaryButton } from '../components/buttons/SecondaryButton'
import { RESERVE_LITERS, assessTripFuel, vehicleFuelProfile, type VehicleFuelProfile } from '../lib/tripAssessment'
import { shortPlace } from '../lib/format'
import { useTripRoute } from '../hooks/useTripRoute'

function loadSession<T>(key: string): T | null {
  const raw = sessionStorage.getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function TripResultPage() {
  const navigate = useNavigate()
  const { lastResult } = useTripStore()
  const { vehicle, vehicles, fuelPricePerLiter, setSelectedVehicleId } = useActiveVehicle()
  const result = lastResult ?? loadSession<TripCalculateResult>('lastTripResult')
  const trip = useTripRoute()
  const calculatedFor = loadSession<TripPlanDraft>('lastTripPlan')?.vehicle_id

  // The server result is authoritative for the vehicle it was calculated for; switching
  // vehicles here re-runs the same fuel model client-side against that vehicle's tank.
  const view = useMemo(() => {
    if (!result) return null
    const distance = result.distance_km
    if (!vehicle || !calculatedFor || vehicle.id === calculatedFor) {
      const a = result.assessment
      const profile: VehicleFuelProfile = {
        startingLiters: a.starting_fuel,
        tankLiters: vehicle?.tank_capacity_liters ?? Math.max(a.starting_fuel, 1),
        consumption: distance > 0 ? (a.fuel_required / distance) * 100 : 0,
      }
      return { assessment: a, profile, display: result, preview: false }
    }
    const profile = vehicleFuelProfile(vehicle)
    const assessment = assessTripFuel(distance, profile)
    const display: TripCalculateResult = {
      ...result,
      fuel_required_liters: assessment.fuel_required,
      estimated_fuel_cost: assessment.fuel_required * fuelPricePerLiter,
      starting_fuel_liters_est: profile.startingLiters,
      assessment,
    }
    return { assessment, profile, display, preview: true }
  }, [result, vehicle, calculatedFor, fuelPricePerLiter])

  if (!result || !view) {
    return (
      <div>
        <PageHeader title="Trip Result" backTo="/app/plan" />
        <p className="text-fg-2">No trip calculated yet.</p>
        <Link to="/app/plan" className="mt-4 inline-block font-semibold text-signal">Plan a trip →</Link>
      </div>
    )
  }

  const origin = trip.origin
  const dest = trip.destination
  const needsFuel = view.assessment.status !== 'enough'

  return (
    <div className="space-y-7">
      <section aria-label="Fuel on arrival" className="relative -mx-4 -mt-4 h-[min(64svh,540px)] min-h-[440px] overflow-hidden sm:mx-0 sm:mt-0 sm:rounded-[32px] sm:border sm:border-fg/10">
        <LiquidTank
          level={Math.max(0, view.assessment.remaining_fuel) / view.profile.tankLiters}
          status={view.assessment.status === 'enough' ? 'ok' : view.assessment.status === 'low' ? 'low' : 'out'}
          reserve={RESERVE_LITERS / view.profile.tankLiters}
          bars={vehicle?.fuel_gauge_bars ?? 8}
          className="absolute inset-0 bg-bg"
        />
        <div className="relative flex h-full flex-col px-5 pb-6 pt-4">
          <div className="flex items-center gap-3">
            <Link to="/app/plan" className="icon-btn h-11 w-11 shrink-0" aria-label="Back to planning">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="title min-w-0 truncate text-xl text-fg">
              {shortPlace(result.origin)} → {shortPlace(result.destination)}
            </h1>
          </div>

          {vehicles.length > 1 && vehicle && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="group" aria-label="Compare vehicle">
              {vehicles.map((v) => (
                <button key={v.id} type="button" className="chip" aria-pressed={v.id === vehicle.id} onClick={() => setSelectedVehicleId(v.id)}>
                  {v.model}
                </button>
              ))}
            </div>
          )}

          <div className="mt-auto drop-shadow-[0_2px_14px_rgb(16_12_8/0.55)]">
            <TripVerdict assessment={view.assessment} />
            {view.preview && (
              <p className="mt-3 text-xs font-semibold text-fg">
                Estimate for the {vehicle?.make} {vehicle?.model}, using its tank and consumption.
              </p>
            )}
          </div>
        </div>
      </section>

      <FuelRouteBar distanceKm={result.distance_km} profile={view.profile} stations={MOCK_STATIONS} />

      <TripResultCard result={view.display} />

      <div className="h-[30vh] min-h-[200px] overflow-hidden rounded-[26px] border border-fg/10 lg:hidden">
        <MapView
          className="h-full"
          markers={[
            { id: 'o', lat: origin.lat, lng: origin.lng, variant: 'origin' },
            { id: 'd', lat: dest.lat, lng: dest.lng, variant: 'destination' },
          ]}
          route={{ points: trip.points }}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        {needsFuel ? (
          <>
            <PrimaryButton fullWidth onClick={() => navigate('/app/stations')}>Find fuel on the route</PrimaryButton>
            <SecondaryButton fullWidth onClick={() => navigate('/app/trip-confirm')}>Start anyway</SecondaryButton>
          </>
        ) : (
          <>
            <PrimaryButton fullWidth onClick={() => navigate('/app/trip-confirm')}>Start the trip</PrimaryButton>
            <SecondaryButton fullWidth onClick={() => navigate('/app/stations')}>Stations on the route</SecondaryButton>
          </>
        )}
      </div>
    </div>
  )
}
