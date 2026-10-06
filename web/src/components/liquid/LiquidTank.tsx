import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { colors, fuelPalettes } from '../../design/tokens'
import { liquidAccel, liquidRoll, onLiquidImpulse } from '../../lib/liquidMotion'

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
/** A ring spreading from where the pointer touched the surface (x in px, born in s). */
type Ripple = { x: number; amp: number; born: number }

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const mixRgb = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t))
const css = ([r, g, b]: number[]) => `rgb(${r},${g},${b})`
const PALETTES = { ok: fuelPalettes.ok.map(hexToRgb), low: fuelPalettes.low.map(hexToRgb), out: fuelPalettes.out.map(hexToRgb) }

/**
 * The fuel tank seen from the side: glowing liquid with two wave layers, rising bubbles,
 * a dashed reserve line and the gauge's bar ticks. The surface stays level as the phone
 * rolls and sloshes on bumps or scrolling. Rendering pauses off-screen and holds still
 * for people who prefer reduced motion.
 */
export function LiquidTank({ level, status = 'ok', reserve = 0.1, bars = 8, reserveLabel = false, onLevelChange, className = '' }: Props) {
  const wrap = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const target = useRef({ level, status, reserve, bars, reserveLabel })
  target.current = { level, status, reserve, bars, reserveLabel }
  const redraw = useRef<() => void>(() => {})
  // Pointer stirring, read by the draw loop: a sideways shove and spreading ripples.
  const stir = useRef({ shove: 0, ripples: [] as Ripple[], lastX: null as number | null, lastT: 0, clock: 0 })

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
    // Two damped springs: the surface angle chases the phone's roll (and overshoots a
    // little, like real fuel), and a sloshing mode that jolts set swinging.
    let tilt = 0
    let tiltV = 0
    let slosh = 0
    let sloshV = 0
    const offImpulse = reduce
      ? () => {}
      : onLiquidImpulse((impulse) => {
          sloshV += impulse * 320
          tiltV += impulse * 1.2
        })

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

      if (!reduce) {
        // Moving the phone sideways pushes the fuel against the trailing wall (an
        // effective gravity tilted by atan(a / g)); up-down shakes set it sloshing.
        const [ax, ay] = liquidAccel()
        const target = Math.max(-0.9, Math.min(0.9, -liquidRoll() + (ax / 9.8) * 1.6))
        tiltV += (-40 * (tilt - target) - 3.5 * tiltV) * dt
        sloshV += ay * 40 * dt
        tiltV += stir.current.shove
        stir.current.shove = 0
        tilt += tiltV * dt
        sloshV += (-60 * slosh - 2.2 * sloshV) * dt
        slosh += sloshV * dt
      }

      ctx.clearRect(0, 0, w, h)
      const surf = h * (1 - Math.max(0.015, Math.min(1, shown)))
      const amp = reduce ? 0 : 1
      const slope = Math.tan(tilt)
      // Surface height at x, before the small travelling waves.
      stir.current.clock = t
      const ripples = (stir.current.ripples = stir.current.ripples.filter((r) => t - r.born < 1.6))
      const ripple = (x: number) => {
        let y = 0
        for (const r of ripples) {
          const age = t - r.born
          const spread = 90 * age
          const fade = r.amp * Math.exp(-age * 2.4) * Math.cos(age * 11)
          const g = (d: number) => Math.exp(-(d * d) / 900)
          y += fade * (g(x - r.x - spread) + g(x - r.x + spread))
        }
        return y
      }
      const level = (x: number) => surf + slope * (x - w / 2) + slosh * Math.cos((Math.PI * x) / w) + ripple(x)

      for (let layer = 0; layer < 2; layer++) {
        ctx.beginPath()
        ctx.moveTo(0, h)
        for (let x = 0; x <= w + 6; x += 6) {
          const y =
            level(x) +
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
          const bx = b.x * w
          const top = level(bx)
          const by = top + (h - top) * b.y
          if (by > top + 8) {
            ctx.beginPath()
            ctx.arc(bx + Math.sin(t * 2 + b.x * 9) * 3, by, b.r, 0, Math.PI * 2)
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
      ro.disconnect()
      io.disconnect()
    }
  }, [])

  // With reduced motion there is no loop, so repaint when the target changes.
  useEffect(() => {
    redraw.current()
  }, [level, status, reserve, bars])

  // Moving the mouse across the fuel stirs it: the faster the sweep, the bigger the wake.
  const stirAt = (e: ReactPointerEvent<HTMLDivElement>, drop = false) => {
    const r = wrap.current?.getBoundingClientRect()
    if (!r || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const st = stir.current
    const x = e.clientX - r.left
    const now = performance.now()
    const v = st.lastX == null ? 0 : (x - st.lastX) / Math.max(8, now - st.lastT) // px/ms
    st.lastX = x
    st.lastT = now
    // A hand dragged through liquid pushes it along: the side it moves towards rises.
    st.shove -= Math.max(-0.5, Math.min(0.5, v * 0.25))
    const last = st.ripples[st.ripples.length - 1]
    if (drop || ((!last || st.clock - last.born > 0.12) && Math.abs(v) > 0.25)) {
      st.ripples.push({ x, amp: drop ? 9 : Math.min(7, Math.abs(v) * 4), born: st.clock })
      if (st.ripples.length > 8) st.ripples.shift()
    }
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
      onPointerLeave={() => (stir.current.lastX = null)}
    >
      <canvas ref={canvas} aria-hidden className="absolute inset-0 h-full w-full" />
    </div>
  )
}
