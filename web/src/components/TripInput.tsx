import { ArrowDownUp, Plus, X } from 'lucide-react'
import { placeSuggestionLabel, type PlaceSuggestion } from '../hooks/usePlaceSuggestions'
import type { TripWaypoint } from '../store/tripStore'
import { newTripWaypoint } from '../store/tripStore'
import { PlaceField } from './PlaceField'
import { SetOnMapButton } from './SetOnMapButton'
import { UseLocationButton } from './UseLocationButton'

type Props = {
  origin: string
  destination: string
  waypoints?: TripWaypoint[]
  multiStop?: boolean
  onOriginChange: (v: string) => void
  onDestinationChange: (v: string) => void
  onOriginPick?: (place: PlaceSuggestion) => void
  onDestinationPick?: (place: PlaceSuggestion) => void
  onWaypointsChange?: (wps: TripWaypoint[]) => void
  onSwap: () => void
}

/** From/To as one route block; optional intermediate stops for multi-stop trips. */
export function TripInput({
  origin,
  destination,
  waypoints = [],
  multiStop = false,
  onOriginChange,
  onDestinationChange,
  onOriginPick,
  onDestinationPick,
  onWaypointsChange,
  onSwap,
}: Props) {
  const updateWaypoint = (id: string, patch: Partial<TripWaypoint>) => {
    onWaypointsChange?.(waypoints.map((w) => (w.id === id ? { ...w, ...patch } : w)))
  }

  const removeWaypoint = (id: string) => {
    onWaypointsChange?.(waypoints.filter((w) => w.id !== id))
  }

  const addWaypoint = () => {
    if (waypoints.length >= 5) return
    onWaypointsChange?.([...waypoints, newTripWaypoint()])
  }

  return (
    <div className="relative rounded-sm border border-line-strong bg-panel pr-12">
      <span className="absolute bottom-[18%] left-[19px] top-[18%] w-px bg-line-strong" aria-hidden />
      <label className="flex items-center gap-4 border-b border-line px-4 py-2.5 pr-2">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-fg" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="unit block">from</span>
          <PlaceField
            aria-label="From"
            className="w-full bg-transparent text-lg font-semibold text-fg outline-none focus-visible:outline-none"
            value={origin}
            onChange={onOriginChange}
            onPick={onOriginPick}
          />
        </span>
        <UseLocationButton className="!h-8 !w-8" />
        <SetOnMapButton target={{ kind: 'origin' }} label="Set start on map" />
      </label>

      {multiStop &&
        waypoints.map((wp, i) => (
          <label key={wp.id} className="flex items-center gap-4 border-b border-line px-4 py-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px] bg-signal/20 text-[10px] font-extrabold text-signal">
              {i + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="unit block">stop</span>
              <PlaceField
                aria-label={`Stop ${i + 1}`}
                className="w-full bg-transparent text-lg font-semibold text-fg outline-none focus-visible:outline-none"
                value={wp.label}
                onChange={(v) => updateWaypoint(wp.id, { label: v, lat: undefined, lng: undefined })}
                onPick={(p) =>
                  updateWaypoint(wp.id, { label: placeSuggestionLabel(p), lat: p.lat, lng: p.lng })
                }
              />
            </span>
            <SetOnMapButton target={{ kind: 'waypoint', id: wp.id }} label={`Set stop ${i + 1} on map`} />
            <button
              type="button"
              className="icon-btn !h-8 !w-8 shrink-0"
              aria-label={`Remove stop ${i + 1}`}
              onClick={() => removeWaypoint(wp.id)}
            >
              <X className="h-4 w-4" />
            </button>
          </label>
        ))}

      {multiStop && waypoints.length < 5 && (
        <button
          type="button"
          onClick={addWaypoint}
          className="flex w-full items-center justify-center gap-2 border-b border-line px-4 py-2.5 text-sm font-bold text-signal hover:bg-fg/5"
        >
          <Plus className="h-4 w-4" />
          Add a stop
        </button>
      )}

      <label className="flex items-center gap-4 px-4 py-2.5">
        <span className="h-2.5 w-2.5 shrink-0 rounded-[1px] bg-signal" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="unit block">to</span>
          <PlaceField
            aria-label="To"
            className="w-full bg-transparent text-lg font-semibold text-fg outline-none focus-visible:outline-none"
            value={destination}
            onChange={onDestinationChange}
            onPick={onDestinationPick}
          />
        </span>
        <SetOnMapButton target={{ kind: 'destination' }} label="Set destination on map" />
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
