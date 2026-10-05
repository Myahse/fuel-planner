import { MapPin } from 'lucide-react'
import type { MapPinTarget } from '../lib/mapPin'
import { mapPinTargetsEqual } from '../lib/mapPin'
import { useTripStore } from '../store/tripStore'

type Props = {
  target: MapPinTarget
  label: string
  className?: string
}

/** Arms map pin mode for this field (start, stop, or destination). */
export function SetOnMapButton({ target, label, className = '' }: Props) {
  const mapPinMode = useTripStore((s) => s.mapPinMode)
  const mapPinTarget = useTripStore((s) => s.mapPinTarget)
  const beginMapPin = useTripStore((s) => s.beginMapPin)
  const active = mapPinMode && mapPinTargetsEqual(mapPinTarget, target)

  return (
    <button
      type="button"
      className={`icon-btn !h-8 !w-8 shrink-0 ${active ? 'border-signal text-signal' : ''} ${className}`}
      aria-label={label}
      aria-pressed={active}
      title={active ? 'Tap the map · click to cancel' : label}
      onClick={() => beginMapPin(target)}
    >
      <MapPin className="h-4 w-4" strokeWidth={2.2} />
    </button>
  )
}
