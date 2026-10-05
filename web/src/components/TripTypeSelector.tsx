type TripType = 'one_way' | 'round_trip' | 'multi_stop'
type Preference = 'fastest' | 'efficient' | 'cheapest'

export function TripTypeSelector({
  value,
  onChange,
}: {
  value: TripType
  onChange: (v: TripType) => void
}) {
  const options: { id: TripType; label: string }[] = [
    { id: 'one_way', label: 'One way' },
    { id: 'round_trip', label: 'Round trip' },
    { id: 'multi_stop', label: 'Multi-stop' },
  ]
  return (
    <div className="flex gap-2 rounded-2xl bg-slate-100 p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`flex-1 rounded-xl px-2 py-2.5 text-xs font-semibold sm:text-sm transition ${
            value === o.id ? 'bg-white text-brand-800 shadow-sm' : 'text-muted'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function TravelPreferenceSelector({
  value,
  onChange,
}: {
  value: Preference
  onChange: (v: Preference) => void
}) {
  const options: { id: Preference; label: string }[] = [
    { id: 'fastest', label: 'Fastest' },
    { id: 'efficient', label: 'Most fuel efficient' },
    { id: 'cheapest', label: 'Cheapest' },
  ]
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition ${
            value === o.id
              ? 'border-brand-800 bg-brand-50 text-brand-800'
              : 'border-slate-200 bg-white text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
