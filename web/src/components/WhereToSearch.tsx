import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Loader2, SlidersHorizontal } from 'lucide-react'
import { useTripStore } from '../store/tripStore'
import { useTripCalculation } from '../hooks/useTripCalculation'
import { PlaceField } from './PlaceField'
import { shortPlace } from '../lib/format'

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
      <form onSubmit={submit} role="search" className="flex items-stretch rounded-sm border border-line-strong bg-panel transition focus-within:border-signal">
        <label className="flex min-w-0 flex-1 flex-col justify-center px-4 py-2.5">
          <span className="unit">from {shortPlace(origin).toLowerCase()} to</span>
          <PlaceField
            className="w-full bg-transparent text-xl font-semibold text-fg outline-none focus-visible:outline-none placeholder:text-fg-3"
            placeholder="Where to?"
            value={destination}
            onChange={setDestination}
            enterKeyHint="go"
            aria-label="Destination"
          />
        </label>
        <Link to="/app/plan" className="flex w-12 items-center justify-center border-l border-line text-fg-3 transition hover:text-fg" aria-label="More trip options">
          <SlidersHorizontal className="h-4 w-4" />
        </Link>
        <button
          type="submit"
          disabled={!vehicle || !destination.trim() || isPending}
          className="flex w-14 items-center justify-center bg-signal text-signal-ink transition hover:bg-signal-hi disabled:bg-panel-3 disabled:text-fg-3"
          aria-label="Calculate trip"
        >
          {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" strokeWidth={2.25} />}
        </button>
      </form>
      {isError && (
        <p className="mt-2 text-sm text-danger" role="alert">
          Couldn&apos;t calculate that route. Check the destination and try again.
        </p>
      )}
    </div>
  )
}
