import { useRef, useState, type PointerEvent } from 'react'

type Point = { label: string; value: number }
type Format = (v: number) => string

const niceMax = (v: number) => {
  const p = 10 ** Math.floor(Math.log10(Math.max(v, 1)))
  return Math.ceil(v / p) * p
}

function Frame({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <figure className="panel p-5">
      <figcaption className="mb-5">
        <p className="text-sm font-semibold text-fg">{title}</p>
        {subtitle && <p className="unit mt-0.5">{subtitle}</p>}
      </figcaption>
      {children}
    </figure>
  )
}

function YAxis({ max, format }: { max: number; format: Format }) {
  return (
    <>
      {[0, 0.5, 1].map((f) => (
        <div key={f} className="absolute inset-x-0 border-t border-line" style={{ bottom: `${f * 100}%` }}>
          <span className="unit absolute -top-2 left-0 -translate-x-[calc(100%+8px)] whitespace-nowrap">{format(max * f)}</span>
        </div>
      ))}
    </>
  )
}

/** Single-series columns: ≤24px, rounded data-end, square at the baseline, tooltip on hover/tap. */
export function FuelBarChart({ data, title, subtitle, format = (v) => v.toFixed(1) }: { data: Point[]; title: string; subtitle?: string; format?: Format }) {
  const max = niceMax(Math.max(...data.map((d) => d.value), 1))
  const [hover, setHover] = useState<number | null>(null)
  return (
    <Frame title={title} subtitle={subtitle}>
      <div className="relative ml-10 h-40">
        <YAxis max={max} format={format} />
        <div className="absolute inset-0 flex items-end">
          {data.map((d, i) => (
            <div
              key={d.label}
              className="relative flex h-full flex-1 items-end justify-center"
              onPointerEnter={() => setHover(i)}
              onPointerDown={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
            >
              <div
                className={`w-full max-w-6 rounded-t-[4px] transition-colors ${hover === i ? 'bg-signal-hi' : 'bg-signal'}`}
                style={{ height: `${(d.value / max) * 100}%` }}
              />
              {hover === i && (
                <span className="absolute z-10 -translate-y-2 whitespace-nowrap rounded-xs border border-line-strong bg-bg px-2 py-1 text-xs text-fg" style={{ bottom: `${(d.value / max) * 100}%` }}>
                  day {d.label} · <strong>{format(d.value)}</strong>
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="ml-10 mt-2 flex">
        {data.map((d) => (
          <span key={d.label} className="unit flex-1 text-center">
            {d.label}
          </span>
        ))}
      </div>
    </Frame>
  )
}

/** Single-series line: 2px stroke, faint area wash, crosshair + tooltip following the pointer. */
export function FuelLineChart({ data, title, subtitle, format = (v) => v.toFixed(1) }: { data: Point[]; title: string; subtitle?: string; format?: Format }) {
  const max = niceMax(Math.max(...data.map((d) => d.value), 1))
  const box = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<number | null>(null)
  const xs = data.map((_, i) => (i / Math.max(data.length - 1, 1)) * 100)
  const ys = data.map((d) => 100 - (d.value / max) * 100)
  const line = xs.map((x, i) => `${x},${ys[i]}`).join(' ')

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const r = box.current?.getBoundingClientRect()
    if (!r) return
    const f = (e.clientX - r.left) / r.width
    setHover(Math.max(0, Math.min(data.length - 1, Math.round(f * (data.length - 1)))))
  }

  const last = data.length - 1
  return (
    <Frame title={title} subtitle={subtitle}>
      <div ref={box} className="relative ml-10 h-36 touch-none" onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHover(null)}>
        <YAxis max={max} format={format} />
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          <polygon points={`0,100 ${line} 100,100`} className="fill-signal/10" />
          <polyline points={line} fill="none" className="stroke-signal" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        {/* End label: the latest value, the one people look for */}
        <span className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal ring-2 ring-panel" style={{ left: `${xs[last]}%`, top: `${ys[last]}%` }} />
        {hover != null && (
          <div className="pointer-events-none absolute inset-y-0 w-px bg-fg/40" style={{ left: `${xs[hover]}%` }}>
            <span className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal ring-2 ring-panel" style={{ top: `${ys[hover]}%` }} />
            <span
              className={`absolute top-0 whitespace-nowrap rounded-xs border border-line-strong bg-bg px-2 py-1 text-xs text-fg ${
                xs[hover] > 70 ? '-translate-x-full' : xs[hover] < 30 ? '' : '-translate-x-1/2'
              }`}
            >
              day {data[hover].label} · <strong>{format(data[hover].value)}</strong>
            </span>
          </div>
        )}
      </div>
      <div className="ml-10 mt-2 flex justify-between">
        {data.map((d) => (
          <span key={d.label} className="unit">
            {d.label}
          </span>
        ))}
      </div>
    </Frame>
  )
}
