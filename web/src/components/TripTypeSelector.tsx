type TripType = 'one_way' | 'round_trip' | 'multi_stop'
type Preference = 'fastest' | 'efficient' | 'cheapest'

function Seg<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { id: T; label: string }[]; label: string }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" aria-pressed={value === o.id} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function TripTypeSelector({ value, onChange }: { value: TripType; onChange: (v: TripType) => void }) {
  return (
    <Seg
      label="Trip type"
      value={value}
      onChange={onChange}
      options={[
        { id: 'one_way', label: 'One way' },
        { id: 'round_trip', label: 'Round trip' },
        { id: 'multi_stop', label: 'Multi-stop' },
      ]}
    />
  )
}

export function TravelPreferenceSelector({ value, onChange }: { value: Preference; onChange: (v: Preference) => void }) {
  return (
    <Seg
      label="Route preference"
      value={value}
      onChange={onChange}
      options={[
        { id: 'fastest', label: 'Fastest' },
        { id: 'efficient', label: 'Least fuel' },
        { id: 'cheapest', label: 'Cheapest' },
      ]}
    />
  )
}
