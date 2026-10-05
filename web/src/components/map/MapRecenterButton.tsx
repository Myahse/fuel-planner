import { Loader2, LocateFixed } from 'lucide-react'

type Props = {
  onClick: () => void
  loading?: boolean
  className?: string
}

export function MapRecenterButton({ onClick, loading, className = '' }: Props) {
  return (
    <button
      type="button"
      className={`icon-btn absolute bottom-4 right-4 z-[1000] h-11 w-11 bg-panel/95 shadow-md backdrop-blur-sm ${className}`}
      aria-label="Recenter on my position"
      title="Recenter on my position"
      disabled={loading}
      onClick={onClick}
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LocateFixed className="h-5 w-5" strokeWidth={2.2} />}
    </button>
  )
}
