import type { MapMarker } from '../components/map/types'
import type { TripRoute } from '../hooks/useTripRoute'
import type { MapPinTarget } from './mapPin'
import type { TripPlanDraft } from '../store/tripStore'

type Args = {
  draft: TripPlanDraft
  trip: TripRoute
  userCenter: { lat: number; lng: number }
  mapPinTarget: MapPinTarget
  mapPinMode: boolean
}

/** Markers for the plan-trip map (start, numbered stops, end). */
export function planTripMapMarkers({
  draft,
  trip,
  userCenter,
  mapPinTarget,
  mapPinMode,
}: Args): MapMarker[] {
  const planOrigin =
    draft.origin_lat != null && draft.origin_lng != null
      ? { lat: draft.origin_lat, lng: draft.origin_lng }
      : trip.origin
  const dest =
    draft.destination_lat != null && draft.destination_lng != null
      ? { lat: draft.destination_lat, lng: draft.destination_lng }
      : trip.destination

  const markers: MapMarker[] = [
    { id: 'me', lat: userCenter.lat, lng: userCenter.lng, variant: 'user', label: 'You' },
  ]

  if (draft.origin.trim() || draft.origin_lat != null) {
    markers.push({
      id: 'o',
      lat: planOrigin.lat,
      lng: planOrigin.lng,
      variant: 'origin',
      label: draft.origin || 'Start',
    })
  }

  if (draft.trip_type === 'multi_stop') {
    draft.waypoints.forEach((w, i) => {
      if (w.lat == null || w.lng == null) return
      const picking = mapPinMode && mapPinTarget.kind === 'waypoint' && mapPinTarget.id === w.id
      markers.push({
        id: w.id,
        lat: w.lat,
        lng: w.lng,
        variant: 'waypoint',
        label: w.label || `Stop ${i + 1}`,
        stopIndex: i + 1,
        selected: picking,
      })
    })
  }

  if (draft.destination.trim() || (draft.destination_lat != null && draft.destination_lng != null)) {
    markers.push({
      id: 'd',
      lat: dest.lat,
      lng: dest.lng,
      variant: 'destination',
      label: draft.destination || 'Destination',
    })
  }

  return markers
}

export function planTripMapHasContent(draft: TripPlanDraft): boolean {
  const hasWaypoint = draft.waypoints.some((w) => w.lat != null && w.lng != null)
  return (
    Boolean(draft.origin.trim() || draft.origin_lat != null) ||
    Boolean(draft.destination.trim() || (draft.destination_lat != null && draft.destination_lng != null)) ||
    hasWaypoint
  )
}
