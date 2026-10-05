import { useId } from 'react'
import { Fuel } from 'lucide-react'
import type { FuelStation } from '../data/mockStations'
import { RESERVE_LITERS, kmWhenFuelReaches, type VehicleFuelProfile } from '../lib/tripAssessment'
import { fuelRequiredLiters } from '../lib/fuelMath'
import { formatKm, formatLiters } from '../lib/format'

type Props = {
  distanceKm: number
  profile: VehicleFuelProfile
  stations?: FuelStation[]
}

/** Keep a label anchored at fraction `f` of the width from spilling past either edge. */
const edgeAlign = (f: number) => (f < 0.15 ? '' : f > 0.85 ? '-translate-x-full' : '-translate-x-1/2')

const pct = (v: number, max: number) => `${Math.min(100, Math.max(0, (v / max) * 100))}%`

/**
 * Fuel in the tank along the route, scaled to the vehicle's own tank and consumption:
 * a bigger tank or thirstier engine visibly changes the slope, the reserve band and where to refuel.
 */
export function FuelRouteBar({ distanceKm, profile, stations = [] }: Props) {
  const clipId = `fuel-clip-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const { startingLiters, tankLiters } = profile
  const endLiters = startingLiters - fuelRequiredLiters(distanceKm, profile.consumption)
  const reserveKm = kmWhenFuelReaches(RESERVE_LITERS, distanceKm, profile)
  const emptyKm = kmWhenFuelReaches(0, distanceKm, profile)

  const onRoute = stations.filter((s) => s.distanceKmFromStart > 0 && s.distanceKmFromStart < distanceKm)
  const refuelBy = reserveKm ?? emptyKm
  const recommended =
    refuelBy != null ? [...onRoute].reverse().find((s) => s.distanceKmFromStart <= refuelBy) : undefined

  // Chart space: x = km (0..distance), y = liters (0..tank), y flipped for SVG.
  const y = (l: number) => 100 - (Math.max(0, l) / tankLiters) * 100
  const x = (km: number) => (km / distanceKm) * 100
  const lineEndKm = emptyKm ?? distanceKm
  const reserveTop = y(RESERVE_LITERS)

  return (
    <div className="card-surface p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink">Fuel along the route</h2>
        <p className="text-xs text-muted">{formatLiters(tankLiters, 0)} tank</p>
      </div>

      <div className="relative mt-4 h-36">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          <defs>
            <clipPath id={clipId}>
              <rect x="0" y="0" width="100" height={reserveTop} />
            </clipPath>
          </defs>
          <rect x="0" y={reserveTop} width="100" height={100 - reserveTop} className="fill-red-100" />
          <line x1="0" x2="100" y1={reserveTop} y2={reserveTop} className="stroke-red-300" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
          <polygon
            points={`0,100 0,${y(startingLiters)} ${x(lineEndKm)},${y(endLiters)} ${x(lineEndKm)},100`}
            className="fill-brand-500/15"
            clipPath={`url(#${clipId})`}
          />
          <line
            x1="0" y1={y(startingLiters)} x2={x(lineEndKm)} y2={y(endLiters)}
            className="stroke-brand-700" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke"
          />
          {emptyKm != null && (
            <line
              x1={x(emptyKm)} y1="100" x2="100" y2="100"
              className="stroke-red-600" strokeWidth="3" strokeDasharray="4 3" vectorEffect="non-scaling-stroke"
            />
          )}
          {reserveKm != null && (
            <line x1={x(reserveKm)} x2={x(reserveKm)} y1="0" y2="100" className="stroke-amber-500" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
          )}
        </svg>

        <span className="absolute left-0 -translate-y-full pb-1 text-xs font-semibold text-ink" style={{ top: pct(tankLiters - startingLiters, tankLiters) }}>
          {formatLiters(startingLiters)}
        </span>
        {emptyKm == null && (
          <span
            className="absolute right-0 -translate-y-full pb-1 text-xs font-semibold text-ink"
            style={{ top: pct(tankLiters - endLiters, tankLiters) }}
          >
            {formatLiters(endLiters)}
          </span>
        )}
        {reserveKm != null && (
          <span
            className={`absolute top-0 whitespace-nowrap ${edgeAlign(reserveKm / distanceKm)} rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900`}
            style={{ left: pct(reserveKm, distanceKm) }}
          >
            Reserve at {formatKm(reserveKm)}
          </span>
        )}
        <span className="absolute bottom-1 left-1 text-[10px] font-semibold uppercase tracking-wide text-red-700/80">
          Reserve {RESERVE_LITERS} L
        </span>
      </div>

      <div className="relative mt-1 h-7 border-t border-slate-200">
        {onRoute.map((s) => {
          const isRec = s.id === recommended?.id
          return (
            <span
              key={s.id}
              title={`${s.name} — km ${s.distanceKmFromStart}`}
              className={`absolute top-1 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full ${
                isRec ? 'bg-brand-800 text-white ring-2 ring-brand-200' : 'bg-slate-200 text-slate-600'
              }`}
              style={{ left: pct(s.distanceKmFromStart, distanceKm) }}
            >
              <Fuel className="h-3 w-3" strokeWidth={2.5} />
            </span>
          )
        })}
      </div>
      <div className="flex justify-between text-[11px] font-medium text-muted">
        <span>Start</span>
        <span>{formatKm(distanceKm)}</span>
      </div>

      <p className="mt-3 text-sm text-ink">
        {emptyKm != null ? (
          <>
            Tank runs dry around <strong className="text-red-700">{formatKm(emptyKm)}</strong>.{' '}
          </>
        ) : reserveKm != null ? (
          <>
            You dip into reserve around <strong className="text-amber-700">{formatKm(reserveKm)}</strong>.{' '}
          </>
        ) : (
          <>You stay above reserve the whole way.</>
        )}
        {recommended && (
          <>
            Refuel at <strong>{recommended.name}</strong> (km {recommended.distanceKmFromStart}).
          </>
        )}
        {refuelBy != null && !recommended && <>No station on the route before then — fill up before leaving.</>}
      </p>
    </div>
  )
}
