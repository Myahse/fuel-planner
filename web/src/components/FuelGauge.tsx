import { motion } from 'framer-motion'
import { barsFilled, litersFromPercent, percentFromBarIndex, estimatedRangeKm } from '../lib/fuelMath'
import { fuelStatusThresholds } from '../design/tokens'

type FuelGaugeProps = {
  bars?: number
  percentage: number
  tankCapacityLiters: number
  consumptionLPer100Km?: number
  onChange: (percentage: number) => void
  showRange?: boolean
  compact?: boolean
}

/** Match-your-dashboard input: tap the bar your car shows, fine-tune with the slider. */
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
  const low = percentage < fuelStatusThresholds.safeMinPercent

  return (
    <div className={compact ? 'space-y-5' : 'space-y-8'}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="readout text-[4.5rem] text-fg">
            {liters.toFixed(1)}
            <span className="unit ml-1.5 text-sm">L</span>
          </p>
          <p className="unit mt-2">
            of {tankCapacityLiters.toFixed(0)} L · {filled}/{bars} bars · {Math.round(percentage)}%
          </p>
        </div>
        {showRange && (
          <div className="pb-1 text-right">
            <p className="readout text-3xl text-fg">
              {Math.round(range)}
              <span className="unit ml-1">km</span>
            </p>
            <p className="unit mt-1">range</p>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-end gap-1.5" role="group" aria-label="Tap the bar your car shows">
          <span className="unit mr-1 self-end">E</span>
          {Array.from({ length: bars }).map((_, i) => {
            const active = i < filled
            return (
              <motion.button
                key={i}
                type="button"
                onClick={() => onChange(percentFromBarIndex(bars, i))}
                whileTap={{ scaleY: 0.92 }}
                className={`flex-1 rounded-[2px] transition-colors ${compact ? 'h-10' : 'h-16'} ${
                  active ? (low ? 'bg-danger' : 'bg-signal') : 'bg-panel-3 hover:bg-line-strong'
                }`}
                style={{ transformOrigin: 'bottom' }}
                aria-label={`${i + 1} of ${bars} bars`}
                aria-pressed={active}
              />
            )
          })}
          <span className="unit ml-1 self-end">F</span>
        </div>
      </div>

      <div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={percentage}
          onChange={(e) => onChange(Number(e.target.value))}
          className="fuel-slider w-full"
          style={{ ['--pct' as string]: `${percentage}%` }}
          aria-label="Fine-tune fuel level"
        />
        <p className="mt-2 text-xs text-fg-3">Tap the bar your dashboard shows, then fine-tune with the slider.</p>
      </div>
    </div>
  )
}
