import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { createFuelTransaction } from '../api/endpoints'
import { useActiveVehicle } from '../hooks/useActiveVehicle'
import { PageHeader } from '../components/layout/PageHeader'
import { PrimaryButton } from '../components/buttons/PrimaryButton'
import { ProgressBar } from '../components/ProgressBar'
import { estimatedRangeKm, litersFromPercent } from '../lib/fuelMath'

type Mode = 'liters' | 'amount'

export function AddFuelPage() {
  const { vehicle, fuelPricePerLiter } = useActiveVehicle()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [mode, setMode] = useState<Mode>('liters')
  const [liters, setLiters] = useState(20)
  const [price, setPrice] = useState(fuelPricePerLiter)
  const [amount, setAmount] = useState(10000)
  const [station, setStation] = useState('')
  const [notes, setNotes] = useState('')

  const tank = vehicle?.tank_capacity_liters ?? 50
  const currentPct = vehicle?.fuel_percentage ?? 60
  const currentLiters = litersFromPercent(tank, currentPct)
  const consumption = vehicle?.mixed_consumption ?? 7.5

  const addedLiters = mode === 'liters' ? liters : amount / price
  const totalCost = mode === 'liters' ? liters * price : amount
  const newLiters = Math.min(tank, currentLiters + addedLiters)
  const extraRange = estimatedRangeKm(newLiters - currentLiters, consumption)

  const saveMutation = useMutation({
    mutationFn: () =>
      createFuelTransaction({
        vehicle_id: vehicle!.id,
        liters: addedLiters,
        price_per_liter: price,
        notes: notes || undefined,
      }),
    onSuccess: (tx) => {
      qc.invalidateQueries({ queryKey: ['fuel-current'] })
      qc.invalidateQueries({ queryKey: ['vehicles'] })
      navigate(`/app/fuel/transactions/${tx.id}`)
    },
  })

  if (!vehicle) return null

  const newPct = (newLiters / tank) * 100

  return (
    <div className="space-y-8">
      <PageHeader title="Log a fill-up" backTo="/app" subtitle={`${vehicle.make} ${vehicle.model}`} />

      <div className="seg" role="group" aria-label="Enter by">
        {(['liters', 'amount'] as Mode[]).map((m) => (
          <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}>
            {m === 'liters' ? 'Litres' : 'Amount paid'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {mode === 'liters' ? (
          <label className="col-span-2 block">
            <span className="field-label">Litres added</span>
            <span className="relative block">
              <input type="number" inputMode="decimal" className="field h-16 pr-10 text-3xl font-semibold" value={liters} onChange={(e) => setLiters(Number(e.target.value))} />
              <span className="unit absolute right-4 top-1/2 -translate-y-1/2">L</span>
            </span>
          </label>
        ) : (
          <label className="col-span-2 block">
            <span className="field-label">Amount paid</span>
            <span className="relative block">
              <input type="number" inputMode="numeric" className="field h-16 pr-16 text-3xl font-semibold" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
              <span className="unit absolute right-4 top-1/2 -translate-y-1/2">FCFA</span>
            </span>
          </label>
        )}
        <label className="block">
          <span className="field-label">Price per litre</span>
          <span className="relative block">
            <input type="number" inputMode="numeric" className="field pr-16" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
            <span className="unit absolute right-3.5 top-1/2 -translate-y-1/2">FCFA/L</span>
          </span>
        </label>
        <label className="block">
          <span className="field-label">Date</span>
          <input type="date" className="field" defaultValue={new Date().toISOString().slice(0, 10)} />
        </label>
      </div>

      <section className="border-y border-line py-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="unit">{mode === 'liters' ? 'you pay' : 'you get'}</p>
            <p className="readout mt-2 text-5xl text-fg">
              {mode === 'liters' ? Math.round(totalCost).toLocaleString('en-US') : addedLiters.toFixed(1)}
              <span className="unit ml-1.5">{mode === 'liters' ? 'FCFA' : 'L'}</span>
            </p>
          </div>
          <div className="pb-1 text-right">
            <p className="readout text-2xl text-fg">
              +{Math.round(extraRange)}
              <span className="unit ml-1">km</span>
            </p>
            <p className="unit mt-1">extra range</p>
          </div>
        </div>
        <div className="mt-5">
          <ProgressBar percent={newPct} />
          <p className="unit mt-2">
            tank after: {newLiters.toFixed(1)} / {tank.toFixed(0)} L
          </p>
        </div>
      </section>

      <div className="space-y-3">
        <label className="block">
          <span className="field-label">Station (optional)</span>
          <input className="field" value={station} onChange={(e) => setStation(e.target.value)} placeholder="e.g. Total — Plateau" />
        </label>
        <label className="block">
          <span className="field-label">Notes (optional)</span>
          <textarea className="field" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
      </div>

      <PrimaryButton fullWidth disabled={saveMutation.isPending || addedLiters <= 0} onClick={() => saveMutation.mutate()}>
        {saveMutation.isPending ? 'Saving…' : 'Save fill-up'}
      </PrimaryButton>
    </div>
  )
}
