import { InputField } from '../ui'

type Props = {
  value: string
  onChange: (v: string) => void
}

/** Escape hatch for a licensed .glb — tucked away so it doesn't read as a required step. */
export function CustomModelUrlField({ value, onChange }: Props) {
  return (
    <details className="group rounded-2xl border border-slate-200 px-4 py-3" open={Boolean(value)}>
      <summary className="cursor-pointer text-sm font-semibold text-slate-600 marker:text-slate-400">
        Advanced: custom 3D model
      </summary>
      <label className="mt-3 block text-sm">
        <span className="eyebrow">Model URL (.glb)</span>
        <InputField
          className="mt-1 font-mono text-xs"
          placeholder="/models/my-car.glb or https://…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <span className="mt-1 block text-xs text-muted">
          Leave empty to use the built-in model for the body style above.
        </span>
      </label>
    </details>
  )
}
