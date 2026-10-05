import { Link } from 'react-router-dom'
import { ArrowRight, ChevronDown, Loader2 } from 'lucide-react'
import type { Vehicle } from '../api/types'
import { LiquidTank, type FuelStatus } from './liquid/LiquidTank'
import { AnimatedNumber } from './liquid/AnimatedNumber'
import { WhereToSearch } from './WhereToSearch'
import { BrandMark } from './layout/BrandMark'
import { useTripPreview } from '../hooks/useTripCalculation'
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
 * Home hero: the screen is the tank. Pick a destination and the liquid drains to what
 * you will have left when you arrive, using the real route from the backend.
 */
export function VehicleHeroCard({ vehicle, vehicles, onSelect, percent, liters, rangeKm, destinations }: Props) {
  const trip = useTripPreview()
  const tank = vehicle.tank_capacity_liters
  const filled = barsFilled(vehicle.fuel_gauge_bars, percent)
  const a = trip.result?.assessment

  const level = a ? Math.max(0, a.remaining_fuel) / tank : liters / tank
  const status: FuelStatus = a ? STATUS[a.status] : percent < 20 ? 'low' : 'ok'
  const km = a ? Math.max(0, a.remaining_range_km) : rangeKm

  return (
    <section aria-label="Your tank" className="relative -mx-4 -mt-4 h-[min(82svh,720px)] min-h-[600px] overflow-hidden sm:mx-0 sm:mt-0 sm:rounded-[32px] sm:border sm:border-fg/10">
      <LiquidTank level={level} status={status} reserve={RESERVE_LITERS / tank} bars={vehicle.fuel_gauge_bars} className="absolute inset-0 bg-bg" />

      <div className="relative flex h-full flex-col px-5 pb-6 pt-4">
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

        <div className="mt-4">
          <WhereToSearch />
        </div>

        <div className="mt-auto">
          <p className="readout text-[5.5rem] text-fg drop-shadow-[0_2px_18px_rgb(16_12_8/0.5)] sm:text-[6.5rem]">
            <AnimatedNumber value={km} />
            <span className="ml-2 font-[family-name:var(--font-sans)] text-2xl font-bold tracking-normal">{a ? 'km left' : 'km'}</span>
          </p>
          <p className="mt-3 max-w-[30ch] text-[15px] font-semibold leading-snug text-fg drop-shadow-[0_1px_8px_rgb(16_12_8/0.6)]" aria-live="polite">
            {trip.isPending
              ? `Calculating the road to ${trip.destination}…`
              : trip.isError
                ? `Couldn't route to ${trip.destination}. Try another destination.`
                : a && trip.result
                  ? a.status === 'insufficient'
                    ? `${shortPlace(trip.result.destination)} is ${Math.round(trip.result.distance_km)} km. You'd be ${(a.shortage_liters ?? -a.remaining_fuel).toFixed(1)} L short. Refuel on the way.`
                    : `${shortPlace(trip.result.destination)}, ${Math.round(trip.result.distance_km)} km. You arrive with ${a.remaining_fuel.toFixed(1)} L${a.status === 'low' ? ', on reserve.' : '.'}`
                  : `${liters.toFixed(1)} L in the tank, ${filled} of ${vehicle.fuel_gauge_bars} bars.`}
          </p>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="group" aria-label="Preview a trip">
            <button type="button" className="chip" aria-pressed={!trip.destination} onClick={trip.clear}>
              Right now
            </button>
            {destinations.map((d) => (
              <button key={d} type="button" className="chip" aria-pressed={trip.destination === d} onClick={() => trip.preview(d)}>
                {trip.isPending && trip.destination === d && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {d}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3">
            {trip.result ? (
              <button type="button" onClick={trip.open} className="btn btn-primary flex-1">
                See the trip <ArrowRight className="h-5 w-5" />
              </button>
            ) : (
              <Link to="/app/fuel/level" className="btn btn-ghost flex-1">
                Update fuel level
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
