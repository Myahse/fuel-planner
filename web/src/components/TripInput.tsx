import { ArrowDownUp } from 'lucide-react'

type Props = {
  origin: string
  destination: string
  onOriginChange: (v: string) => void
  onDestinationChange: (v: string) => void
  onSwap: () => void
}

/** From/To as one route block: two stops joined by a line, like an itinerary. */
export function TripInput({ origin, destination, onOriginChange, onDestinationChange, onSwap }: Props) {
  return (
    <div className="relative rounded-sm border border-line-strong bg-panel">
      <span className="absolute bottom-[30%] left-[19px] top-[30%] w-px bg-line-strong" aria-hidden />
      <label className="flex items-center gap-4 border-b border-line px-4 py-2.5">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-fg" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="unit block">from</span>
          <input className="w-full bg-transparent text-lg font-semibold text-fg outline-none" value={origin} onChange={(e) => onOriginChange(e.target.value)} />
        </span>
      </label>
      <label className="flex items-center gap-4 px-4 py-2.5">
        <span className="h-2.5 w-2.5 shrink-0 rounded-[1px] bg-signal" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="unit block">to</span>
          <input className="w-full bg-transparent text-lg font-semibold text-fg outline-none" value={destination} onChange={(e) => onDestinationChange(e.target.value)} />
        </span>
      </label>
      <button
        type="button"
        onClick={onSwap}
        className="icon-btn absolute right-3 top-1/2 h-9 w-9 -translate-y-1/2 bg-panel"
        aria-label="Swap origin and destination"
      >
        <ArrowDownUp className="h-4 w-4" />
      </button>
    </div>
  )
}
