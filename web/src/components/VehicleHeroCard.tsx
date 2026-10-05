import { Link } from 'react-router-dom'
import { ArrowRight, ChevronDown, Loader2 } from 'lucide-react'
import type { Vehicle } from '../api/types'
import type { FuelStatus } from './liquid/LiquidTank'
import { TankCard } from './liquid/TankCard'
import { FuelGauge } from './gauge/FuelGauge'
import { AnimatedNumber } from './liquid/AnimatedNumber'
import { WhereToSearch } from './WhereToSearch'
import { BrandMark } from './layout/BrandMark'
import { useTripPreview } from '../hooks/useTripCalculation'
import { useAppStore } from '../store/appStore'
import { useTripStore } from '../store/tripStore'
import { barsFilled } from '../lib/fuelMath'
import { RESERVE_LITERS } from '../lib/tripAssessment'
import { shortPlace } from '../lib/format'

type Props = {
  vehicle: Vehicle
  vehicles: Vehicle[]
  onSelect: (id: string) => void
  percent: number
  liters: number
  rangeKm: number
  destinations: string[]
}

const STATUS: Record<'enough' | 'low' | 'insufficient', FuelStatus> = { enough: 'ok', low: 'low', insufficient: 'out' }

/**
 * Home hero: the clock gauge reads range, the tank below shows the fuel. Pick a destination
 * and the needle swings (and the liquid drains) to what you will have left when you arrive,
 * using the real route from the backend. A dashed needle stays where the tank is now.
 */
export function VehicleHeroCard({ vehicle, vehicles, onSelect, percent, liters, rangeKm, destinations }: Props) {
  const trip = useTripPreview()
  const draft = useTripStore((s) => s.draft)
  const hasUserLoc = Boolean(useAppStore((s) => s.userLocation))
  const hasOrigin =
    Boolean(draft.origin.trim()) || (draft.origin_lat != null && draft.origin_lng != null) || hasUserLoc
  const tank = vehicle.tank_capacity_liters
  const filled = barsFilled(vehicle.fuel_gauge_bars, percent)
  const a = trip.result?.assessment

  const level = a ? Math.max(0, a.remaining_fuel) / tank : liters / tank
  const status: FuelStatus = a ? STATUS[a.status] : percent < 20 ? 'low' : 'ok'
  const km = a ? Math.max(0, a.remaining_range_km) : rangeKm

  const lamp = !a ? 'text-ok' : a.status === 'enough' ? 'text-ok' : a.status === 'low' ? 'text-warn' : 'text-danger'
  const bars = vehicle.fuel_gauge_bars

  return (
    <section aria-label="Your tank" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <span className="lg:invisible">
          <BrandMark />
        </span>
        <label className="relative">
          <span className="sr-only">Vehicle</span>
          <select
            value={vehicle.id}
            onChange={(e) => {
              trip.clear()
              onSelect(e.target.value)
            }}
            className="chip appearance-none !pr-8"
          >
            {vehicles.map((v) => (
              <option key={v.id} value={v.id} className="bg-panel text-fg">
                {v.model} · {v.tank_capacity_liters} L
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        </label>
      </div>

      <WhereToSearch />

      <FuelGauge
        value={level}
        ghost={a ? liters / tank : null}
        status={status}
        reserve={RESERVE_LITERS / tank}
        bars={bars}
        label={a ? `Fuel gauge: ${Math.round(level * 100)}% on arrival` : `Fuel gauge: ${percent}%`}
        className="mx-auto max-w-[340px]"
      >
        <p className="readout text-[2.6rem] text-fg">
          <AnimatedNumber value={km} />
        </p>
        <p className="unit mt-1">{a ? 'km left on arrival' : 'km of range'}</p>
      </FuelGauge>

      <TankCard level={level} status={status} reserve={RESERVE_LITERS / tank} bars={bars}>
        <span>
          <span className="unit block text-fg">in the tank</span>
          <span className="readout text-[1.7rem] text-fg">
            <AnimatedNumber value={a ? Math.max(0, a.remaining_fuel) : liters} format={(v) => v.toFixed(1)} />
            <span className="ml-1 font-[family-name:var(--font-sans)] text-base font-bold tracking-normal">L</span>
          </span>
        </span>
        <span className="unit text-fg">{a?.status === 'insufficient' ? 'empty' : `${a ? barsFilled(bars, level * 100) : filled} / ${bars} bars`}</span>
      </TankCard>

      {destinations.length > 0 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" role="group" aria-label="Preview a past trip">
          <button type="button" className="chip" aria-pressed={!trip.destination} onClick={trip.clear}>
            Now
          </button>
          {destinations.map((d) => (
            <button
              key={d}
              type="button"
              className="chip"
              aria-pressed={trip.destination === d}
              disabled={!hasOrigin}
              title={hasOrigin ? undefined : 'Set a starting point above first'}
              onClick={() => trip.preview(d)}
            >
              {trip.isPending && trip.destination === d && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {d}
            </button>
          ))}
        </div>
      )}

      <p className="flex items-start gap-3 text-[15px] font-semibold leading-snug text-fg" aria-live="polite">
        <span className={`lamp mt-1.5 shrink-0 ${trip.isError ? 'text-danger' : lamp}`} aria-hidden />
        <span>
          {trip.isPending
            ? `Calculating the road to ${trip.destination}…`
            : trip.isError
              ? `Couldn't route to ${trip.destination}. Try another destination.`
              : a && trip.result
                ? a.status === 'insufficient'
                  ? `${shortPlace(trip.result.destination)} is ${Math.round(trip.result.distance_km)} km. You'd be ${(a.shortage_liters ?? -a.remaining_fuel).toFixed(1)} L short. Refuel on the way.`
                  : `${shortPlace(trip.result.destination)}, ${Math.round(trip.result.distance_km)} km. You arrive with ${a.remaining_fuel.toFixed(1)} L${a.status === 'low' ? ', on reserve.' : '.'}`
                : `${percent < 20 ? 'Running low.' : 'Enough for today.'} Tap a trip to see what you'd arrive with.`}
        </span>
      </p>

      {trip.result ? (
        <button type="button" onClick={trip.open} className="btn btn-primary w-full">
          See the trip <ArrowRight className="h-5 w-5" />
        </button>
      ) : (
        <Link to="/app/fuel/level" className="btn btn-ghost w-full">
          Update fuel level
        </Link>
      )}
    </section>
  )
}
