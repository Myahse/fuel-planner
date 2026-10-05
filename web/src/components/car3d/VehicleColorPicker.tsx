import { PAINT_PRESETS } from '../../config/vehicleModels'

type Props = {
  value: string
  onChange: (hex: string) => void
}

export function VehicleColorPicker({ value, onChange }: Props) {
  return (
    <div className="space-y-3">
      <p className="eyebrow">Paint color</p>
      <div className="flex flex-wrap gap-2">
        {PAINT_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            title={p.label}
            onClick={() => onChange(p.value)}
            className={`h-10 w-10 rounded-full border-2 shadow-sm transition hover:scale-105 ${
              value.toLowerCase() === p.value.toLowerCase() ? 'border-brand-800 ring-2 ring-brand-200' : 'border-white'
            }`}
            style={{ backgroundColor: p.value }}
            aria-label={p.label}
          />
        ))}
        <label className="flex h-10 cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-muted shadow-sm">
          Custom
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0"
          />
        </label>
      </div>
      <p className="text-xs text-muted">Selected: <span className="font-mono font-semibold text-ink">{value}</span></p>
    </div>
  )
}
