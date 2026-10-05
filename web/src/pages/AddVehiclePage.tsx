import { useState, type FormEvent, type ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { createVehicle } from '../api/endpoints'
import { PageHeader } from '../components/layout/PageHeader'
import { PrimaryButton } from '../components/buttons/PrimaryButton'
import { CarViewer } from '../components/car3d/CarViewer'
import { BodyStylePicker } from '../components/car3d/BodyStylePicker'
import { CustomModelUrlField } from '../components/car3d/CustomModelUrlField'
import { VehicleColorPicker } from '../components/car3d/VehicleColorPicker'
import { resolveBodyType, resolvePaint, type VehicleBodyType } from '../config/vehicleModels'

function Field({ label, unit, className = '', children }: { label: string; unit?: string; className?: string; children: ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="field-label">{label}</span>
      <span className="relative block">
        {children}
        {unit && <span className="unit pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2">{unit}</span>}
      </span>
    </label>
  )
}

export function AddVehiclePage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [make, setMake] = useState('Toyota')
  const [model, setModel] = useState('Corolla')
  const [paint, setPaint] = useState(resolvePaint('Toyota'))
  const [bodyStyle, setBodyStyle] = useState<VehicleBodyType>('sedan')
  const [bodyTouched, setBodyTouched] = useState(false)
  const [fuelType, setFuelType] = useState<'petrol' | 'diesel'>('petrol')
  const [modelUrl, setModelUrl] = useState('')

  const createMutation = useMutation({
    mutationFn: createVehicle,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] })
      navigate('/app/vehicles')
    },
  })

  // Until the user picks a body style, guess it from the model name (Hilux → pickup, RAV4 → SUV…).
  const updateName = (nextMake: string, nextModel: string) => {
    if (paint === resolvePaint(make)) setPaint(resolvePaint(nextMake))
    setMake(nextMake)
    setModel(nextModel)
    if (!bodyTouched) setBodyStyle(resolveBodyType({ make: nextMake, model: nextModel }))
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    createMutation.mutate({
      make,
      model,
      year: Number(fd.get('year')),
      engine: String(fd.get('engine')),
      fuel_type: fuelType,
      tank_capacity_liters: Number(fd.get('tank')),
      mixed_consumption: Number(fd.get('mixed')),
      city_consumption: Number(fd.get('city')),
      highway_consumption: Number(fd.get('highway')),
      initial_fuel_percentage: Number(fd.get('fuel_pct')),
      is_default: true,
      paint_color: paint,
      body_style: bodyStyle,
      model_3d_url: modelUrl.trim() || undefined,
    })
  }

  return (
    <form className="space-y-8" onSubmit={onSubmit}>
      <PageHeader title="Add a vehicle" backTo="/app/vehicles" subtitle="Tank size and consumption drive every estimate, so take them from your manual if you can." />

      <div className="-mx-4 border-y border-line sm:mx-0 sm:rounded-md sm:border">
        <CarViewer
          vehicle={{ make, model, paint_color: paint, body_style: bodyStyle }}
          variant="card"
          interactive
          autoRotate={false}
          bodyType={bodyStyle}
          paintOverride={paint}
          modelUrlOverride={modelUrl.trim() || undefined}
        />
      </div>

      <section className="space-y-4">
        <h2 className="title text-xl text-fg">The car</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Make">
            <input className="field" required value={make} onChange={(e) => updateName(e.target.value, model)} />
          </Field>
          <Field label="Model">
            <input className="field" required value={model} onChange={(e) => updateName(make, e.target.value)} />
          </Field>
          <Field label="Year">
            <input className="field" name="year" type="number" required defaultValue={2022} />
          </Field>
          <Field label="Engine">
            <input className="field" name="engine" defaultValue="1.8L" />
          </Field>
        </div>
        <div>
          <span className="field-label">Fuel</span>
          <div className="seg" role="group" aria-label="Fuel type">
            {(['petrol', 'diesel'] as const).map((f) => (
              <button key={f} type="button" aria-pressed={fuelType === f} onClick={() => setFuelType(f)} className="capitalize">
                {f}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="title text-xl text-fg">Tank &amp; consumption</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tank capacity" unit="L">
            <input className="field pr-10" name="tank" type="number" step="0.1" required defaultValue={50} />
          </Field>
          <Field label="Fuel right now" unit="%">
            <input className="field pr-10" name="fuel_pct" type="number" min={0} max={100} defaultValue={60} />
          </Field>
          <Field label="City" unit="L/100km">
            <input className="field pr-20" name="city" type="number" step="0.1" defaultValue={8.7} />
          </Field>
          <Field label="Highway" unit="L/100km">
            <input className="field pr-20" name="highway" type="number" step="0.1" defaultValue={6.8} />
          </Field>
          <Field label="Mixed — used for trip estimates" unit="L/100km" className="col-span-2">
            <input className="field pr-20" name="mixed" type="number" step="0.1" required defaultValue={7.5} />
          </Field>
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="title text-xl text-fg">Look</h2>
        <BodyStylePicker
          value={bodyStyle}
          paint={paint}
          onChange={(v) => {
            setBodyTouched(true)
            setBodyStyle(v)
          }}
        />
        <VehicleColorPicker value={paint} onChange={setPaint} />
        <CustomModelUrlField value={modelUrl} onChange={setModelUrl} />
      </section>

      {createMutation.isError && (
        <p className="flex items-center gap-2.5 text-sm text-fg-2" role="alert">
          <span className="lamp text-danger" aria-hidden />
          Couldn&apos;t save the vehicle. Check the fields and try again.
        </p>
      )}

      <PrimaryButton type="submit" fullWidth disabled={createMutation.isPending}>
        {createMutation.isPending ? 'Saving…' : 'Save vehicle'}
      </PrimaryButton>
    </form>
  )
}
