type Props = {
  value: string
  onChange: (v: string) => void
}

/** Escape hatch for a licensed .glb, tucked away so it doesn't read as a required step. */
export function CustomModelUrlField({ value, onChange }: Props) {
  return (
    <details className="group border-t border-line pt-4" open={Boolean(value)}>
      <summary className="cursor-pointer list-none text-sm font-medium text-fg-3 hover:text-fg-2">
        <span className="mr-2 inline-block transition group-open:rotate-90">›</span>
        Use my own 3D model
      </summary>
      <label className="mt-3 block">
        <span className="field-label">Model URL (.glb)</span>
        <input className="field font-mono text-sm" placeholder="/models/my-car.glb or https://…" value={value} onChange={(e) => onChange(e.target.value)} />
        <span className="mt-1.5 block text-xs text-fg-3">
          Name the body material “paint” so the colour picker can recolour it. Leave empty to use the FUELGO model for the body type.
        </span>
      </label>
    </details>
  )
}
