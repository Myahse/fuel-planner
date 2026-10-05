import { motion } from 'framer-motion'

type Props = {
  percent: number
  lowThreshold?: number
  className?: string
}

/** Thin segmented level bar — reads like a cluster bar graph, not a web progress bar. */
export function ProgressBar({ percent, lowThreshold = 20, className = '' }: Props) {
  const clamped = Math.min(100, Math.max(0, percent))
  const color = clamped <= lowThreshold ? 'bg-danger' : 'bg-signal'

  return (
    <div className={`relative h-1.5 w-full overflow-hidden rounded-xs bg-line-strong ${className}`}>
      <motion.div
        className={`h-full ${color}`}
        initial={false}
        animate={{ width: `${clamped}%` }}
        transition={{ type: 'spring', stiffness: 260, damping: 32 }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent 0 calc(10% - 2px), var(--color-bg) calc(10% - 2px) 10%)' }}
        aria-hidden
      />
    </div>
  )
}
