import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { createFuelTransaction } from '../api/endpoints'
import { useActiveVehicle } from '../hooks/useActiveVehicle'
import { PageHeader } from '../components/layout/PageHeader'
import { PrimaryButton } from '../components/buttons/PrimaryButton'
import { Card } from '../components/ui'
import { formatFcfa, formatKm, formatLiters } from '../lib/format'
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
  const extraRange = estimatedRangeKm(addedLiters, consumption)

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

  return (
    <div className="max-w-lg">
      <PageHeader title="Add Fuel" backTo="/app" />

      <div className="mb-4 flex rounded-2xl bg-slate-100 p-1">
        {(['liters', 'amount'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold ${
              mode === m ? 'bg-white text-brand-800 shadow-sm' : 'text-muted'
            }`}
          >
            {m === 'liters' ? 'By Liters' : 'By Amount'}
          </button>
        ))}
      </div>

      <Card className="space-y-4">
        {mode === 'liters' ? (
          <>
            <label className="block text-sm">
              <span className="text-muted">Liters Added</span>
              <input
                type="number"
                className="mt-1 w-full rounded-2xl border px-3 py-3 text-lg font-bold"
                value={liters}
                onChange={(e) => setLiters(Number(e.target.value))}
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted">Price per liter</span>
              <input
                type="number"
                className="mt-1 w-full rounded-2xl border px-3 py-3"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
              />
            </label>
          </>
        ) : (
          <>
            <label className="block text-sm">
              <span className="text-muted">Amount</span>
              <input
                type="number"
                className="mt-1 w-full rounded-2xl border px-3 py-3 text-lg font-bold"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted">Fuel price</span>
              <input
                type="number"
                className="mt-1 w-full rounded-2xl border px-3 py-3"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
              />
            </label>
            <p className="text-sm text-muted">
              ≈ {formatLiters(addedLiters)} • Additional range {formatKm(extraRange)}
            </p>
          </>
        )}

        <div className="rounded-2xl bg-surface p-4">
          <p className="text-sm text-muted">Total Cost</p>
          <p className="text-2xl font-bold text-brand-800">{formatFcfa(totalCost)}</p>
          <p className="mt-2 text-sm">
            New tank level{' '}
            <span className="font-semibold">{formatLiters(newLiters, 1)} / {formatLiters(tank, 0)}</span>
          </p>
        </div>

        <label className="block text-sm">
          <span className="text-muted">Date</span>
          <input type="date" className="mt-1 w-full rounded-2xl border px-3 py-3" defaultValue="2026-10-03" />
        </label>
        <label className="block text-sm">
          <span className="text-muted">Station (optional)</span>
          <input className="mt-1 w-full rounded-2xl border px-3 py-3" value={station} onChange={(e) => setStation(e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="text-muted">Notes (optional)</span>
          <textarea className="mt-1 w-full rounded-2xl border px-3 py-3" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>

        <PrimaryButton fullWidth disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
          Save
        </PrimaryButton>
      </Card>
    </div>
  )
}
