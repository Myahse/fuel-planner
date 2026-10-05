import { motion } from 'framer-motion'
import { barsFilled, litersFromPercent, percentFromBarIndex, estimatedRangeKm } from '../lib/fuelMath'
import { formatKm, formatLiters } from '../lib/format'

type FuelGaugeProps = {
  bars?: number
  percentage: number
  tankCapacityLiters: number
  consumptionLPer100Km?: number
  onChange: (percentage: number) => void
  showRange?: boolean
  compact?: boolean
}

export function FuelGauge({
  bars = 10,
  percentage,
  tankCapacityLiters,
  consumptionLPer100Km = 7.5,
  onChange,
  showRange = true,
  compact = false,
}: FuelGaugeProps) {
  const filled = barsFilled(bars, percentage)
  const liters = litersFromPercent(tankCapacityLiters, percentage)
  const range = estimatedRangeKm(liters, consumptionLPer100Km)

  return (
    <div className={compact ? 'space-y-4' : 'space-y-6'}>
      <div className="relative mx-auto max-w-md">
        <div className="flex items-end justify-between px-2 text-xs font-semibold text-muted">
          <span>E</span>
          <span className="text-sm font-medium text-ink">Fuel gauge</span>
          <span>F</span>
        </div>
        <div
          className="mt-2 rounded-t-[999px] border border-slate-200/80 bg-gradient-to-b from-white to-slate-50 px-4 pb-4 pt-6 shadow-inner"
          aria-hidden
        >
          <div className="flex justify-center gap-1 sm:gap-1.5" role="group" aria-label="Fuel level bars">
            {Array.from({ length: bars }).map((_, i) => {
              const active = i < filled
              return (
                <motion.button
                  key={i}
                  type="button"
                  onClick={() => onChange(percentFromBarIndex(bars, i))}
                  whileTap={{ scale: 0.95 }}
                  className={`w-5 rounded-md sm:w-6 ${compact ? 'h-10' : 'h-14'} ${
                    active ? 'bg-brand-600 shadow-sm' : 'bg-slate-200'
                  }`}
                  aria-label={`${i + 1} of ${bars} bars`}
                  layout
                />
              )
            })}
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-lg font-semibold text-brand-800">
          {filled} bars <span className="text-muted font-normal">≈ {Math.round(percentage)}%</span>
        </p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-ink">{formatLiters(liters)}</p>
        <p className="text-sm text-muted">of {formatLiters(tankCapacityLiters, 0)}</p>
        {showRange && (
          <p className="mt-3 text-sm text-muted">
            Estimated range{' '}
            <span className="font-semibold text-brand-800">{formatKm(range)}</span>
          </p>
        )}
      </div>

      <div>
        <p className="mb-2 text-center text-xs text-muted">Tap the bars or use the slider</p>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={percentage}
          onChange={(e) => onChange(Number(e.target.value))}
          className="fuel-slider w-full"
          style={{ ['--pct' as string]: `${percentage}%` }}
          aria-label="Fuel level slider"
        />
        <div className="mt-1 flex justify-between text-xs text-muted">
          <span>Empty (0%)</span>
          <span>Full (100%)</span>
        </div>
      </div>
    </div>
  )
}
