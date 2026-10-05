import { useId, useRef, useState, type PointerEvent } from 'react'
import type { FuelStation } from '../data/mockStations'
import { RESERVE_LITERS, kmWhenFuelReaches, type VehicleFuelProfile } from '../lib/tripAssessment'
import { fuelRequiredLiters } from '../lib/fuelMath'
import { formatKm } from '../lib/format'

type Props = {
  distanceKm: number
  profile: VehicleFuelProfile
  stations?: FuelStation[]
}

const pct = (v: number, max: number) => `${Math.min(100, Math.max(0, (v / max) * 100))}%`
/** Keep a label anchored at fraction `f` of the width from spilling past either edge. */
const edgeAlign = (f: number) => (f < 0.12 ? '' : f > 0.88 ? '-translate-x-full' : '-translate-x-1/2')

/**
 * Litres in the tank along the route, scaled to this vehicle's own tank and consumption,
 * so a bigger tank or thirstier engine visibly changes the slope, the reserve line and the refuel stop.
 */
export function FuelRouteBar({ distanceKm, profile, stations = [] }: Props) {
  const clipId = `fuel-clip-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const plot = useRef<HTMLDivElement>(null)
  const [hoverKm, setHoverKm] = useState<number | null>(null)

  const { startingLiters, tankLiters } = profile
  const litersAt = (km: number) => startingLiters - fuelRequiredLiters(km, profile.consumption)
  const endLiters = litersAt(distanceKm)
  const reserveKm = kmWhenFuelReaches(RESERVE_LITERS, distanceKm, profile)
  const emptyKm = kmWhenFuelReaches(0, distanceKm, profile)

  const onRoute = stations.filter((s) => s.distanceKmFromStart > 0 && s.distanceKmFromStart < distanceKm)
  const refuelBy = reserveKm ?? emptyKm
  const recommended = refuelBy != null ? [...onRoute].reverse().find((s) => s.distanceKmFromStart <= refuelBy) : undefined

  // Chart space: x = km (0..distance), y = litres (0..tank), flipped for SVG.
  const y = (l: number) => 100 - (Math.max(0, l) / tankLiters) * 100
  const x = (km: number) => (km / distanceKm) * 100
  const lineEndKm = emptyKm ?? distanceKm
  const reserveTop = y(RESERVE_LITERS)

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const r = plot.current?.getBoundingClientRect()
    if (!r) return
    setHoverKm(Math.min(distanceKm, Math.max(0, ((e.clientX - r.left) / r.width) * distanceKm)))
  }

  const status = emptyKm != null ? 'danger' : reserveKm != null ? 'warn' : 'ok'

  return (
    <figure className="panel p-5">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-fg">Litres in the tank, km by km</span>
        <span className="unit">{tankLiters.toFixed(0)} L tank</span>
      </figcaption>

      <div
        ref={plot}
        className="relative mt-6 h-40 touch-none"
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHoverKm(null)}
      >
        {/* Recessive gridlines at ¼ tank steps */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <div key={f} className="absolute inset-x-0 border-t border-line" style={{ top: pct(tankLiters * (1 - f), tankLiters) }} />
        ))}

        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          <defs>
            <clipPath id={clipId}>
              <rect x="0" y="0" width="100" height={reserveTop} />
            </clipPath>
          </defs>
          <rect x="0" y={reserveTop} width="100" height={100 - reserveTop} className="fill-danger/10" />
          <polygon
            points={`0,100 0,${y(startingLiters)} ${x(lineEndKm)},${y(endLiters)} ${x(lineEndKm)},100`}
            className="fill-signal/10"
            clipPath={`url(#${clipId})`}
          />
          <line
            x1="0" y1={y(startingLiters)} x2={x(lineEndKm)} y2={y(endLiters)}
            className="stroke-signal" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke"
          />
          {emptyKm != null && (
            <line x1={x(emptyKm)} y1="100" x2="100" y2="100" className="stroke-danger" strokeWidth="3" vectorEffect="non-scaling-stroke" />
          )}
        </svg>

        <span className="unit absolute right-0 -translate-y-full pb-1" style={{ top: pct(tankLiters - RESERVE_LITERS, tankLiters) }}>
          reserve {RESERVE_LITERS} L
        </span>

        {/* Start and end readings, labelled sparingly */}
        <span className="readout absolute left-0 -translate-y-full pb-1.5 text-lg text-fg" style={{ top: pct(tankLiters - startingLiters, tankLiters) }}>
          {startingLiters.toFixed(1)}<span className="unit ml-0.5">L</span>
        </span>
        {emptyKm == null && (
          <span className="readout absolute right-0 -translate-y-full pb-1.5 text-lg text-fg" style={{ top: pct(tankLiters - Math.max(endLiters, 0), tankLiters) }}>
            {endLiters.toFixed(1)}<span className="unit ml-0.5">L</span>
          </span>
        )}

        {refuelBy != null && (
          <div className="absolute inset-y-0 w-px bg-fg-3" style={{ left: pct(refuelBy, distanceKm) }}>
            <span className={`unit absolute -top-5 whitespace-nowrap text-fg-2 ${edgeAlign(refuelBy / distanceKm)}`}>
              {emptyKm != null ? 'empty' : 'reserve'} · km {Math.round(refuelBy)}
            </span>
          </div>
        )}

        {hoverKm != null && (
          <div className="pointer-events-none absolute inset-y-0 w-px bg-fg/50" style={{ left: pct(hoverKm, distanceKm) }}>
            <span
              className="absolute h-2.5 w-2.5 -translate-x-1/2 translate-y-[-50%] rounded-full bg-signal ring-2 ring-panel"
              style={{ top: pct(tankLiters - Math.max(0, litersAt(hoverKm)), tankLiters) }}
            />
            <span className={`absolute top-0 whitespace-nowrap rounded-xs border border-line-strong bg-bg px-2 py-1 text-xs text-fg ${edgeAlign(hoverKm / distanceKm)}`}>
              km {Math.round(hoverKm)} · <strong>{Math.max(0, litersAt(hoverKm)).toFixed(1)} L</strong> left
            </span>
          </div>
        )}
      </div>

      {/* Odometer track with the stations on the route */}
      <div className="relative mt-3 h-6 border-t border-line-strong">
        {Array.from({ length: 11 }).map((_, i) => (
          <span key={i} className="absolute top-0 h-1.5 w-px bg-line-strong" style={{ left: `${i * 10}%` }} />
        ))}
        {onRoute.map((s) => {
          const isRec = s.id === recommended?.id
          return (
            <span
              key={s.id}
              title={`${s.name} — km ${s.distanceKmFromStart}`}
              className={`absolute top-1.5 h-3 w-3 -translate-x-1/2 rotate-45 ${isRec ? 'bg-ok' : 'border border-fg-3 bg-bg'}`}
              style={{ left: pct(s.distanceKmFromStart, distanceKm) }}
            />
          )
        })}
      </div>
      <div className="unit flex justify-between">
        <span>0 km</span>
        <span>{formatKm(distanceKm)}</span>
      </div>

      <p className="mt-4 flex items-start gap-2.5 border-t border-line pt-4 text-sm leading-relaxed text-fg-2">
        <span className={`lamp mt-1.5 shrink-0 ${status === 'danger' ? 'text-danger' : status === 'warn' ? 'text-warn' : 'text-ok'}`} aria-hidden />
        <span>
          {emptyKm != null ? (
            <>Tank runs dry around <strong className="text-fg">km {Math.round(emptyKm)}</strong>. </>
          ) : reserveKm != null ? (
            <>You reach the reserve around <strong className="text-fg">km {Math.round(reserveKm)}</strong>. </>
          ) : (
            <>You stay above the reserve the whole way. </>
          )}
          {recommended && (
            <>
              Refuel at <strong className="text-fg">{recommended.name}</strong>, km {recommended.distanceKmFromStart}{' '}
              <span className="inline-block h-2 w-2 rotate-45 bg-ok align-middle" aria-hidden />.
            </>
          )}
          {refuelBy != null && !recommended && <>No station on the route before then. Fill up before you leave.</>}
        </span>
      </p>
    </figure>
  )
}
