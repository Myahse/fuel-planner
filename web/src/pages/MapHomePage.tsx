import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { getFuelCurrent } from '../api/endpoints'
import { useActiveVehicle } from '../hooks/useActiveVehicle'
import { useTripCalculation } from '../hooks/useTripCalculation'
import { MapView } from '../components/map/MapView'
import { PLACES } from '../data/mapPlaces'
import { CITIES, ROAD_FACTOR } from '../data/cities'
import { estimatedRangeKm } from '../lib/fuelMath'
import { assessTripFuel, vehicleFuelProfile } from '../lib/tripAssessment'
import { AnimatedNumber } from '../components/liquid/AnimatedNumber'

const TONE = { enough: 'ok', low: 'low', insufficient: 'out' } as const
const VERDICT = { enough: 'In reach', low: 'On reserve', insufficient: 'Refuel first' } as const
const VERDICT_CLASS = { enough: 'text-ok', low: 'text-warn', insufficient: 'text-danger' } as const

/** Range radar on the real map: a ring for how far the tank reaches, towns lit by whether you can get there. */
export function MapHomePage() {
  const { vehicle } = useActiveVehicle()
  const { calculate, isPending } = useTripCalculation()
  const [picked, setPicked] = useState('Yamoussoukro')
  const fuelQuery = useQuery({
    queryKey: ['fuel-current', vehicle?.id],
    queryFn: () => getFuelCurrent(vehicle!.id),
    enabled: Boolean(vehicle?.id),
  })

  const center = PLACES.abidjan
  const liters = fuelQuery.data?.estimated_fuel_liters ?? vehicle?.estimated_fuel_liters ?? 30
  const consumption = fuelQuery.data?.consumption_l_per_100km ?? vehicle?.mixed_consumption ?? 7.5
  const rangeKm = fuelQuery.data?.estimated_range_km ?? estimatedRangeKm(liters, consumption)
  const profile = vehicle
    ? { ...vehicleFuelProfile(vehicle), startingLiters: liters, consumption }
    : { startingLiters: liters, tankLiters: 50, consumption }

  const towns = CITIES.map((c) => ({ ...c, a: assessTripFuel(c.roadKmFromAbidjan, profile) }))
  const town = towns.find((t) => t.name === picked) ?? towns[0]

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="unit">reach on {liters.toFixed(0)} L · from Abidjan</p>
          <p className="readout mt-1 text-[2.6rem] text-fg">
            <AnimatedNumber value={rangeKm} />
            <span className="ml-1 font-[family-name:var(--font-sans)] text-lg font-bold tracking-normal">km</span>
          </p>
        </div>
        <span className="chip" aria-hidden>
          Côte d&apos;Ivoire
        </span>
      </div>

      <div className="-mx-4 h-[56svh] min-h-[340px] overflow-hidden border-y border-line sm:mx-0 sm:rounded-[26px] sm:border lg:h-[64vh]">
        <MapView
          className="h-full"
          center={center}
          zoom={6}
          rangeCircle={{ center, radiusMeters: (rangeKm / ROAD_FACTOR) * 1000 }}
          markers={[
            { id: 'me', lat: center.lat, lng: center.lng, variant: 'user' },
            ...towns.map((t) => ({
              id: t.name,
              lat: t.lat,
              lng: t.lng,
              variant: 'city' as const,
              label: t.name,
              tone: TONE[t.a.status],
              selected: t.name === town.name,
            })),
          ]}
          onMarkerClick={setPicked}
          loading={fuelQuery.isLoading}
        />
      </div>

      <section className="glass p-4" aria-live="polite">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-fg">{town.name}</h2>
          <span className={`text-sm font-extrabold ${VERDICT_CLASS[town.a.status]}`}>{VERDICT[town.a.status]}</span>
        </div>
        <p className="mt-1 text-sm font-semibold text-fg-2">
          {town.roadKmFromAbidjan} km by road · needs {town.a.fuel_required.toFixed(1)} L ·{' '}
          {town.a.status === 'insufficient'
            ? `${(town.a.shortage_liters ?? 0).toFixed(1)} L short`
            : `arrive with ${town.a.remaining_fuel.toFixed(1)} L`}
        </p>
        <button
          type="button"
          className="btn btn-primary btn-sm mt-3 w-full"
          disabled={isPending}
          onClick={() => calculate({ origin: 'Abidjan', destination: town.name, trip_type: 'one_way' })}
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />} Plan this trip
        </button>
      </section>

      <p className="text-xs font-semibold text-fg-3">
        Tap a town on the map. The dashed ring is how far the tank reaches in a straight line; towns are coloured by their real road distance.
      </p>
    </div>
  )
}
