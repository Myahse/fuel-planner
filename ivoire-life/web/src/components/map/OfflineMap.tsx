import { useEffect, useMemo, useRef, useState } from 'react'
import civ from '../../assets/civ.geo.json'
import type { Sim } from '../../lib/types'
import { CIV_BOUNDS, Pin, type Bounds, type PinData } from './pins'

// A stylised stand-in for Mapbox when no VITE_MAPBOX_TOKEN is set, so the
// game is playable (and demoable) offline. Same pins, same camera moves.

const K = 100 // world pixels per degree
const toWorld = (lng: number, lat: number) => [(lng - CIV_BOUNDS[0]) * K, (CIV_BOUNDS[3] - lat) * K] as const

const PATH = (civ.features[0].geometry.coordinates as number[][][][])
  .map((poly) => poly[0].map(([lng, lat], i) => `${i ? 'L' : 'M'}${toWorld(lng, lat).join(' ')}`).join('') + 'Z')
  .join('')

type Props = { pins: PinData[]; bounds: Bounds; night: boolean; sim: Sim | null }

export function OfflineMap({ pins, bounds, night, sim }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 1200, h: 800 })

  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(ref.current!)
    return () => ro.disconnect()
  }, [])

  // Fit the bounds inside the viewport, leaving room for the HUD.
  const view = useMemo(() => {
    const pad = { top: 110, bottom: 200, left: 40, right: 40 }
    const [x0, y0] = toWorld(bounds[0], bounds[3])
    const [x1, y1] = toWorld(bounds[2], bounds[1])
    const w = Math.max(size.w - pad.left - pad.right, 100)
    const h = Math.max(size.h - pad.top - pad.bottom, 100)
    const s = Math.min(w / (x1 - x0), h / (y1 - y0))
    return { s, tx: pad.left + (w - (x1 - x0) * s) / 2 - x0 * s, ty: pad.top + (h - (y1 - y0) * s) / 2 - y0 * s }
  }, [bounds, size])

  const sea = night ? '#06202b' : '#1b8fb0'
  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden transition-colors duration-1000" style={{ background: `radial-gradient(ellipse at 40% 30%, ${night ? '#0b3a4a' : '#43b8d6'}, ${sea})` }}>
      <svg className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="land" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={night ? '#3d3a22' : '#d4b06a'} />
            <stop offset="0.35" stopColor={night ? '#2a4a2c' : '#9cc45a'} />
            <stop offset="1" stopColor={night ? '#173d2a' : '#4fa04a'} />
          </linearGradient>
        </defs>
        {/* CSS transform on the group so strokes can stay screen-sized. */}
        <g style={{ transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.s})`, transition: 'transform 900ms cubic-bezier(0.4, 0, 0.2, 1)' }}>
          <path d={PATH} fill="url(#land)" />
          <path d={PATH} fill="none" stroke="#f7e3b0" strokeOpacity="0.5" strokeWidth="14" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          <path d={PATH} fill="none" stroke="#f77f00" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        </g>
      </svg>

      {/* Screen-space wax texture so it keeps its size at every zoom. */}
      <div className="bg-wax pointer-events-none absolute inset-0 opacity-30 mix-blend-soft-light" />

      {night && <div className="pointer-events-none absolute inset-0 bg-[#0a1440]/30 mix-blend-multiply" />}

      {pins.map((p) => {
        const [x, y] = toWorld(p.lng, p.lat)
        return (
          <div key={p.id} className="pin-abs" style={{ left: x * view.s + view.tx, top: y * view.s + view.ty, zIndex: p.variant === 'sim' ? 5 : p.lift ? 1 : 2 }}>
            <Pin pin={p} sim={sim} />
          </div>
        )
      })}

      <div className="pointer-events-none absolute right-3 bottom-2 rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-bold text-white/70">
        Carte hors-ligne · ajoute VITE_MAPBOX_TOKEN pour Mapbox
      </div>
    </div>
  )
}
