import { MapPin, ArrowUpDown } from 'lucide-react'

type Props = {
  origin: string
  destination: string
  onOriginChange: (v: string) => void
  onDestinationChange: (v: string) => void
  onSwap: () => void
}

export function TripInput({ origin, destination, onOriginChange, onDestinationChange, onSwap }: Props) {
  return (
    <div className="relative space-y-3">
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">From</span>
        <div className="input-field mt-1 flex items-center gap-2 !py-3 shadow-sm">
          <MapPin className="h-4 w-4 shrink-0 text-brand-800" />
          <input
            className="w-full border-0 bg-transparent text-base font-medium text-ink outline-none"
            value={origin}
            onChange={(e) => onOriginChange(e.target.value)}
          />
        </div>
      </label>

      <button
        type="button"
        onClick={onSwap}
        className="absolute right-3 top-[calc(50%-4px)] z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-brand-800 shadow-sm"
        aria-label="Swap origin and destination"
      >
        <ArrowUpDown className="h-4 w-4" />
      </button>

      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">To</span>
        <div className="input-field mt-1 flex items-center gap-2 !py-3 shadow-sm">
          <MapPin className="h-4 w-4 shrink-0 text-red-600" />
          <input
            className="w-full border-0 bg-transparent text-base font-medium text-ink outline-none"
            value={destination}
            onChange={(e) => onDestinationChange(e.target.value)}
          />
        </div>
      </label>
    </div>
  )
}
