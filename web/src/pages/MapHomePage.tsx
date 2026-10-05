import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getFuelCurrent } from '../api/endpoints'
import { useActiveVehicle } from '../hooks/useActiveVehicle'
import { useTripStore } from '../store/tripStore'
import { MapView } from '../components/map/MapView'
import { useUserMapCenter } from '../hooks/useUserMapCenter'
import { useAppStore } from '../store/appStore'
import { CITIES, ROAD_FACTOR } from '../data/cities'
import { estimatedRangeKm } from '../lib/fuelMath'
import { assessTripFuel, vehicleFuelProfile } from '../lib/tripAssessment'
import { AnimatedNumber } from '../components/liquid/AnimatedNumber'
import { shortPlace } from '../lib/format'

const TONE = { enough: 'ok', low: 'low', insufficient: 'out' } as const
const VERDICT = { enough: 'In reach', low: 'On reserve', insufficient: 'Refuel first' } as const
const VERDICT_CLASS = { enough: 'text-ok', low: 'text-warn', insufficient: 'text-danger' } as const

/** Range on the map: optional city comparison — nothing selected until the user taps. */
export function MapHomePage() {
  const { vehicle } = useActiveVehicle()
  const draft = useTripStore((s) => s.draft)
  const originName = draft.origin
  const setDraft = useTripStore((s) => s.setDraft)
  const userLocation = useAppStore((s) => s.userLocation)
  const userCenter = useUserMapCenter()
  const [picked, setPicked] = useState<string | null>(null)
  const fuelQuery = useQuery({
    queryKey: ['fuel-current', vehicle?.id],
    queryFn: () => getFuelCurrent(vehicle!.id),
    enabled: Boolean(vehicle?.id),
  })

  const center = userCenter
  const liters = fuelQuery.data?.estimated_fuel_liters ?? vehicle?.estimated_fuel_liters ?? 30
  const consumption = fuelQuery.data?.consumption_l_per_100km ?? vehicle?.mixed_consumption ?? 7.5
  const rangeKm = fuelQuery.data?.estimated_range_km ?? estimatedRangeKm(liters, consumption)
  const profile = vehicle
    ? { ...vehicleFuelProfile(vehicle), startingLiters: liters, consumption }
    : { startingLiters: liters, tankLiters: 50, consumption }

  const towns = CITIES.map((c) => ({ ...c, a: assessTripFuel(c.roadKmFromAbidjan, profile) }))
  const town = picked ? towns.find((t) => t.name === picked) : null

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="unit">
            reach on {liters.toFixed(0)} L
            {originName.trim()
              ? ` · from ${shortPlace(originName)}`
              : userLocation
                ? ' · from your location'
                : ' · set a start point on Home'}
          </p>
          <p className="readout mt-1 text-[2.6rem] text-fg">
            <AnimatedNumber value={rangeKm} />
            <span className="ml-1 font-[family-name:var(--font-sans)] text-lg font-bold tracking-normal">km</span>
          </p>
        </div>
        <Link to="/app/plan" className="chip">
          Plan trip
        </Link>
      </div>

      <div className="-mx-4 h-[min(56svh,520px)] min-h-[280px] overflow-hidden border-y border-line sm:mx-0 sm:rounded-md sm:border lg:h-[min(64vh,560px)]">
        <MapView
          className="h-full w-full min-h-[280px]"
          allowMapPin
          center={center}
          zoom={12}
          cameraLock="user"
          rangeCircle={{ center, radiusMeters: (rangeKm / ROAD_FACTOR) * 1000 }}
          markers={[
            { id: 'me', lat: center.lat, lng: center.lng, variant: 'user' },
            ...(draft.destination_lat != null && draft.destination_lng != null
              ? [
                  {
                    id: 'pinned-dest',
                    lat: draft.destination_lat,
                    lng: draft.destination_lng,
                    variant: 'destination' as const,
                    label: draft.destination || 'Destination',
                  },
                ]
              : []),
            ...towns.map((t) => ({
              id: t.name,
              lat: t.lat,
              lng: t.lng,
              variant: 'city' as const,
              label: t.name,
              tone: TONE[t.a.status],
              selected: t.name === picked,
            })),
          ]}
          onMarkerClick={setPicked}
          loading={fuelQuery.isLoading}
        />
      </div>

      <section className="glass p-4" aria-live="polite">
        {town ? (
          <>
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
            <Link
              to="/app/plan"
              className="btn btn-primary btn-sm mt-3 w-full"
              onClick={() => setDraft({ destination: town.name })}
            >
              Open in trip planner
            </Link>
          </>
        ) : (
          <p className="text-sm font-semibold text-fg-2">
            Tap the <strong className="font-bold text-fg">pin</strong> on the map, then tap where you want to go — or pick a town below.
          </p>
        )}
      </section>

      <p className="text-xs font-semibold text-fg-3">
        The dashed ring is an approximate driving range. Road distances use sample city data when you have not calculated a custom route yet.
      </p>
    </div>
  )
}
