import type { TripPlanDraft } from '../store/tripStore'

export type MapPinTarget =
  | { kind: 'origin' }
  | { kind: 'destination' }
  | { kind: 'waypoint'; id: string }

export const defaultMapPinTarget: MapPinTarget = { kind: 'destination' }

export function mapPinTargetsEqual(a: MapPinTarget, b: MapPinTarget): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === 'waypoint' && b.kind === 'waypoint') return a.id === b.id
  return true
}

export function mapPinHint(target: MapPinTarget, draft: TripPlanDraft): string {
  switch (target.kind) {
    case 'origin':
      return 'Tap the map to set start'
    case 'destination':
      return 'Tap the map to set destination'
    case 'waypoint': {
      const i = draft.waypoints.findIndex((w) => w.id === target.id)
      return i >= 0 ? `Tap the map to set stop ${i + 1}` : 'Tap the map to set this stop'
    }
  }
}
