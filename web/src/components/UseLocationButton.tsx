import { Loader2, LocateFixed } from 'lucide-react'
import { useUserLocation } from '../hooks/useUserLocation'

type Props = {
  onApplied?: () => void
  className?: string
  label?: string
}

export function UseLocationButton({ onApplied, className = '', label = 'Use my location' }: Props) {
  const { loading, error, applyToOrigin } = useUserLocation()

  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      <button
        type="button"
        className={`icon-btn h-9 w-9 shrink-0 ${className}`}
        aria-label={label}
        title={label}
        disabled={loading}
        onClick={() => {
          void applyToOrigin().then(() => onApplied?.())
        }}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" strokeWidth={2.2} />}
      </button>
      {error && <span className="max-w-[10rem] text-right text-[10px] font-semibold text-danger">{error}</span>}
    </span>
  )
}
