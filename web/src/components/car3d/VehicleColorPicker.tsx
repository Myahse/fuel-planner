import { Check } from 'lucide-react'
import { PAINT_PRESETS } from '../../config/vehicleModels'

type Props = {
  value: string
  onChange: (hex: string) => void
}

export function VehicleColorPicker({ value, onChange }: Props) {
  const preset = PAINT_PRESETS.find((p) => p.value.toLowerCase() === value.toLowerCase())
  return (
    <fieldset>
      <legend className="field-label">
        Paint <span className="ml-2 text-fg">{preset?.label ?? value.toUpperCase()}</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {PAINT_PRESETS.map((p) => {
          const active = p === preset
          return (
            <button
              key={p.id}
              type="button"
              title={p.label}
              aria-label={p.label}
              aria-pressed={active}
              onClick={() => onChange(p.value)}
              className={`flex h-10 w-10 items-center justify-center rounded-sm border transition ${
                active ? 'border-signal' : 'border-line-strong hover:border-fg-3'
              }`}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-xs" style={{ background: p.value }}>
                {active && <Check className="h-3.5 w-3.5 text-white mix-blend-difference" strokeWidth={3} />}
              </span>
            </button>
          )
        })}
        <label
          className={`flex h-10 cursor-pointer items-center gap-2 rounded-sm border px-2.5 text-xs font-semibold text-fg-2 transition ${
            preset ? 'border-line-strong hover:border-fg-3' : 'border-signal text-fg'
          }`}
        >
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-6 w-6 cursor-pointer rounded-xs border-0 bg-transparent p-0" />
          Custom
        </label>
      </div>
    </fieldset>
  )
}
