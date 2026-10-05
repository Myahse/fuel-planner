import { CAR_PROFILES, GROUND_Y } from '../car3d/carProfiles'
import type { VehicleBodyType } from '../../config/vehicleModels'
import { LiquidTank, type FuelStatus } from './LiquidTank'

type Props = {
  bodyType: VehicleBodyType
  paint: string
  /** Fill, 0–1 of the tank, drawn from the sills to the roof. */
  level: number
  status?: FuelStatus
  className?: string
}

const VIEW_H = 48

/** Top and bottom of a body path (coordinates come in x,y pairs). */
function bodyBounds(d: string) {
  const ys = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number).filter((_, i) => i % 2 === 1)
  return { top: Math.min(...ys), bottom: Math.max(...ys) }
}

/** The car's side profile filled with fuel up to its real level, outlined in its paint. */
export function CarTank({ bodyType, paint, level, status, className = '' }: Props) {
  const p = CAR_PROFILES[bodyType]
  const { top, bottom } = bodyBounds(p.body)
  // Map the tank level onto the body's height inside the 48-unit-tall box.
  const surfaceY = bottom - (bottom - top) * Math.min(1, Math.max(0, level))
  const boxLevel = (VIEW_H - surfaceY) / VIEW_H
  const mask = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 48'><path d='${p.body}'/></svg>`)}")`

  return (
    <div className={`relative aspect-[120/48] w-full ${className}`}>
      <div className="absolute inset-0" style={{ maskImage: mask, WebkitMaskImage: mask, maskSize: '100% 100%', WebkitMaskSize: '100% 100%' }}>
        <LiquidTank level={boxLevel} status={status} reserve={0} bars={1} className="absolute inset-0 bg-panel-3" />
      </div>
      <svg viewBox="0 0 120 48" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        <line x1="0" x2="120" y1={GROUND_Y + 0.5} y2={GROUND_Y + 0.5} stroke="currentColor" strokeOpacity="0.15" />
        {/* A faint cream halo keeps dark paints visible on the dark ground. */}
        <path d={p.body} fill="none" stroke="#fff6e6" strokeOpacity="0.22" strokeWidth="2.6" strokeLinejoin="round" />
        <path d={p.body} fill="none" stroke={paint} strokeWidth="1.4" strokeLinejoin="round" />
        <path d={p.glass} fill="#0a0806" fillOpacity="0.82" stroke={paint} strokeOpacity="0.6" strokeWidth="0.6" />
        {p.wheels.map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy={GROUND_Y - p.r} r={p.r} fill="#0a0806" stroke={paint} strokeWidth="1.2" />
            <circle cx={cx} cy={GROUND_Y - p.r} r={p.r * 0.45} fill="#9a8b78" />
          </g>
        ))}
      </svg>
    </div>
  )
}
