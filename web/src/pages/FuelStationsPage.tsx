import { useEffect, useMemo, useState } from 'react'
import { MapView } from '../components/map/MapView'
import { PageHeader } from '../components/layout/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { AnimatedNumber } from '../components/liquid/AnimatedNumber'
import { shortPlace } from '../lib/format'
import { useTripRoute } from '../hooks/useTripRoute'
import { useRouteStations, useRouteStationsMeta } from '../hooks/useRouteStations'
import { formatStationPrice, stationMapPosition, stationSortPrice } from '../lib/fuelStation'
import { useTripStore } from '../store/tripStore'
import { useActiveVehicle } from '../hooks/useActiveVehicle'
import { fuelRequiredLiters, estimatedRangeKm } from '../lib/fuelMath'
import { vehicleFuelProfile } from '../lib/tripAssessment'

type Tab = 'along' | 'cheapest'

/** Stations on the driven route (Mapbox POIs when the API uses Mapbox). */
export function FuelStationsPage() {
  const [tab, setTab] = useState<Tab>('along')
  const trip = useTripRoute()
  const draft = useTripStore((s) => s.draft)
  const lastResult = useTripStore((s) => s.lastResult)
  const routeStations = useRouteStations(lastResult?.distance_km)
  const stationsMeta = useRouteStationsMeta()
  const { vehicle, fuelPricePerLiter } = useActiveVehicle()
  const selectedFuelStationId = useTripStore((s) => s.selectedFuelStationId)
  const setSelectedFuelStationId = useTripStore((s) => s.setSelectedFuelStationId)

  const stations = useMemo(
    () =>
      [...routeStations].sort((a, b) =>
        tab === 'cheapest'
          ? stationSortPrice(a, b, fuelPricePerLiter)
          : a.distanceKmFromStart - b.distanceKmFromStart,
      ),
    [routeStations, tab, fuelPricePerLiter],
  )
  const cheapestId = [...routeStations].sort((a, b) => stationSortPrice(a, b, fuelPricePerLiter))[0]?.id
  const picked = selectedFuelStationId ?? cheapestId
  const station = routeStations.find((s) => s.id === picked)
  const focusStation = routeStations.find((s) => s.id === picked)

  useEffect(() => {
    if (routeStations.length > 0 && !selectedFuelStationId && cheapestId) {
      setSelectedFuelStationId(cheapestId)
    }
  }, [routeStations.length, cheapestId, selectedFuelStationId, setSelectedFuelStationId])

  const profile = vehicle ? vehicleFuelProfile(vehicle) : null
  const fill = station && profile
    ? (() => {
        const left = Math.max(0, profile.startingLiters - fuelRequiredLiters(station.distanceKmFromStart, profile.consumption))
        const add = Math.max(0, profile.tankLiters - left)
        const unit = station.pricePerLiter > 0 ? station.pricePerLiter : fuelPricePerLiter
        return { left, add, cost: add * unit, range: estimatedRangeKm(profile.tankLiters, profile.consumption) }
      })()
    : null

  const hasRoute = trip.points.length > 1 && (lastResult?.distance_km ?? 0) > 0

  return (
    <div className="space-y-5">
      <PageHeader title="Fuel on the route" backTo="/app" subtitle={`${shortPlace(draft.origin)} → ${shortPlace(draft.destination)}`} />

      {!hasRoute && (
        <EmptyState
          title="Plan a trip first"
          description="Stations are placed on the fastest road route between your start and destination."
          actionLabel="Plan a trip"
          onAction={() => {
            window.location.href = '/app/plan'
          }}
        />
      )}

      {hasRoute && (
        <>
          <div className="seg" role="group" aria-label="Sort stations">
            <button type="button" aria-pressed={tab === 'along'} onClick={() => setTab('along')}>
              Route order
            </button>
            <button type="button" aria-pressed={tab === 'cheapest'} onClick={() => setTab('cheapest')}>
              Cheapest
            </button>
          </div>

          <div className="-mx-4 h-52 overflow-hidden border-y border-line sm:mx-0 sm:rounded-md sm:border lg:hidden">
            <MapView
              className="h-full"
              allowMapPin
              cameraLock="content"
              route={{ points: trip.points }}
              focusPoint={focusStation ? stationMapPosition(focusStation) : null}
              onMarkerClick={(id) => setSelectedFuelStationId(id)}
              markers={[
                { id: 'o', lat: trip.origin.lat, lng: trip.origin.lng, variant: 'origin' },
                { id: 'd', lat: trip.destination.lat, lng: trip.destination.lng, variant: 'destination' },
                ...stations.map((s) => ({
                  id: s.id,
                  ...stationMapPosition(s),
                  variant: 'station' as const,
                  label: `${s.name} · ${s.town}`,
                  selected: s.id === picked,
                })),
              ]}
            />
          </div>

          {stationsMeta.isLoading && routeStations.length === 0 ? (
            <p className="unit py-6 text-center">Loading fuel stations along your route…</p>
          ) : stations.length === 0 ? (
            <EmptyState
              title="No live stations yet"
              description={
                stationsMeta.isMockApi
                  ? 'The API is in demo mode. Set MAP_PROVIDER=mapbox and MAP_API_KEY=sk.… in backend/.env, restart the API, then plan the trip again.'
                  : stationsMeta.fetchFailed
                    ? 'Could not reach the fuel POI service. Sign in, restart the API, and try again.'
                    : 'Mapbox returned no fuel stops for this route. Use a secret token (sk.…) with Search Box enabled, then re-plan the trip.'
              }
            />
          ) : (
            <ul className="space-y-2" aria-label="Stations">
              {stations.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    aria-pressed={s.id === picked}
                    onClick={() => setSelectedFuelStationId(s.id)}
                    className="flex w-full items-center gap-3.5 rounded-md border border-transparent p-2.5 text-left transition hover:bg-fg/5 aria-pressed:border-signal/60 aria-pressed:bg-signal/8"
                  >
                    <span className="price-sign">{formatStationPrice(s.pricePerLiter, fuelPricePerLiter)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold text-fg">
                        {s.name} · {s.town}
                      </span>
                      <span className="unit block">
                        km {s.distanceKmFromStart} on route
                        {s.pricePerLiter <= 0 && <span className="text-fg-3"> · price est.</span>}
                        {s.id === cheapestId && s.pricePerLiter > 0 && <span className="text-ok"> · cheapest</span>}
                      </span>
                    </span>
                    <span className="unit">F/L</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {station && fill && (
            <section className="glass p-4" aria-live="polite">
              <p className="unit flex justify-between">
                <span>fill up at {station.town}</span>
                <span>km {station.distanceKmFromStart}</span>
              </p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <p className="readout text-[2.4rem] text-fg">
                  <AnimatedNumber value={fill.cost} />
                  <span className="ml-1 font-[family-name:var(--font-sans)] text-base font-bold tracking-normal">F</span>
                </p>
                <p className="text-right">
                  <span className="block font-extrabold text-fg">+{fill.add.toFixed(1)} L</span>
                  <span className="text-xs font-semibold text-fg-3">then {Math.round(fill.range)} km of range</span>
                </p>
              </div>
              <p className="mt-2 text-xs font-semibold text-fg-3">You&apos;d pull in with about {fill.left.toFixed(1)} L left.</p>
            </section>
          )}
          {stationsMeta.isLive && (
            <p className="unit">{stationsMeta.disclaimer ?? 'Live stations from Mapbox · prices are your estimates.'}</p>
          )}
        </>
      )}
    </div>
  )
}
