import { type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Loader2, SlidersHorizontal } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { useTripStore } from '../store/tripStore'
import { useTripCalculation } from '../hooks/useTripCalculation'
import { PlaceField } from './PlaceField'
import { UseLocationButton } from './UseLocationButton'

function hasTripOrigin(draft: ReturnType<typeof useTripStore.getState>['draft'], userLocation: boolean) {
  return (
    Boolean(draft.origin.trim()) ||
    (draft.origin_lat != null && draft.origin_lng != null) ||
    userLocation
  )
}

/** Home trip search: from / to with device location as the default start when allowed. */
export function WhereToSearch() {
  const origin = useTripStore((s) => s.draft.origin)
  const destination = useTripStore((s) => s.draft.destination)
  const setDraft = useTripStore((s) => s.setDraft)
  const draft = useTripStore((s) => s.draft)
  const hasUserLoc = Boolean(useAppStore((s) => s.userLocation))
  const { vehicle, calculate, isPending, isError } = useTripCalculation()

  const canSubmit = Boolean(vehicle && destination.trim() && hasTripOrigin(draft, hasUserLoc))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    calculate()
  }

  return (
    <div>
      <form onSubmit={submit} role="search" className="glass flex flex-col gap-2 p-3">
        <div className="flex items-center gap-2 border-b border-fg/10 pb-2">
          <label className="flex min-w-0 flex-1 items-center gap-3">
            <span className="unit w-10 shrink-0">From</span>
            <PlaceField
              className="min-w-0 flex-1 bg-transparent text-base font-bold text-fg outline-none placeholder:text-fg-3 focus-visible:outline-none"
              placeholder="Starting point"
              value={origin}
              onChange={(v) => setDraft({ origin: v, origin_lat: undefined, origin_lng: undefined })}
              onPick={(p) => setDraft({ origin_lat: p.lat, origin_lng: p.lng })}
              enterKeyHint="next"
              aria-label="From"
            />
          </label>
          <UseLocationButton />
        </div>
        <label className="flex items-center gap-3">
          <span className="unit w-10 shrink-0">To</span>
          <PlaceField
            className="min-w-0 flex-1 bg-transparent text-base font-bold text-fg outline-none placeholder:text-fg-3 focus-visible:outline-none"
            placeholder="Where are you going?"
            value={destination}
            onChange={(v) => setDraft({ destination: v, destination_lat: undefined, destination_lng: undefined })}
            onPick={(p) => setDraft({ destination_lat: p.lat, destination_lng: p.lng })}
            enterKeyHint="go"
            aria-label="To"
          />
        </label>
        <div className="flex items-center justify-end gap-2 pt-1">
          <Link
            to="/app/plan"
            className="flex h-10 w-10 items-center justify-center rounded-sm text-fg-3 hover:bg-fg/10 hover:text-fg"
            aria-label="More trip options"
          >
            <SlidersHorizontal className="h-[18px] w-[18px]" />
          </Link>
          <button
            type="submit"
            disabled={!canSubmit || isPending}
            className="btn btn-primary !h-10 !min-w-[7.5rem] !px-4"
          >
            {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Plan <ArrowRight className="h-4 w-4" /></>}
          </button>
        </div>
      </form>
      {isError && (
        <p className="mt-2 px-2 text-sm font-bold text-danger" role="alert">
          Couldn&apos;t calculate that route. Check the places and try again.
        </p>
      )}
    </div>
  )
}
