import type { VehicleBodyType } from '../../config/vehicleModels'

/** Side-profile outlines on a 120×48 canvas. Flat SVG, so lists never spin up a WebGL context. */
const SHAPES: Record<VehicleBodyType, { body: string; glass: string; wheels: [number, number]; r: number }> = {
  sedan: {
    body: 'M6 36 L6 29 Q7 25 16 24 L33 22 L45 13 Q49 10 56 10 L76 10 Q82 10 87 14 L97 22 L110 24 Q116 25 116 30 L116 36 Z',
    glass: 'M38 22 L48 14 Q51 12 56 12 L65 12 L65 22 Z M68 12 L76 12 Q80 12 84 15 L92 22 L68 22 Z',
    wheels: [28, 94],
    r: 7,
  },
  hatchback: {
    body: 'M10 36 L10 28 Q11 24 20 23 L35 21 L47 11 Q50 9 56 9 L92 9 Q98 9 100 14 L104 24 Q106 27 106 31 L106 36 Z',
    glass: 'M40 21 L50 12 Q52 11 56 11 L68 11 L68 21 Z M71 11 L92 11 Q96 11 97 14 L100 21 L71 21 Z',
    wheels: [30, 88],
    r: 7,
  },
  suv: {
    body: 'M6 37 L6 26 Q7 22 16 21 L29 20 L39 8 Q41 6 48 6 L104 6 Q110 6 111 10 L114 22 Q116 24 116 28 L116 37 Z',
    glass: 'M33 20 L42 9 Q43 8 48 8 L66 8 L66 20 Z M69 8 L90 8 L90 20 L69 20 Z M93 8 L104 8 Q108 8 109 11 L111 20 L93 20 Z',
    wheels: [28, 96],
    r: 8,
  },
}

type Props = {
  bodyType: VehicleBodyType
  paint: string
  className?: string
  title?: string
}

export function VehicleSilhouette({ bodyType, paint, className = '', title }: Props) {
  const s = SHAPES[bodyType]
  return (
    <svg viewBox="0 0 120 48" className={className} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <ellipse cx="61" cy="44" rx="54" ry="2.5" fill="currentColor" opacity="0.12" />
      <path d={s.body} fill={paint} stroke="rgba(15,23,42,0.35)" strokeWidth="1" strokeLinejoin="round" />
      <path d={s.glass} fill="#1e293b" opacity="0.8" />
      {s.wheels.map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={37} r={s.r} fill="#111827" />
          <circle cx={cx} cy={37} r={s.r * 0.5} fill="#cbd5e1" />
        </g>
      ))}
    </svg>
  )
}
