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
        <p className="text-muted">No trip result yet.</p>
        <Link to="/app/plan" className="mt-4 inline-block font-semibold text-brand-800">Plan a trip</Link>
      </div>
    )
  }

  const origin = resolvePlace(result.origin) ?? PLACES.abidjan
  const dest = resolvePlace(result.destination) ?? PLACES.yamoussoukro
  const needsFuel = view.assessment.status !== 'enough'

  return (
    <div className="space-y-4">
      <PageHeader title="Trip Result" backTo="/app/plan" />

      <div>
        <p className="text-lg font-bold text-ink">{result.origin} → {result.destination}</p>
        {vehicles.length > 1 && vehicle && (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1" role="radiogroup" aria-label="Compare vehicle">
            {vehicles.map((v) => {
              const active = v.id === vehicle.id
              return (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSelectedVehicleId(v.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                    active ? 'border-brand-700 bg-brand-50 text-brand-800' : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <VehicleSilhouette bodyType={resolveBodyType(v)} paint={resolvePaint(v.make, v.paint_color)} className="h-5 w-12 text-slate-900" />
                  {v.make} {v.model}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <TripVerdict assessment={view.assessment} />
      {view.preview && (
        <p className="-mt-2 px-1 text-xs text-muted">
          Preview for the {vehicle?.make} {vehicle?.model} using its tank and average consumption.
        </p>
      )}

      <FuelRouteBar distanceKm={result.distance_km} profile={view.profile} stations={MOCK_STATIONS} />

      <TripResultCard result={view.display} />

      <div className="-mx-4 h-[30vh] min-h-[200px] overflow-hidden lg:hidden">
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
            <PrimaryButton fullWidth onClick={() => navigate('/app/stations')}>Find Fuel Stations</PrimaryButton>
            <SecondaryButton fullWidth onClick={() => navigate('/app/trip-confirm')}>Start Anyway</SecondaryButton>
          </>
        ) : (
          <>
            <SecondaryButton fullWidth onClick={() => navigate('/app/stations')}>Find Fuel Stations</SecondaryButton>
            <PrimaryButton fullWidth onClick={() => navigate('/app/trip-confirm')}>Start Navigation</PrimaryButton>
          </>
        )}
      </div>
    </div>
  )
}
