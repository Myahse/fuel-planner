import type { VehicleBodyType } from '../../config/vehicleModels'
import { VehicleSilhouette } from './VehicleSilhouette'

const OPTIONS: { value: VehicleBodyType; label: string }[] = [
  { value: 'sedan', label: 'Sedan' },
  { value: 'hatchback', label: 'Hatchback' },
  { value: 'suv', label: 'SUV' },
]

type Props = {
  value: VehicleBodyType
  paint: string
  onChange: (v: VehicleBodyType) => void
}

export function BodyStylePicker({ value, paint, onChange }: Props) {
  return (
    <fieldset>
      <legend className="eyebrow mb-2">Body style</legend>
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((o) => {
          const active = o.value === value
          return (
            <label
              key={o.value}
              className={`flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 p-2 text-xs font-semibold transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-300 ${
                active ? 'border-brand-700 bg-brand-50 text-brand-800' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="body-style"
                value={o.value}
                checked={active}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              <VehicleSilhouette bodyType={o.value} paint={paint} className="h-10 w-full text-slate-900" />
              {o.label}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
