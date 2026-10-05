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

  const delta = displayPct - previous

  return (
    <div className="space-y-8">
      <PageHeader
        title="What does your gauge say?"
        subtitle={`${vehicle.make} ${vehicle.model} · ${vehicle.fuel_gauge_bars}-bar gauge`}
        backTo="/app"
        right={
          mode === 'onboarding' ? (
            <Link to="/app" className="text-sm font-medium text-fg-3 hover:text-fg">
              Skip
            </Link>
          ) : undefined
        }
      />

      <FuelGauge
        bars={vehicle.fuel_gauge_bars}
        percentage={displayPct}
        tankCapacityLiters={vehicle.tank_capacity_liters}
        consumptionLPer100Km={vehicle.mixed_consumption}
        onChange={setPct}
      />

      {delta !== 0 && (
        <p className="unit">
          was {previous}% · now {displayPct}% · {delta > 0 ? '+' : ''}
          {delta}%
        </p>
      )}

      <InfoNote>Gauges aren&apos;t perfectly linear, so treat this as an estimate. Update it whenever you fill up or it looks off.</InfoNote>

      <PrimaryButton fullWidth onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
        {saveMutation.isPending ? 'Saving…' : mode === 'edit' ? 'Update fuel level' : 'Save fuel level'}
      </PrimaryButton>
    </div>
  )
}
