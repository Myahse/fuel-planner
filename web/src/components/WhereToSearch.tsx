import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Loader2, Search, SlidersHorizontal } from 'lucide-react'
import { useTripStore } from '../store/tripStore'
import { useTripCalculation } from '../hooks/useTripCalculation'

/** Home-screen shortcut: type a destination and jump straight to the trip result. */
export function WhereToSearch() {
  const origin = useTripStore((s) => s.draft.origin)
  const setDraft = useTripStore((s) => s.setDraft)
  const { vehicle, calculate, isPending, isError } = useTripCalculation()
  const [destination, setDestination] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const dest = destination.trim()
    if (!dest) return
    setDraft({ destination: dest })
    calculate({ destination: dest })
  }

  return (
    <div>
      <form onSubmit={submit} className="card-surface flex items-center gap-2 p-2 pl-4" role="search">
        <Search className="h-5 w-5 shrink-0 text-brand-800" strokeWidth={2.4} />
        <label className="min-w-0 flex-1">
          <span className="sr-only">Destination</span>
          <input
            className="w-full border-0 bg-transparent py-2 text-base font-semibold text-ink outline-none placeholder:font-medium placeholder:text-slate-400"
            placeholder="Where to?"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            enterKeyHint="go"
          />
          <span className="block truncate text-xs text-muted">From {origin}</span>
        </label>
        <Link to="/app/plan" className="icon-btn h-10 w-10 shrink-0" aria-label="More trip options">
          <SlidersHorizontal className="h-4 w-4 text-ink" />
        </Link>
        <button
          type="submit"
          disabled={!vehicle || !destination.trim() || isPending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-800 text-white shadow-sm transition disabled:opacity-40"
          aria-label="Calculate trip"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        </button>
      </form>
      {isError && (
        <p className="mt-2 px-1 text-sm font-medium text-red-700" role="alert">
          We couldn&apos;t calculate that route. Check the destination and try again.
        </p>
      )}
    </div>
  )
}
