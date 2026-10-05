import { motion } from 'framer-motion'
import { barsFilled } from '../lib/fuelMath'
import { fuelStatusThresholds } from '../design/tokens'

type Props = {
  percent: number
  /** How many bars the car's own gauge has — the display mirrors the real dashboard. */
  bars: number
  className?: string
}

/** The car's fuel gauge, redrawn: one segment per bar on the real dashboard, E and F at the ends. */
export function FuelSegments({ percent, bars, className = '' }: Props) {
  const filled = barsFilled(bars, percent)
  const low = percent < fuelStatusThresholds.safeMinPercent
  return (
    <div className={`flex items-center gap-2 ${className}`} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percent)} aria-label="Fuel level">
      <span className="unit">E</span>
      <div className="flex flex-1 gap-[3px]">
        {Array.from({ length: bars }).map((_, i) => (
          <motion.span
            key={i}
            className={`h-3 flex-1 rounded-[1px] ${i < filled ? (low ? 'bg-danger' : 'bg-signal') : 'bg-line-strong'}`}
            initial={{ opacity: 0, scaleY: 0.3 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ delay: i * 0.035, duration: 0.25 }}
          />
        ))}
      </div>
      <span className="unit">F</span>
    </div>
  )
}
