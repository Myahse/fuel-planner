import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { getFuelCurrent, updateFuelCurrent } from '../api/endpoints'
import { useActiveVehicle } from '../hooks/useActiveVehicle'
import { FuelGauge } from '../components/FuelGauge'
import { PageHeader } from '../components/layout/PageHeader'
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

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader
        title="How much fuel do you have?"
        subtitle="Adjust the fuel level to match your car's fuel indicator."
        backTo="/app"
        right={
          mode === 'onboarding' ? (
            <Link to="/app" className="text-sm font-semibold text-brand-800">Skip</Link>
          ) : undefined
        }
      />

      <div className="mb-4 flex justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <span key={s} className={`h-1.5 w-8 rounded-full ${s <= 2 ? 'bg-brand-800' : 'bg-slate-200'}`} />
        ))}
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-card">
        <FuelGauge
          bars={vehicle.fuel_gauge_bars}
          percentage={displayPct}
          tankCapacityLiters={vehicle.tank_capacity_liters}
          consumptionLPer100Km={vehicle.mixed_consumption}
          onChange={setPct}
        />
      </div>

      <div className="mt-4">
      <InfoNote>
        <strong className="text-ink">This is an estimate.</strong> Fuel gauges are not perfectly linear. You can
        adjust your fuel level anytime.
      </InfoNote>
      </div>

      {mode === 'edit' && (
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-xl bg-white p-3 shadow-card">
            <p className="text-muted">Previous</p>
            <p className="font-bold">{previous}%</p>
          </div>
          <div className="rounded-xl bg-brand-50 p-3">
            <p className="text-muted">New</p>
            <p className="font-bold text-brand-800">{displayPct}%</p>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-card">
            <p className="text-muted">Change</p>
            <p className="font-bold">{displayPct - previous}%</p>
          </div>
        </div>
      )}

      <PrimaryButton
        className="mt-6"
        fullWidth
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
      >
        {mode === 'edit' ? 'Update Fuel Level' : 'Continue →'}
      </PrimaryButton>
    </div>
  )
}
