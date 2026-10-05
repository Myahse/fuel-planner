import { MapPin } from 'lucide-react'

type Props = {
  active: boolean
  onToggle: () => void
  hint?: string
  className?: string
}

export function MapPinToggle({ active, onToggle, hint = 'Tap the map to set destination', className = '' }: Props) {
  return (
    <button
      type="button"
      className={`icon-btn absolute z-[1000] h-11 w-11 bg-panel/95 shadow-md backdrop-blur-sm ${
        active ? 'border-signal text-signal' : ''
      } ${className}`}
      aria-label={active ? 'Cancel pin mode' : 'Set location on map'}
      aria-pressed={active}
      title={active ? `${hint} · click to cancel` : hint}
      onClick={onToggle}
    >
      <MapPin className="h-5 w-5" strokeWidth={2.2} />
    </button>
  )
}
