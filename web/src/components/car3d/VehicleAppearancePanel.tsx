import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Vehicle } from '../../api/types'
import { updateVehicle } from '../../api/endpoints'
import { CarViewer } from './CarViewer'
import { VehicleColorPicker } from './VehicleColorPicker'
import { BodyStylePicker } from './BodyStylePicker'
import { CustomModelUrlField } from './CustomModelUrlField'
import { PrimaryButton } from '../buttons/PrimaryButton'
import { resolveBodyType, resolvePaint, type VehicleBodyType } from '../../config/vehicleModels'

type Props = {
  vehicle: Vehicle
  onSaved?: () => void
}

export function VehicleAppearancePanel({ vehicle, onSaved }: Props) {
  const qc = useQueryClient()
  const [paint, setPaint] = useState(resolvePaint(vehicle.make, vehicle.paint_color))
  const [modelUrl, setModelUrl] = useState(vehicle.model_3d_url ?? '')
  const [bodyStyle, setBodyStyle] = useState<VehicleBodyType>(resolveBodyType(vehicle))

  const saveMutation = useMutation({
    mutationFn: () =>
      updateVehicle(vehicle.id, {
        paint_color: paint,
        model_3d_url: modelUrl.trim() || null,
        body_style: bodyStyle,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['vehicles'] })
      onSaved?.()
    },
  })

  const previewVehicle = { ...vehicle, paint_color: paint, model_3d_url: modelUrl || undefined, body_style: bodyStyle }

  return (
    <div>
      <CarViewer
        vehicle={previewVehicle}
        variant="card"
        interactive
        autoRotate={false}
        bodyType={bodyStyle}
        paintOverride={paint}
        modelUrlOverride={modelUrl.trim() || undefined}
        className="border-b border-line"
      />
      <div className="space-y-5 p-5">
        <BodyStylePicker value={bodyStyle} paint={paint} onChange={setBodyStyle} />
        <VehicleColorPicker value={paint} onChange={setPaint} />
        <CustomModelUrlField value={modelUrl} onChange={setModelUrl} />
        {saveMutation.isError && (
          <p className="flex items-center gap-2.5 text-sm text-fg-2" role="alert">
            <span className="lamp text-danger" aria-hidden /> Couldn&apos;t save. Try again.
          </p>
        )}
        <PrimaryButton fullWidth disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
          {saveMutation.isPending ? 'Saving…' : 'Save appearance'}
        </PrimaryButton>
      </div>
    </div>
  )
}
