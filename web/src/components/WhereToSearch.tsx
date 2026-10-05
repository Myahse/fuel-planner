import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Loader2, Search, SlidersHorizontal } from 'lucide-react'
import { useTripStore } from '../store/tripStore'
import { useTripCalculation } from '../hooks/useTripCalculation'
import { PlaceField } from './PlaceField'
import { shortPlace } from '../lib/format'

/** Frosted search floating over the tank: type a destination and jump straight to the trip result. */
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
      <form onSubmit={submit} role="search" className="glass flex items-center gap-3 !rounded-[22px] py-2 pl-4 pr-2">
        <Search className="h-5 w-5 shrink-0 text-fg-3" strokeWidth={2.2} />
        <label className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold text-fg-3">From {shortPlace(origin)}</span>
          <PlaceField
            className="w-full bg-transparent text-[17px] font-bold text-fg outline-none placeholder:text-fg focus-visible:outline-none"
            placeholder="Where are we going?"
            value={destination}
            onChange={setDestination}
            enterKeyHint="go"
            aria-label="Destination"
          />
        </label>
        <Link to="/app/plan" className="flex h-10 w-10 items-center justify-center rounded-full text-fg-3 hover:bg-fg/10 hover:text-fg" aria-label="More trip options">
          <SlidersHorizontal className="h-[18px] w-[18px]" />
        </Link>
        {destination.trim() && (
          <button type="submit" disabled={!vehicle || isPending} className="btn btn-primary !h-11 !w-11 !p-0" aria-label="Calculate trip">
            {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" strokeWidth={2.6} />}
          </button>
        )}
      </form>
      {isError && (
        <p className="mt-2 px-2 text-sm font-bold text-danger" role="alert">
          Couldn&apos;t calculate that route. Check the destination and try again.
        </p>
      )}
    </div>
  )
}
