import { BODY_TYPES, type VehicleBodyType } from '../../config/vehicleModels'
import { VehicleSilhouette } from './VehicleSilhouette'

type Props = {
  value: VehicleBodyType
  paint: string
  onChange: (v: VehicleBodyType) => void
}

export function BodyStylePicker({ value, paint, onChange }: Props) {
  return (
    <fieldset>
      <legend className="field-label">Body</legend>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {BODY_TYPES.map((o) => {
          const active = o.value === value
          return (
            <label
              key={o.value}
              className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-sm border px-2 pb-2 pt-3 text-xs font-semibold transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-signal ${
                active ? 'border-signal bg-panel-2 text-fg' : 'border-line-strong text-fg-3 hover:border-fg-3 hover:text-fg-2'
              }`}
            >
              <input type="radio" name="body-style" value={o.value} checked={active} onChange={() => onChange(o.value)} className="sr-only" />
              <VehicleSilhouette bodyType={o.value} paint={active ? paint : '#3a3d42'} className="h-8 w-full text-fg" />
              {o.label}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
