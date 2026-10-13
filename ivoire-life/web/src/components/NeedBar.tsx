import { moodColor } from '../game/rules'

// `responsive` drops the label on small screens to keep the HUD tight.
export function NeedBar({ label, icon, value, compact = false, responsive = false }: { label: string; icon: string; value: number; compact?: boolean; responsive?: boolean }) {
  const color = moodColor(value)
  return (
    <div className="flex items-center gap-2">
      <span className={compact ? 'text-base' : 'text-lg'} aria-hidden>
        {icon}
      </span>
      <div className="flex-1">
        {!compact && <div className={`mb-0.5 text-xs font-extrabold tracking-wide uppercase opacity-80 ${responsive ? 'max-lg:hidden' : ''}`}>{label}</div>}
        <div className="h-3 overflow-hidden rounded-full bg-black/25 ring-1 ring-white/10" title={`${label} : ${Math.round(value)}`}>
          <div
            className="h-full rounded-full transition-[width] duration-700"
            style={{ width: `${value}%`, background: `linear-gradient(180deg, ${color}, ${color}cc)` }}
          />
        </div>
      </div>
    </div>
  )
}
