import { useState } from 'react'
import { MapView } from '../components/map/MapView'
import { PageHeader } from '../components/layout/PageHeader'
import { MOCK_STATIONS } from '../data/mockStations'
import { EmptyState } from '../components/EmptyState'
import { AnimatedNumber } from '../components/liquid/AnimatedNumber'
import { shortPlace } from '../lib/format'
import { useTripRoute } from '../hooks/useTripRoute'
import { useTripStore } from '../store/tripStore'
import { useActiveVehicle } from '../hooks/useActiveVehicle'
import { fuelRequiredLiters, estimatedRangeKm } from '../lib/fuelMath'
import { vehicleFuelProfile } from '../lib/tripAssessment'

type Tab = 'along' | 'cheapest'

/** Stations on the route, priced like the big digits on a pump sign. Pick one to see what a fill-up costs there. */
export function FuelStationsPage() {
  const [tab, setTab] = useState<Tab>('along')
  const trip = useTripRoute()
  const draft = useTripStore((s) => s.draft)
  const { vehicle } = useActiveVehicle()
  const stations = [...MOCK_STATIONS].sort((a, b) =>
    tab === 'cheapest' ? a.pricePerLiter - b.pricePerLiter : a.distanceKmFromStart - b.distanceKmFromStart,
  )
  const cheapestId = [...MOCK_STATIONS].sort((a, b) => a.pricePerLiter - b.pricePerLiter)[0]?.id
  const [picked, setPicked] = useState<string | undefined>(cheapestId)
  const station = MOCK_STATIONS.find((s) => s.id === picked)

  // What's left in the tank on arrival at the station, and what topping it up costs.
  const profile = vehicle ? vehicleFuelProfile(vehicle) : null
  const fill = station && profile
    ? (() => {
        const left = Math.max(0, profile.startingLiters - fuelRequiredLiters(station.distanceKmFromStart, profile.consumption))
        const add = Math.max(0, profile.tankLiters - left)
        return { left, add, cost: add * station.pricePerLiter, range: estimatedRangeKm(profile.tankLiters, profile.consumption) }
      })()
    : null

  return (
    <div className="space-y-5">
      <PageHeader title="Fuel on the route" backTo="/app" subtitle={`${shortPlace(draft.origin)} → ${shortPlace(draft.destination)}`} />

      <div className="seg" role="group" aria-label="Sort stations">
        <button type="button" aria-pressed={tab === 'along'} onClick={() => setTab('along')}>
          Route order
        </button>
        <button type="button" aria-pressed={tab === 'cheapest'} onClick={() => setTab('cheapest')}>
          Cheapest
        </button>
      </div>

      <div className="-mx-4 h-52 overflow-hidden border-y border-line sm:mx-0 sm:rounded-[22px] sm:border lg:hidden">
        <MapView
          className="h-full"
          route={{ points: trip.points }}
          markers={[
            { id: 'o', lat: trip.origin.lat, lng: trip.origin.lng, variant: 'origin' },
            { id: 'd', lat: trip.destination.lat, lng: trip.destination.lng, variant: 'destination' },
            ...stations.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, variant: 'station' as const, label: `${s.name} · ${s.town}` })),
          ]}
        />
      </div>

      {stations.length === 0 ? (
        <EmptyState title="No stations on this route" description="Try another route or widen your search." />
      ) : (
        <ul className="space-y-2" aria-label="Stations">
          {stations.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                aria-pressed={s.id === picked}
                onClick={() => setPicked(s.id)}
                className="flex w-full items-center gap-3.5 rounded-[20px] border border-transparent p-2.5 text-left transition hover:bg-fg/5 aria-pressed:border-signal/60 aria-pressed:bg-signal/8"
              >
                <span className="price-sign">{s.pricePerLiter}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold text-fg">
                    {s.name} · {s.town}
                  </span>
                  <span className="unit block">
                    km {s.distanceKmFromStart}
                    {s.id === cheapestId && <span className="text-ok"> · cheapest</span>}
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
      <p className="unit">sample station data · prices may differ at the pump</p>
    </div>
  )
}
