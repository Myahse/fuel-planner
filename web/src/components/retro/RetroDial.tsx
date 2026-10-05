import { motion } from 'framer-motion'
import { fuelStatusThresholds } from '../../design/tokens'

/**
 * Analogue fuel gauge in the style of a 70s dashboard: cream face, red reserve zone,
 * one tick per bar of the car's real gauge, needle at the current level.
 */
export function RetroDial({ percent, bars, size = 132 }: { percent: number; bars: number; size?: number }) {
  const p = Math.min(100, Math.max(0, percent)) / 100
  const cx = 60
  const cy = 62
  const r = 48
  const at = (f: number, rr = r) => {
    const a = Math.PI * (1 - f)
    return [cx + rr * Math.cos(a), cy - rr * Math.sin(a)] as const
  }
  const reserveEnd = at(fuelStatusThresholds.safeMinPercent / 100, r - 4)
  const deg = -90 + p * 180

  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 120 72" role="img" aria-label={`Fuel gauge at ${Math.round(percent)} percent`}>
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="#fff1d6" stroke="var(--color-espresso)" strokeWidth="3" />
      <path
        d={`M ${cx - r + 4} ${cy} A ${r - 4} ${r - 4} 0 0 1 ${reserveEnd[0]} ${reserveEnd[1]}`}
        fill="none"
        stroke="var(--color-signal)"
        strokeWidth="7"
      />
      {Array.from({ length: bars + 1 }).map((_, i) => {
        const major = i === 0 || i === bars || i * 2 === bars
        const [x1, y1] = at(i / bars, r - 3)
        const [x2, y2] = at(i / bars, r - (major ? 12 : 9))
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--color-espresso)" strokeWidth={major ? 2.5 : 1.6} strokeLinecap="round" />
      })}
      <text x={cx - r + 5} y={cy - 4} fontFamily="Bungee" fontSize="10" fill="var(--color-espresso)">E</text>
      <text x={cx + r - 12} y={cy - 4} fontFamily="Bungee" fontSize="10" fill="var(--color-espresso)">F</text>
      <motion.g
        style={{ transformBox: 'view-box', transformOrigin: `${cx}px ${cy}px` }}
        initial={{ rotate: -90 }}
        animate={{ rotate: deg }}
        transition={{ type: 'spring', stiffness: 60, damping: 12 }}
      >
        <line x1={cx} y1={cy} x2={cx} y2={cy - (r - 12)} stroke="var(--color-signal)" strokeWidth="4" strokeLinecap="round" />
      </motion.g>
      <circle cx={cx} cy={cy} r="7" fill="var(--color-espresso)" />
    </svg>
  )
}
