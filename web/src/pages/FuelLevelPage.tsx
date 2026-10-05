import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { getFuelCurrent, updateFuelCurrent } from '../api/endpoints'
import { useActiveVehicle } from '../hooks/useActiveVehicle'
import { ArrowLeft } from 'lucide-react'
import { LiquidTank } from '../components/liquid/LiquidTank'
import { AnimatedNumber } from '../components/liquid/AnimatedNumber'
import { barsFilled, estimatedRangeKm, litersFromPercent, percentFromBarIndex } from '../lib/fuelMath'
import { RESERVE_LITERS } from '../lib/tripAssessment'
import { PrimaryButton } from '../components/buttons/PrimaryButton'
import { InfoNote } from '../components/ui'
import { useState } from 'react'

export function FuelLevelPage({ mode = 'onboarding' }: { mode?: 'onboarding' | 'edit' }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { vehicle } = useActiveVehicle()

  const fuelQuery = useQuery({
    queryKey: ['fuel-current', vehicle?.id],
    queryFn: () => getFuelCurrent(vehicle!.id),
    enabled: Boolean(vehicle?.id),
  })

  const [pct, setPct] = useState<number | null>(null)
  const previous = Math.round(fuelQuery.data?.fuel_percentage ?? vehicle?.fuel_percentage ?? 60)
  const displayPct = pct ?? previous

  const saveMutation = useMutation({
    mutationFn: () => updateFuelCurrent(vehicle!.id, displayPct),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fuel-current'] })
      qc.invalidateQueries({ queryKey: ['vehicles'] })
      navigate(mode === 'edit' ? '/app' : '/app')
    },
  })

  if (!vehicle) {
    return <InfoNote>Add a vehicle first.</InfoNote>
  }

  const delta = displayPct - previous
  const bars = vehicle.fuel_gauge_bars
  const liters = litersFromPercent(vehicle.tank_capacity_liters, displayPct)
  const range = estimatedRangeKm(liters, vehicle.mixed_consumption)
  const filled = barsFilled(bars, displayPct)

  return (
    <div className="space-y-5">
      <section
        aria-label="Drag the fuel to match your gauge"
        className="relative -mx-4 -mt-4 h-[min(70svh,600px)] min-h-[480px] overflow-hidden sm:mx-0 sm:mt-0 sm:rounded-[32px] sm:border sm:border-fg/10"
      >
        <LiquidTank
          level={displayPct / 100}
          status={displayPct < 20 ? 'low' : 'ok'}
          reserve={RESERVE_LITERS / vehicle.tank_capacity_liters}
          bars={bars}
          reserveLabel
          onLevelChange={(l) => setPct(Math.round(l * 100))}
          className="absolute inset-0 bg-bg"
        />
        <div className="pointer-events-none relative flex h-full flex-col px-5 pb-5 pt-4">
          <div className="pointer-events-auto flex items-center justify-between gap-3">
            <Link to="/app" className="icon-btn h-11 w-11" aria-label="Back to home">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            {mode === 'onboarding' && (
              <Link to="/app" className="chip">
                Skip
              </Link>
            )}
          </div>
          <h1 className="title mt-5 text-[1.9rem] text-fg">What does your gauge say?</h1>
          <p className="mt-2 text-sm font-semibold text-fg-2">Drag the fuel up or down until it matches your dashboard.</p>

          <div className="mt-auto drop-shadow-[0_2px_14px_rgb(16_12_8/0.55)]">
            <p className="readout text-[5rem] text-fg">
              <AnimatedNumber value={liters} duration={250} format={(v) => v.toFixed(1)} />
              <span className="ml-2 font-[family-name:var(--font-sans)] text-2xl font-bold tracking-normal">L</span>
            </p>
            <p className="mt-2 text-base font-bold text-fg">
              {filled} of {bars} bars · {displayPct}% · about {Math.round(range)} km
            </p>
            {delta !== 0 && (
              <p className="mt-1 text-sm font-semibold text-fg">
                Was {previous}%, {delta > 0 ? '+' : ''}
                {delta}%
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="glass p-3">
        <p className="unit px-1 pb-2">or tap the bar your dashboard shows</p>
        <div className="flex gap-1.5" role="group" aria-label="Fuel bars">
          {Array.from({ length: bars }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${i + 1} of ${bars} bars`}
              aria-pressed={i < filled}
              onClick={() => setPct(percentFromBarIndex(bars, i))}
              className={`h-10 flex-1 rounded-xl transition ${i < filled ? 'bg-gradient-to-b from-fuel-1 to-fuel-2 shadow-[0_0_14px_rgb(255_162_31/0.5)]' : 'bg-fg/10 hover:bg-fg/20'}`}
            />
          ))}
        </div>
      </div>

      <InfoNote>Gauges aren&apos;t perfectly linear, so treat this as an estimate. Update it whenever you fill up or it looks off.</InfoNote>

      <PrimaryButton fullWidth onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
        {saveMutation.isPending ? 'Saving…' : mode === 'edit' ? 'Update fuel level' : 'Save fuel level'}
      </PrimaryButton>
    </div>
  )
}
