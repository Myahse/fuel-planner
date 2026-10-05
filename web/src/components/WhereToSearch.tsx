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
      <form onSubmit={submit} role="search" className="flex items-center gap-2 rounded-full bg-teal py-2 pl-6 pr-2 text-digit shadow-[0_4px_0_#123f3c]">
        <label className="min-w-0 flex-1">
          <span className="block text-xs font-medium opacity-75">From {shortPlace(origin)}</span>
          <PlaceField
            className="w-full bg-transparent font-[family-name:var(--font-display)] text-lg text-digit outline-none placeholder:text-digit/80 focus-visible:outline-none"
            placeholder="Where to today?"
            value={destination}
            onChange={setDestination}
            enterKeyHint="go"
            aria-label="Destination"
          />
        </label>
        <Link to="/app/plan" className="flex h-11 w-11 items-center justify-center rounded-full text-digit/80 hover:bg-teal-hi" aria-label="More trip options">
          <SlidersHorizontal className="h-5 w-5" />
        </Link>
        <button
          type="submit"
          disabled={!vehicle || !destination.trim() || isPending}
          className="flex h-12 w-12 items-center justify-center rounded-full border-[2.5px] border-espresso bg-mustard text-espresso transition disabled:border-digit/30 disabled:bg-teal-hi disabled:text-digit/60"
          aria-label="Calculate trip"
        >
          {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" strokeWidth={2.8} />}
        </button>
      </form>
      {isError && (
        <p className="mt-2 px-2 text-sm font-bold text-danger" role="alert">
          Couldn&apos;t calculate that route. Check the destination and try again.
        </p>
      )}
    </div>
  )
}
