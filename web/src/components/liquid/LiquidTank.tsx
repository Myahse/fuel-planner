import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { colors, fuelPalettes } from '../../design/tokens'
import { liquidAccel, liquidRoll, onLiquidImpulse } from '../../lib/liquidMotion'
import { LiquidSurface, SURFACE_G, SURFACE_PX_PER_METRE } from '../../lib/liquidSurface'

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
const SHAKE = 0.45
const PALETTES = { ok: fuelPalettes.ok.map(hexToRgb), low: fuelPalettes.low.map(hexToRgb), out: fuelPalettes.out.map(hexToRgb) }

/**
 * The fuel tank seen from the side: glowing liquid, rising bubbles, a dashed reserve line
 * and the gauge's bar ticks. The surface is a small water simulation (LiquidSurface), so
 * tilting or moving the phone, dragging the window, scrolling or sweeping the mouse
 * through it all make it slosh the way fuel would. Rendering pauses off-screen and
 * holds still for people who prefer reduced motion.
 */
export function LiquidTank({ level, status = 'ok', reserve = 0.1, bars = 8, reserveLabel = false, onLevelChange, className = '' }: Props) {
  const wrap = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const target = useRef({ level, status, reserve, bars, reserveLabel })
  target.current = { level, status, reserve, bars, reserveLabel }
  const redraw = useRef<() => void>(() => {})
  const surface = useRef<LiquidSurface | null>(null)
  const pointer = useRef({ lastX: null as number | null, lastT: 0 })

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
      surface.current?.resize(w)
    }
    const sim = (surface.current = new LiquidSurface(Math.max(1, el.getBoundingClientRect().width)))
    fit()

    let shown = target.current.level
    let pal = PALETTES[target.current.status].map((c) => [...c])
    const bubbles: Bubble[] = Array.from({ length: 28 }, () => ({ x: Math.random(), y: Math.random(), r: 1 + Math.random() * 3, v: 0.15 + Math.random() * 0.35 }))
    const offImpulse = reduce ? () => {} : onLiquidImpulse((impulse) => sim.jolt(impulse * 420))

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

      if (!reduce) {
        // Gravity along a rolled phone pushes the fuel downhill; the tank's own sideways
        // acceleration pushes it the other way (it lags behind); up-down moves change its weight.
        // Shakes are scaled down: the phone is far smaller than the tank it stands for.
        const [ax, ay] = liquidAccel()
        sim.step(dt, h - surf, {
          push: SURFACE_G * Math.sin(liquidRoll()) - ax * SURFACE_PX_PER_METRE * SHAKE,
          heave: ay * SURFACE_PX_PER_METRE * SHAKE,
        })
      }
      // Screen y of the surface at x, kept inside the tank when it sloshes hard.
      const level = (x: number) => Math.max(0, Math.min(h, surf - sim.at(x)))

      // Back layer: the far side of the fuel, a touch higher and calmer, for depth.
      // Front layer: the simulated surface itself.
      for (let layer = 0; layer < 2; layer++) {
        ctx.beginPath()
        ctx.moveTo(0, h)
        for (let x = 0; x <= w + 4; x += 4) {
          const y = layer === 0 ? Math.max(0, surf - sim.at(x) * 0.75 - 7 + Math.sin(x / 70 + t * 0.6) * 1.5) : level(x)
          ctx.lineTo(Math.min(x, w), y)
        }
        ctx.lineTo(w, h)
        ctx.closePath()
        const g = ctx.createLinearGradient(0, surf - 20, 0, h)
        g.addColorStop(0, css(layer ? pal[0] : pal[1]))
        g.addColorStop(0.4, css(pal[1]))
        g.addColorStop(1, css(pal[2]))
        ctx.globalAlpha = layer ? 1 : 0.5
        ctx.fillStyle = g
        ctx.fill()
      }
      ctx.globalAlpha = 1

      // A thin bright line where light catches the surface.
      ctx.beginPath()
      for (let x = 0; x <= w + 4; x += 4) {
        const px = Math.min(x, w)
        if (x === 0) ctx.moveTo(px, level(px))
        else ctx.lineTo(px, level(px))
      }
      ctx.strokeStyle = `rgba(${pal[0].join(',')},0.9)`
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Light pooling just above the surface
      const lo = Math.min(level(0), level(w))
      const hi = Math.max(level(0), level(w))
      const glow = ctx.createLinearGradient(0, lo - 80, 0, hi + 24)
      glow.addColorStop(0, 'rgba(255,190,90,0)')
      glow.addColorStop(1, `rgba(${pal[0].join(',')},0.2)`)
      ctx.fillStyle = glow
      ctx.fillRect(0, lo - 80, w, hi - lo + 104)

      if (!reduce) {
        ctx.fillStyle = 'rgba(255,246,230,0.32)'
        for (const b of bubbles) {
          b.y -= b.v * dt * 0.35
          if (b.y < 0) {
            b.y = 1
            b.x = Math.random()
          }
          // Bubbles drift with the fuel as it sloshes.
          b.x = (((b.x + (sim.flowAt(b.x * w) * dt * 0.25) / w) % 1) + 1) % 1
          const bx = b.x * w
          const top = level(bx)
          const by = top + (h - top) * b.y
          if (by > top + 8) {
            ctx.beginPath()
            ctx.arc(bx + Math.sin(t * 2 + b.y * 9) * 2, by, b.r, 0, Math.PI * 2)
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
      offImpulse()
      surface.current = null
      ro.disconnect()
      io.disconnect()
    }
  }, [])

  // With reduced motion there is no loop, so repaint when the target changes.
  useEffect(() => {
    redraw.current()
  }, [level, status, reserve, bars])

  // The cursor moves through the fuel like a hand: it drags the liquid along and leaves a
  // wake; a click (or tap) drops into it.
  const stirAt = (e: ReactPointerEvent<HTMLDivElement>, drop = false) => {
    const r = wrap.current?.getBoundingClientRect()
    const sim = surface.current
    if (!r || !sim || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const x = e.clientX - r.left
    if (drop) {
      sim.drop(x, 18)
      return
    }
    // Only the part of the cursor that is in the fuel stirs it.
    const p = pointer.current
    const now = performance.now()
    const v = p.lastX == null ? 0 : ((x - p.lastX) / Math.max(8, now - p.lastT)) * 1000 // px/s
    p.lastX = x
    p.lastT = now
    const surfaceY = r.height * (1 - Math.max(0.015, Math.min(1, target.current.level))) - sim.at(x)
    if (e.clientY - r.top < surfaceY - 24) return
    sim.stir(x, Math.max(-1500, Math.min(1500, v)) * 0.05)
  }

  const fromPointer = (e: ReactPointerEvent<HTMLDivElement>) => {
    const r = wrap.current?.getBoundingClientRect()
    if (!r || !onLevelChange) return
    onLevelChange(Math.min(1, Math.max(0, 1 - (e.clientY - r.top) / r.height)))
  }

  return (
    <div
      ref={wrap}
      className={`overflow-hidden ${/\b(absolute|fixed|relative)\b/.test(className) ? '' : 'relative'} ${onLevelChange ? 'cursor-ns-resize touch-none' : ''} ${className}`}
      onPointerDown={(e) => {
        stirAt(e, true)
        if (!onLevelChange) return
        e.currentTarget.setPointerCapture(e.pointerId)
        fromPointer(e)
      }}
      onPointerMove={(e) => {
        if (e.pointerType === 'mouse') stirAt(e)
        if (onLevelChange && e.buttons) fromPointer(e)
      }}
      onPointerLeave={() => (pointer.current.lastX = null)}
    >
      <canvas ref={canvas} aria-hidden className="absolute inset-0 h-full w-full" />
    </div>
  )
}
