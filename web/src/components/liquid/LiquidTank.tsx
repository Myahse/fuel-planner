import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { colors, fuelPalettes } from '../../design/tokens'

export type FuelStatus = 'ok' | 'low' | 'out'

type Props = {
  /** Target fill, 0–1 of the tank. The liquid eases towards it. */
  level: number
  status?: FuelStatus
  /** Reserve as a fraction of the tank; drawn as a dashed line. */
  reserve?: number
  /** One tick per bar of the car's real gauge, on the right wall. */
  bars?: number
  /** Prints "RESERVE" beside the dashed line; off when text sits over the tank. */
  reserveLabel?: boolean
  /** Makes the tank draggable: the liquid follows the finger and reports the new level. */
  onLevelChange?: (level: number) => void
  className?: string
}

type Bubble = { x: number; y: number; r: number; v: number }

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const mixRgb = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t))
const css = ([r, g, b]: number[]) => `rgb(${r},${g},${b})`
const PALETTES = { ok: fuelPalettes.ok.map(hexToRgb), low: fuelPalettes.low.map(hexToRgb), out: fuelPalettes.out.map(hexToRgb) }

/**
 * The fuel tank seen from the side: glowing liquid with two wave layers, rising bubbles,
 * a dashed reserve line and the gauge's bar ticks. Rendering pauses off-screen and
 * holds still for people who prefer reduced motion.
 */
export function LiquidTank({ level, status = 'ok', reserve = 0.1, bars = 8, reserveLabel = false, onLevelChange, className = '' }: Props) {
  const wrap = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const target = useRef({ level, status, reserve, bars, reserveLabel })
  target.current = { level, status, reserve, bars, reserveLabel }
  const redraw = useRef<() => void>(() => {})

  useEffect(() => {
    const el = canvas.current
    const box = wrap.current
    if (!el || !box) return
    const ctx = el.getContext('2d')
    if (!ctx) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

    let w = 0
    let h = 0
    const fit = () => {
      const r = el.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = r.width
      h = r.height
      el.width = Math.round(w * dpr)
      el.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    fit()

    let shown = target.current.level
    let pal = PALETTES[target.current.status].map((c) => [...c])
    const bubbles: Bubble[] = Array.from({ length: 28 }, () => ({ x: Math.random(), y: Math.random(), r: 1 + Math.random() * 3, v: 0.15 + Math.random() * 0.35 }))
    let visible = true
    let raf = 0
    let last = performance.now()
    const t0 = last

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const t = (now - t0) / 1000
      const { level: goal, status, reserve, bars, reserveLabel } = target.current
      shown = reduce ? goal : shown + (goal - shown) * Math.min(1, dt * 2.4)
      const goalPal = PALETTES[status]
      pal = reduce ? goalPal.map((c) => [...c]) : pal.map((c, i) => mixRgb(c, goalPal[i], Math.min(1, dt * 3)))

      ctx.clearRect(0, 0, w, h)
      const surf = h * (1 - Math.max(0.015, Math.min(1, shown)))
      const amp = reduce ? 0 : 1

      for (let layer = 0; layer < 2; layer++) {
        ctx.beginPath()
        ctx.moveTo(0, h)
        for (let x = 0; x <= w + 6; x += 6) {
          const y =
            surf +
            amp * (Math.sin(x / (60 + layer * 28) + t * (1.5 - layer * 0.45)) * (7 - layer * 3) + Math.sin(x / 24 - t * 2.1) * 2.5) +
            layer * 8
          ctx.lineTo(x, y)
        }
        ctx.lineTo(w, h)
        ctx.closePath()
        const g = ctx.createLinearGradient(0, surf, 0, h)
        g.addColorStop(0, css(layer ? pal[1] : pal[0]))
        g.addColorStop(0.45, css(pal[1]))
        g.addColorStop(1, css(pal[2]))
        ctx.globalAlpha = layer ? 1 : 0.55
        ctx.fillStyle = g
        ctx.fill()
      }
      ctx.globalAlpha = 1

      // Light pooling just above the surface
      const glow = ctx.createLinearGradient(0, surf - 80, 0, surf + 24)
      glow.addColorStop(0, 'rgba(255,190,90,0)')
      glow.addColorStop(1, `rgba(${pal[0].join(',')},0.2)`)
      ctx.fillStyle = glow
      ctx.fillRect(0, surf - 80, w, 104)

      if (!reduce) {
        ctx.fillStyle = 'rgba(255,246,230,0.32)'
        for (const b of bubbles) {
          b.y -= b.v * dt * 0.35
          if (b.y < 0) {
            b.y = 1
            b.x = Math.random()
          }
          const by = surf + (h - surf) * b.y
          if (by > surf + 8) {
            ctx.beginPath()
            ctx.arc(b.x * w + Math.sin(t * 2 + b.x * 9) * 3, by, b.r, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }

      // Reserve line
      const ry = h * (1 - reserve)
      ctx.setLineDash([5, 6])
      ctx.strokeStyle = 'rgba(255,246,230,0.45)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, ry)
      ctx.lineTo(w, ry)
      ctx.stroke()
      ctx.setLineDash([])
      if (reserveLabel) {
        ctx.font = '500 10px "IBM Plex Mono", monospace'
        ctx.fillStyle = 'rgba(255,246,230,0.7)'
        ctx.textAlign = 'right'
        ctx.fillText('RESERVE', w - 22, ry - 6)
        ctx.textAlign = 'left'
      }

      // Gauge ticks on the right wall, one per bar
      ctx.fillStyle = colors.fg
      for (let k = 1; k < bars; k++) {
        const y = h * (1 - k / bars)
        ctx.globalAlpha = k / bars <= shown ? 0.55 : 0.22
        ctx.fillRect(w - (k % 2 === 0 ? 14 : 9), y, k % 2 === 0 ? 14 : 9, 1.5)
      }
      ctx.globalAlpha = 1
    }

    const tick = (now: number) => {
      if (visible) draw(now)
      raf = requestAnimationFrame(tick)
    }
    redraw.current = () => draw(performance.now())
    if (reduce) draw(performance.now())
    else raf = requestAnimationFrame(tick)

    const ro = new ResizeObserver(() => {
      fit()
      draw(performance.now())
    })
    ro.observe(el)
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(box)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
    }
  }, [])

  // With reduced motion there is no loop, so repaint when the target changes.
  useEffect(() => {
    redraw.current()
  }, [level, status, reserve, bars])

  const fromPointer = (e: ReactPointerEvent<HTMLDivElement>) => {
    const r = wrap.current?.getBoundingClientRect()
    if (!r || !onLevelChange) return
    onLevelChange(Math.min(1, Math.max(0, 1 - (e.clientY - r.top) / r.height)))
  }

  return (
    <div
      ref={wrap}
      className={`overflow-hidden ${/\b(absolute|fixed|relative)\b/.test(className) ? '' : 'relative'} ${onLevelChange ? 'cursor-ns-resize touch-none' : ''} ${className}`}
      onPointerDown={
        onLevelChange
          ? (e) => {
              e.currentTarget.setPointerCapture(e.pointerId)
              fromPointer(e)
            }
          : undefined
      }
      onPointerMove={onLevelChange ? (e) => e.buttons && fromPointer(e) : undefined}
    >
      <canvas ref={canvas} aria-hidden className="absolute inset-0 h-full w-full" />
    </div>
  )
}
