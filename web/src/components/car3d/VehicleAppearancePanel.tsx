import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Vehicle } from '../../api/types'
import { updateVehicle } from '../../api/endpoints'
import { CarViewer } from './CarViewer'
import { VehicleColorPicker } from './VehicleColorPicker'
import { PrimaryButton } from '../buttons/PrimaryButton'
import { InputField, SectionLabel, Card } from '../ui'
import type { VehicleBodyType } from '../../config/vehicleModels'

type Props = {
  vehicle: Vehicle
}

export function VehicleAppearancePanel({ vehicle }: Props) {
  const qc = useQueryClient()
  const [paint, setPaint] = useState(vehicle.paint_color ?? '#f8fafc')
  const [modelUrl, setModelUrl] = useState(vehicle.model_3d_url ?? '')
  const [bodyStyle, setBodyStyle] = useState<VehicleBodyType>(
    (vehicle.body_style as VehicleBodyType) || 'sedan',
  )

  const saveMutation = useMutation({
    mutationFn: () =>
      updateVehicle(vehicle.id, {
        paint_color: paint,
        model_3d_url: modelUrl.trim() || null,
        body_style: bodyStyle,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  })

  const previewVehicle = { ...vehicle, make: vehicle.make, model: vehicle.model, paint_color: paint, model_3d_url: modelUrl || undefined, body_style: bodyStyle }

  return (
    <Card className="space-y-4 p-0 overflow-hidden" featured>
      <CarViewer
        vehicle={previewVehicle}
        variant="card"
        interactive
        autoRotate={false}
        bodyType={bodyStyle}
        paintOverride={paint}
        modelUrlOverride={modelUrl.trim() || undefined}
      />
      <div className="space-y-4 p-5">
        <VehicleColorPicker value={paint} onChange={setPaint} />
        <label className="block text-sm">
          <SectionLabel>Body style (3D model)</SectionLabel>
          <select
            className="input-field mt-1"
            value={bodyStyle}
            onChange={(e) => setBodyStyle(e.target.value as VehicleBodyType)}
          >
            <option value="sedan">Sedan</option>
            <option value="suv">SUV</option>
            <option value="hatchback">Hatchback</option>
          </select>
        </label>
        <label className="block text-sm">
          <SectionLabel>Custom 3D model URL (optional)</SectionLabel>
          <InputField
            className="mt-1 font-mono text-xs"
            placeholder="/models/sedan.glb or https://…"
            value={modelUrl}
            onChange={(e) => setModelUrl(e.target.value)}
          />
          <p className="mt-1 text-xs text-muted">
            Optional. Leave empty for the built-in stylized car. Paste a URL only when you have a real licensed .glb model.
          </p>
        </label>
        <PrimaryButton
          fullWidth
          size="md"
          disabled={saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          {saveMutation.isSuccess ? 'Saved' : 'Save appearance'}
        </PrimaryButton>
      </div>
    </Card>
  )
}
