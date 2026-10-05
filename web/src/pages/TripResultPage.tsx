import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { TripCalculateResult } from '../api/types'
import { useTripStore, type TripPlanDraft } from '../store/tripStore'
import { useActiveVehicle } from '../hooks/useActiveVehicle'
import { PageHeader } from '../components/layout/PageHeader'
import { MapView } from '../components/map/MapView'
import { TripResultCard } from '../components/TripResultCard'
import { TripVerdict } from '../components/StatusCard'
import { FuelRouteBar } from '../components/FuelRouteBar'
import { FuelGauge } from '../components/gauge/FuelGauge'
import { ArrowLeft } from 'lucide-react'
import { PrimaryButton } from '../components/buttons/PrimaryButton'
import { SecondaryButton } from '../components/buttons/SecondaryButton'
import { RESERVE_LITERS, assessTripFuel, vehicleFuelProfile, type VehicleFuelProfile } from '../lib/tripAssessment'
import { shortPlace } from '../lib/format'
import { useRouteStations } from '../hooks/useRouteStations'
import { stationMapPosition } from '../lib/fuelStation'
import { useTripRoute } from '../hooks/useTripRoute'
import { useUserMapCenter } from '../hooks/useUserMapCenter'
import { draftMatchesStoredPlan } from '../lib/tripRoutePlan'
import { waypointsForApi } from '../lib/tripWaypoints'

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
  const userCenter = useUserMapCenter()
  const routeStations = useRouteStations(result?.distance_km)
  const storedPlan = loadSession<TripPlanDraft>('lastTripPlan')
  const calculatedFor = storedPlan?.vehicle_id
  const draft = useTripStore((s) => s.draft)
  const expectedStops = waypointsForApi(storedPlan?.waypoints ?? draft.waypoints).length
  const stopsInCalc = result?.waypoint_count ?? 0
  const stopsMissingFromCalc =
    Boolean(result) &&
    (storedPlan?.trip_type === 'multi_stop' || draft.trip_type === 'multi_stop') &&
    expectedStops > 0 &&
    stopsInCalc < expectedStops
  const planOutOfDate = Boolean(result) && !draftMatchesStoredPlan(draft, storedPlan)

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
  const a = view.assessment
  const needsFuel = a.status !== 'enough'
  const tankL = view.profile.tankLiters
  const reserve = RESERVE_LITERS / tankL
  const arriveStatus = a.status === 'enough' ? 'ok' : a.status === 'low' ? 'low' : 'out'
  const stops = routeStations

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/app/plan" className="icon-btn h-11 w-11 shrink-0" aria-label="Back to planning">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="title min-w-0 truncate text-xl text-fg">
          {shortPlace(result.origin)} → {shortPlace(result.destination)}
        </h1>
      </div>

      {vehicles.length > 1 && vehicle && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" role="group" aria-label="Compare vehicle">
          {vehicles.map((v) => (
            <button key={v.id} type="button" className="chip" aria-pressed={v.id === vehicle.id} onClick={() => setSelectedVehicleId(v.id)}>
              {v.model}
            </button>
          ))}
        </div>
      )}

      {(stopsMissingFromCalc || planOutOfDate) && (
        <p className="rounded-sm border border-warn/40 bg-warn/10 px-3 py-2.5 text-sm text-fg" role="status">
          {stopsMissingFromCalc
            ? `This estimate may not include all ${expectedStops} stop(s) on your route.`
            : 'Your plan changed since this calculation.'}{' '}
          <Link to="/app/plan" className="font-bold text-signal hover:text-signal-hi">
            Recalculate on Plan trip
          </Link>
        </p>
      )}

      <div>
        <TripVerdict assessment={a} />
        {view.preview && (
          <p className="mt-3 text-xs font-semibold text-fg-2">
            Estimate for the {vehicle?.make} {vehicle?.model}, using its tank and consumption.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {(
          [
            ['leave', a.starting_fuel, 'ok'],
            ['arrive', Math.max(0, a.remaining_fuel), arriveStatus],
          ] as const
        ).map(([k, l, st]) => (
          <div key={k} className="glass px-2 pb-3 pt-3">
            <p className="unit text-center">{k}</p>
            <FuelGauge
              value={l / tankL}
              status={st}
              reserve={reserve}
              bars={vehicle?.fuel_gauge_bars ?? 8}
              compact
              label={`${k === 'leave' ? 'Leaving with' : 'Arriving with'} ${l.toFixed(1)} litres`}
              className="mx-auto max-w-[200px]"
            >
              <p className={`readout text-[1.5rem] ${st === 'out' ? 'text-danger' : st === 'low' ? 'text-warn' : k === 'arrive' ? 'text-ok' : 'text-fg'}`}>
                {st === 'out' ? 'empty' : l.toFixed(1)}
                {st !== 'out' && <span className="ml-0.5 font-[family-name:var(--font-sans)] text-sm font-bold tracking-normal">L</span>}
              </p>
            </FuelGauge>
          </div>
        ))}
      </div>

      <FuelRouteBar distanceKm={result.distance_km} profile={view.profile} stations={routeStations} />

      <section aria-label="Along the road">
        <p className="unit mb-2">along the road</p>
        <ol className="glass divide-y divide-line px-4">
          {[
            { id: 'o', name: shortPlace(result.origin), km: 0, note: `${a.starting_fuel.toFixed(1)} L` },
            ...stops.map((st) => ({ id: st.id, name: `${st.name} · ${st.town}`, km: st.distanceKmFromStart, note: `${st.pricePerLiter} F/L`, station: true })),
            { id: 'd', name: shortPlace(result.destination), km: Math.round(result.distance_km), note: a.status === 'insufficient' ? 'short' : `${Math.max(0, a.remaining_fuel).toFixed(1)} L` },
          ].map((row) => (
            <li key={row.id} className="flex items-center gap-3 py-3">
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${'station' in row ? 'bg-signal' : 'border-2 border-fg'}`}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-fg">{row.name}</span>
              <span className="unit whitespace-nowrap">
                {row.note} · km {row.km}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <TripResultCard result={view.display} />

      <div className="h-[min(36vh,320px)] min-h-[220px] overflow-hidden rounded-md border border-fg/10 lg:hidden">
        <MapView
          className="h-full w-full min-h-[220px]"
          allowMapPin
          center={userCenter}
          zoom={11}
          markers={[
            { id: 'o', lat: origin.lat, lng: origin.lng, variant: 'origin' },
            { id: 'd', lat: dest.lat, lng: dest.lng, variant: 'destination' },
            ...stops.map((st) => ({
              id: st.id,
              ...stationMapPosition(st),
              variant: 'station' as const,
              label: `${st.name} · ${st.town}`,
            })),
          ]}
          route={{ points: trip.points }}
          cameraLock="content"
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
