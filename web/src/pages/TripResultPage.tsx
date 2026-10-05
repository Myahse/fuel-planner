import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { TripCalculateResult } from '../api/types'
import { useTripStore, type TripPlanDraft } from '../store/tripStore'
import { useActiveVehicle } from '../hooks/useActiveVehicle'
import { PageHeader } from '../components/layout/PageHeader'
import { MapView } from '../components/map/MapView'
import { PLACES, resolvePlace } from '../data/mapPlaces'
import { MOCK_STATIONS } from '../data/mockStations'
import { interpolateRoute } from '../components/map/routeGeometry'
import { TripResultCard } from '../components/TripResultCard'
import { TripVerdict } from '../components/StatusCard'
import { FuelRouteBar } from '../components/FuelRouteBar'
import { VehicleSilhouette } from '../components/car3d/VehicleSilhouette'
import { PrimaryButton } from '../components/buttons/PrimaryButton'
import { SecondaryButton } from '../components/buttons/SecondaryButton'
import { resolveBodyType, resolvePaint } from '../config/vehicleModels'
import { assessTripFuel, vehicleFuelProfile, type VehicleFuelProfile } from '../lib/tripAssessment'

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

  const origin = resolvePlace(result.origin) ?? PLACES.abidjan
  const dest = resolvePlace(result.destination) ?? PLACES.yamoussoukro
  const needsFuel = view.assessment.status !== 'enough'

  return (
    <div className="space-y-7">
      <PageHeader title={`${result.origin} → ${result.destination}`} backTo="/app/plan" />

      {vehicles.length > 1 && vehicle && (
        <div className="-mt-1 flex gap-5 overflow-x-auto border-b border-line" role="tablist" aria-label="Compare vehicle">
          {vehicles.map((v) => {
            const active = v.id === vehicle.id
            return (
              <button
                key={v.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedVehicleId(v.id)}
                className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 pb-2.5 text-sm font-semibold transition ${
                  active ? 'border-signal text-fg' : 'border-transparent text-fg-3 hover:text-fg-2'
                }`}
              >
                <VehicleSilhouette bodyType={resolveBodyType(v)} paint={resolvePaint(v.make, v.paint_color)} className="h-4 w-10 text-fg" />
                {v.model}
              </button>
            )
          })}
        </div>
      )}

      <div>
        <TripVerdict assessment={view.assessment} />
        {view.preview && (
          <p className="unit mt-3 pl-4">
            estimate for the {vehicle?.make.toLowerCase()} {vehicle?.model.toLowerCase()} · its tank, its consumption
          </p>
        )}
      </div>

      <FuelRouteBar distanceKm={result.distance_km} profile={view.profile} stations={MOCK_STATIONS} />

      <TripResultCard result={view.display} />

      <div className="-mx-4 h-[30vh] min-h-[200px] overflow-hidden border-y border-line lg:hidden">
        <MapView
          className="h-full"
          markers={[
            { id: 'o', lat: origin.lat, lng: origin.lng, variant: 'origin' },
            { id: 'd', lat: dest.lat, lng: dest.lng, variant: 'destination' },
          ]}
          route={{ points: interpolateRoute(origin, dest) }}
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
