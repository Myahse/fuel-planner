import { motion } from 'framer-motion'

type Props = {
  percent: number
  lowThreshold?: number
  className?: string
}

export function ProgressBar({ percent, lowThreshold = 20, className = '' }: Props) {
  const clamped = Math.min(100, Math.max(0, percent))
  const color =
    clamped <= lowThreshold ? 'bg-amber-500' : clamped <= lowThreshold * 1.5 ? 'bg-brand-500' : 'bg-brand-700'

  return (
    <div className={`h-2.5 w-full overflow-hidden rounded-full bg-slate-200 ${className}`}>
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={false}
        animate={{ width: `${clamped}%` }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />
    </div>
  )
}
