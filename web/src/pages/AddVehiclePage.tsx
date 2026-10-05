import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { createVehicle } from '../api/endpoints'
import { PageHeader } from '../components/layout/PageHeader'
import { PrimaryButton } from '../components/buttons/PrimaryButton'
import { Card, InputField, SectionLabel } from '../components/ui'
import { CarViewer } from '../components/car3d/CarViewer'
import { BodyStylePicker } from '../components/car3d/BodyStylePicker'
import { CustomModelUrlField } from '../components/car3d/CustomModelUrlField'
import { VehicleColorPicker } from '../components/car3d/VehicleColorPicker'
import type { VehicleBodyType } from '../config/vehicleModels'
import { resolvePaint } from '../config/vehicleModels'

export function AddVehiclePage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [preview, setPreview] = useState({ make: 'Toyota', model: 'Corolla' })
  const [paint, setPaint] = useState('#f8fafc')
  const [bodyStyle, setBodyStyle] = useState<VehicleBodyType>('sedan')
  const [modelUrl, setModelUrl] = useState('')

  const createMutation = useMutation({
    mutationFn: createVehicle,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] })
      navigate('/app/vehicles')
    },
  })

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const make = String(fd.get('make'))
    await createMutation.mutateAsync({
      make,
      model: String(fd.get('model')),
      year: Number(fd.get('year')),
      engine: String(fd.get('engine')),
      fuel_type: String(fd.get('fuel_type')),
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

  const previewVehicle = {
    make: preview.make,
    model: preview.model,
    paint_color: paint,
    body_style: bodyStyle,
    model_3d_url: modelUrl.trim() || undefined,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Vehicle"
        backTo="/app/vehicles"
        subtitle="Customize paint and 3D model before saving."
      />

      <div className="card-surface overflow-hidden p-0">
        <CarViewer
          vehicle={previewVehicle}
          variant="hero"
          interactive
          autoRotate={false}
          bodyType={bodyStyle}
          paintOverride={paint}
          modelUrlOverride={modelUrl.trim() || undefined}
        />
      </div>

      <Card>
        <VehicleColorPicker
          value={paint}
          onChange={(c) => setPaint(c)}
        />
        <div className="mt-5 space-y-5">
          <BodyStylePicker value={bodyStyle} paint={paint} onChange={setBodyStyle} />
          <CustomModelUrlField value={modelUrl} onChange={setModelUrl} />
        </div>
      </Card>

      <Card>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={onSubmit}
          onChange={(e) => {
            const t = e.target
            if (t instanceof HTMLInputElement && t.name === 'make') {
              setPreview((p) => ({ ...p, make: t.value }))
              if (!paint || paint === resolvePaint(preview.make)) setPaint(resolvePaint(t.value))
            }
            if (t instanceof HTMLInputElement && t.name === 'model') {
              setPreview((p) => ({ ...p, model: t.value }))
            }
          }}
        >
          <label className="text-sm">
            <SectionLabel>Make</SectionLabel>
            <InputField name="make" required defaultValue="Toyota" className="mt-1" />
          </label>
          <label className="text-sm">
            <SectionLabel>Model</SectionLabel>
            <InputField name="model" required defaultValue="Corolla" className="mt-1" />
          </label>
          <label className="text-sm">
            <SectionLabel>Year</SectionLabel>
            <InputField name="year" type="number" required defaultValue={2022} className="mt-1" />
          </label>
          <label className="text-sm">
            <SectionLabel>Engine</SectionLabel>
            <InputField name="engine" defaultValue="1.8L" className="mt-1" />
          </label>
          <label className="text-sm sm:col-span-2">
            <SectionLabel>Fuel type</SectionLabel>
            <select name="fuel_type" className="input-field mt-1" defaultValue="petrol">
              <option value="petrol">Petrol</option>
              <option value="diesel">Diesel</option>
            </select>
          </label>
          <label className="text-sm">
            <SectionLabel>Tank capacity (L)</SectionLabel>
            <InputField name="tank" type="number" step="0.1" required defaultValue={50} className="mt-1" />
          </label>
          <label className="text-sm">
            <SectionLabel>Initial fuel %</SectionLabel>
            <InputField name="fuel_pct" type="number" defaultValue={60} className="mt-1" />
          </label>
          <label className="text-sm">
            <SectionLabel>City consumption</SectionLabel>
            <InputField name="city" type="number" step="0.1" defaultValue={8.7} className="mt-1" />
          </label>
          <label className="text-sm">
            <SectionLabel>Highway consumption</SectionLabel>
            <InputField name="highway" type="number" step="0.1" defaultValue={6.8} className="mt-1" />
          </label>
          <label className="text-sm sm:col-span-2">
            <SectionLabel>Mixed consumption (L/100 km)</SectionLabel>
            <InputField name="mixed" type="number" step="0.1" required defaultValue={7.5} className="mt-1" />
          </label>
          <PrimaryButton type="submit" fullWidth className="sm:col-span-2" disabled={createMutation.isPending}>
            Save Vehicle
          </PrimaryButton>
        </form>
      </Card>
    </div>
  )
}
