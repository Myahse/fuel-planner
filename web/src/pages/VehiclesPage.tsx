import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Plus } from 'lucide-react'
import { setDefaultVehicle, updateVehicle } from '../api/endpoints'
import { useActiveVehicle } from '../hooks/useActiveVehicle'
import { PageHeader } from '../components/layout/PageHeader'
import { VehicleAppearancePanel } from '../components/car3d/VehicleAppearancePanel'
import { Sheet } from '../components/Sheet'
import { CardSkeleton } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'
import { CarTank } from '../components/liquid/CarTank'
import { AnimatedNumber } from '../components/liquid/AnimatedNumber'
import { PAINT_PRESETS, resolveBodyType, resolvePaint } from '../config/vehicleModels'
import { vehicleFuelProfile } from '../lib/tripAssessment'
import { estimatedRangeKm } from '../lib/fuelMath'

/** Garage: each car carries its own tank, drawn as fuel filling the car's own outline. */
export function VehiclesPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { vehicles, vehicle, vehiclesQuery, setSelectedVehicleId } = useActiveVehicle()
  const [customizing, setCustomizing] = useState(false)
  const [paintDraft, setPaintDraft] = useState<Record<string, string>>({})

  const defaultMutation = useMutation({
    mutationFn: setDefaultVehicle,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  })
  const paintMutation = useMutation({
    mutationFn: ({ id, paint }: { id: string; paint: string }) => updateVehicle(id, { paint_color: paint }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  })

  const car = vehicle ?? vehicles[0]

  if (vehiclesQuery.isLoading) return <CardSkeleton />

  const header = (
    <PageHeader
      title="Garage"
      backTo="/app"
      right={
        <Link to="/app/vehicles/add" className="btn btn-ghost btn-sm" aria-label="Add vehicle">
          <Plus className="h-4 w-4" /> Add
        </Link>
      }
    />
  )

  if (!car) {
    return (
      <div>
        {header}
        <EmptyState
          title="No car yet"
          description="Add your car's tank size and consumption so FUELGO can read its gauge."
          actionLabel="Add a vehicle"
          onAction={() => navigate('/app/vehicles/add')}
        />
      </div>
    )
  }

  const { startingLiters, tankLiters, consumption } = vehicleFuelProfile(car)
  const level = startingLiters / tankLiters
  const paint = paintDraft[car.id] ?? resolvePaint(car.make, car.paint_color)
  const preset = PAINT_PRESETS.find((p) => p.value.toLowerCase() === paint.toLowerCase())

  return (
    <div className="space-y-5">
      {header}

      {vehicles.length > 1 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" role="group" aria-label="Vehicle">
          {vehicles.map((v) => (
            <button key={v.id} type="button" className="chip" aria-pressed={v.id === car.id} onClick={() => setSelectedVehicleId(v.id)}>
              {v.model}
            </button>
          ))}
        </div>
      )}

      <section className="glass relative overflow-hidden px-4 pb-4 pt-4" aria-label={`${car.make} ${car.model} fuel`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="unit">fuel inside</p>
            <p className="readout mt-1 text-[2.2rem] text-fg">
              <AnimatedNumber value={startingLiters} format={(v) => v.toFixed(0)} />
              <span className="ml-1.5 font-[family-name:var(--font-sans)] text-base font-bold tracking-normal text-fg-2">of {tankLiters.toFixed(0)} L</span>
            </p>
          </div>
          <div className="text-right">
            <h2 className="font-[family-name:var(--font-display)] text-base font-bold text-fg">
              {car.make} {car.model}
            </h2>
            <p className="unit mt-1">
              {car.year} · {car.fuel_type}
            </p>
            {car.is_default && (
              <p className="mt-1.5 flex items-center justify-end gap-2 text-xs font-semibold text-fg-2">
                <span className="lamp text-ok" aria-hidden /> Default
              </p>
            )}
          </div>
        </div>
        <CarTank
          key={car.id}
          bodyType={resolveBodyType(car)}
          paint={paint}
          level={level}
          status={level < 0.2 ? 'low' : 'ok'}
          className="mx-auto mt-3 max-w-[440px] text-fg"
        />
      </section>

      <dl className="grid grid-cols-3 gap-2.5">
        {[
          ['tank', tankLiters.toFixed(0), 'L'],
          ['mixed', consumption.toFixed(1), 'L/100'],
          ['range', Math.round(estimatedRangeKm(startingLiters, consumption)).toString(), 'km'],
        ].map(([k, v, u]) => (
          <div key={k} className="glass px-3 py-3">
            <dt className="unit">{k}</dt>
            <dd className="readout mt-2 text-[1.5rem] text-fg">
              {v}
              <span className="unit ml-1">{u}</span>
            </dd>
          </div>
        ))}
      </dl>

      <fieldset>
        <legend className="unit mb-2.5">
          paint · <span className="text-fg">{preset?.label.toLowerCase() ?? paint}</span>
        </legend>
        <div className="flex flex-wrap gap-2.5">
          {PAINT_PRESETS.map((p) => {
            const active = p === preset
            return (
              <button
                key={p.id}
                type="button"
                aria-label={p.label}
                aria-pressed={active}
                onClick={() => {
                  setPaintDraft((d) => ({ ...d, [car.id]: p.value }))
                  paintMutation.mutate({ id: car.id, paint: p.value })
                }}
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition ${active ? 'border-fg' : 'border-fg/15 hover:border-fg/40'}`}
                style={{ background: p.value }}
              >
                {active && <Check className="h-4 w-4 text-white mix-blend-difference" strokeWidth={3} />}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <button className="btn btn-ghost btn-sm" onClick={() => setCustomizing(true)} type="button">
          3D view &amp; body
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/app/vehicles/add?edit=${car.id}`)} type="button">
          Edit details
        </button>
        {!car.is_default && (
          <button className="btn btn-primary btn-sm col-span-2" onClick={() => defaultMutation.mutate(car.id)} type="button">
            Make default
          </button>
        )}
      </div>

      <Sheet open={customizing} onClose={() => setCustomizing(false)} title={`${car.make} ${car.model}`}>
        {customizing && <VehicleAppearancePanel vehicle={{ ...car, paint_color: paint }} onSaved={() => setCustomizing(false)} />}
      </Sheet>
    </div>
  )
}
