import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { getFuelCurrent, updateFuelCurrent } from '../api/endpoints'
import { useActiveVehicle } from '../hooks/useActiveVehicle'
import { ArrowLeft } from 'lucide-react'
import { TankCard } from '../components/liquid/TankCard'
import { FuelGauge } from '../components/gauge/FuelGauge'
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

  const level = displayPct / 100
  const status = displayPct < 20 ? 'low' : 'ok'
  const reserve = RESERVE_LITERS / vehicle.tank_capacity_liters
  const setLevel = (l: number) => setPct(Math.round(l * 100))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Link to="/app" className="icon-btn h-11 w-11" aria-label="Back to home">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        {mode === 'onboarding' ? (
          <Link to="/app" className="chip">
            Skip
          </Link>
        ) : (
          <span className="unit">
            {vehicle.make} {vehicle.model} · {bars}-bar gauge
          </span>
        )}
      </div>

      <div>
        <h1 className="title text-[1.9rem] text-fg">What does your gauge say?</h1>
        <p className="mt-2 text-sm font-semibold text-fg-2">Turn the needle until it matches your dashboard, or tap a bar.</p>
      </div>

      <FuelGauge
        value={level}
        status={status}
        reserve={reserve}
        bars={bars}
        onChange={setLevel}
        label="Fuel level. Drag the needle or use the arrow keys."
        className="mx-auto max-w-[360px]"
      >
        <p className="readout text-[2.6rem] text-fg">
          <AnimatedNumber value={liters} duration={250} format={(v) => v.toFixed(1)} />
          <span className="ml-1 font-[family-name:var(--font-sans)] text-lg font-bold tracking-normal">L</span>
        </p>
        <p className="unit mt-1">
          {displayPct}% · about {Math.round(range)} km
        </p>
      </FuelGauge>

      <TankCard level={level} status={status} reserve={reserve} bars={bars} onLevelChange={setLevel} className="h-20">
        <span className="unit text-fg">
          {filled} of {bars} bars
        </span>
        {delta !== 0 && (
          <span className="unit text-fg">
            was {previous}% · {delta > 0 ? '+' : ''}
            {delta}%
          </span>
        )}
      </TankCard>

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

      <InfoNote>Gauges aren&apos;t perfectly linear, so treat this as an estimate. Update it whenever you fill up or it looks off.</InfoNote>

      <PrimaryButton fullWidth onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
        {saveMutation.isPending ? 'Saving…' : mode === 'edit' ? 'Update fuel level' : 'Save fuel level'}
      </PrimaryButton>
    </div>
  )
}
