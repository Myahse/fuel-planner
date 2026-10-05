import { useId, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { colors, fuelPalettes } from '../../design/tokens'
import type { FuelStatus } from '../liquid/LiquidTank'

type Props = {
  /** Needle position, 0 (E) to 1 (F). */
  value: number
  /** Faint dashed needle, e.g. where the tank is now while the real needle shows arrival. */
  ghost?: number | null
  status?: FuelStatus
  /** Reserve as a fraction of the tank; painted red at the start of the dial. */
  reserve?: number
  /** One major tick per bar of the car's real gauge. */
  bars?: number
  /** Readout under the hub, where a dashboard puts the odometer. */
  children?: ReactNode
  /** Makes the needle draggable (and a keyboard slider) and reports the new level. */
  onChange?: (value: number) => void
  label: string
  /** Side-by-side gauges: shorter dial, no E/½/F letters, one-line readout. */
  compact?: boolean
  className?: string
}

// 240° dial: E at the lower left (150°), F at the lower right (30°), clockwise through the top.
const CX = 130
const CY = 130
const R = 104
const A0 = 150
const SWEEP = 240

const clamp = (v: number) => Math.min(1, Math.max(0, v))
const pt = (f: number, r: number) => {
  const a = ((A0 + SWEEP * f) * Math.PI) / 180
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)] as const
}
const arc = (f0: number, f1: number, r: number) => {
  const [x0, y0] = pt(f0, r)
  const [x1, y1] = pt(f1, r)
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${SWEEP * (f1 - f0) > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`
}
/** Rotation for a needle drawn pointing straight up. */
const rot = (f: number) => A0 + SWEEP * clamp(f) + 90

/**
 * The car's fuel gauge as a clock-style dial. The needle answers "how much" at a glance;
 * the liquid tank next to it shows the same level as fuel.
 */
export function FuelGauge({ value, ghost = null, status = 'ok', reserve = 0.1, bars = 8, children, onChange, label, compact, className = '' }: Props) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const svg = useRef<SVGSVGElement>(null)
  const [dragging, setDragging] = useState(false)
  const v = clamp(value)
  const pal = fuelPalettes[status]
  const height = compact ? 204 : 252

  const ticks = []
  for (let i = 0; i <= bars * 2; i++) {
    const f = i / (bars * 2)
    const major = i % 2 === 0
    const [x0, y0] = pt(f, R - 2)
    const [x1, y1] = pt(f, R - (major ? 18 : 10))
    ticks.push(
      <line
        key={i}
        x1={x0} y1={y0} x2={x1} y2={y1}
        stroke={colors.fg}
        strokeOpacity={major ? 0.85 : 0.35}
        strokeWidth={major ? 3 : 1.6}
        strokeLinecap="round"
      />,
    )
  }
  const [ex, ey] = pt(0, R - 34)
  const [hx, hy] = pt(0.5, R - 34)
  const [fx, fy] = pt(1, R - 34)

  const fromPointer = (e: PointerEvent<SVGSVGElement>) => {
    const r = svg.current?.getBoundingClientRect()
    if (!r || !onChange) return
    const scale = r.width / 260
    const deg = (Math.atan2(e.clientY - r.top - CY * scale, e.clientX - r.left - CX * scale) * 180) / Math.PI
    const a = (((deg - A0) % 360) + 360) % 360
    // Past F or before E: snap to whichever end is closer.
    onChange(a <= SWEEP ? a / SWEEP : a < SWEEP + (360 - SWEEP) / 2 ? 1 : 0)
  }

  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (!onChange) return
    const step = e.shiftKey ? 0.1 : 0.01
    const next =
      e.key === 'ArrowRight' || e.key === 'ArrowUp' ? v + step
      : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? v - step
      : e.key === 'Home' ? 0
      : e.key === 'End' ? 1
      : null
    if (next == null) return
    e.preventDefault()
    onChange(clamp(next))
  }

  const needleStyle = { transformOrigin: `${CX}px ${CY}px`, transition: dragging ? 'none' : undefined }

  return (
    <div className={`relative ${className}`}>
      <svg
        ref={svg}
        viewBox={`0 0 260 ${height}`}
        className={`block h-auto w-full select-none ${onChange ? 'cursor-grab touch-none active:cursor-grabbing' : ''}`}
        role={onChange ? 'slider' : 'img'}
        aria-label={label}
        aria-valuemin={onChange ? 0 : undefined}
        aria-valuemax={onChange ? 100 : undefined}
        aria-valuenow={onChange ? Math.round(v * 100) : undefined}
        tabIndex={onChange ? 0 : undefined}
        onKeyDown={onKey}
        onPointerDown={
          onChange
            ? (e) => {
                e.currentTarget.setPointerCapture(e.pointerId)
                setDragging(true)
                fromPointer(e)
              }
            : undefined
        }
        onPointerMove={onChange ? (e) => dragging && fromPointer(e) : undefined}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
      >
        <defs>
          <radialGradient id={`${id}-face`} cx="50%" cy="45%" r="60%">
            <stop offset="0" stopColor="#2a2016" />
            <stop offset="1" stopColor="#120d08" />
          </radialGradient>
          <linearGradient id={`${id}-arc`} x1="0" x2="1">
            <stop offset="0" stopColor={pal[2]} />
            <stop offset=".6" stopColor={pal[1]} />
            <stop offset="1" stopColor={pal[0]} />
          </linearGradient>
          <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>

        <circle cx={CX} cy={CY} r={R + 14} fill={`url(#${id}-face)`} stroke={colors.lineStrong} strokeWidth="2" />
        <path d={arc(0, 1, R + 4)} fill="none" stroke={colors.fg} strokeOpacity="0.08" strokeWidth="6" strokeLinecap="round" />
        <path d={arc(0, clamp(reserve), R + 4)} fill="none" stroke={colors.danger} strokeWidth="6" strokeLinecap="round" />
        <path
          d={arc(0, 1, R + 4)}
          pathLength={100}
          strokeDasharray={`${Math.max(0.2, v * 100)} 200`}
          fill="none"
          stroke={`url(#${id}-arc)`}
          strokeWidth="6"
          strokeLinecap="round"
          className={dragging ? '' : 'gauge-arc'}
        />
        {ticks}
        {/* Compact dials give the letters' room to the readout. */}
        {!compact && (
          <>
            <text x={ex} y={ey + 5} textAnchor="middle" className="gauge-letter" fill={colors.fg}>E</text>
            <text x={hx} y={hy + 5} textAnchor="middle" className="gauge-letter" fontSize="12" fill={colors.fg3}>½</text>
            <text x={fx} y={fy + 5} textAnchor="middle" className="gauge-letter" fill={colors.fg}>F</text>
          </>
        )}

        <g className="gauge-needle" style={{ ...needleStyle, transform: `rotate(${rot(ghost ?? v)}deg)`, opacity: ghost == null ? 0 : 0.4 }}>
          <line x1={CX} y1={CY} x2={CX} y2={CY - R + 22} stroke={colors.fg} strokeWidth="3" strokeLinecap="round" strokeDasharray="4 5" />
        </g>
        <g className="gauge-needle" style={{ ...needleStyle, transform: `rotate(${rot(v)}deg)` }}>
          <line x1={CX} y1={CY + 14} x2={CX} y2={CY - R + 16} stroke={pal[1]} strokeWidth="7" strokeLinecap="round" filter={`url(#${id}-glow)`} opacity="0.7" />
          <line x1={CX} y1={CY + 14} x2={CX} y2={CY - R + 16} stroke={colors.fg} strokeWidth="4" strokeLinecap="round" />
        </g>
        <circle cx={CX} cy={CY} r="11" fill={colors.fg} />
        <circle cx={CX} cy={CY} r="5" fill={pal[1]} />
      </svg>
      {children && (
        <div className="pointer-events-none absolute inset-x-0 text-center" style={{ top: `${((CY + 26) / height) * 100}%` }}>
          {children}
        </div>
      )}
    </div>
  )
}
