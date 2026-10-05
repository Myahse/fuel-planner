type Size = 'sm' | 'md' | 'lg'

const BOX: Record<Size, string> = {
  sm: 'h-11 w-8 text-[1.9rem] rounded-[6px]',
  md: 'h-14 w-10 text-[2.4rem] rounded-[7px]',
  lg: 'h-[76px] w-[52px] text-[3.6rem] rounded-[9px]',
}

/**
 * A reading drawn like a mechanical pump display: each digit on its own split flap.
 * Separators (".", ",", ":") sit between flaps without a box. Digits flip in when they change.
 */
export function FlipDigits({ value, size = 'md', label, className = '' }: { value: string; size?: Size; label?: string; className?: string }) {
  return (
    <span className={`inline-flex items-end gap-[5px] ${className}`} role="img" aria-label={label ?? value}>
      {[...value].map((ch, i) =>
        /[0-9]/.test(ch) ? (
          <span
            key={`${i}-${ch}`}
            aria-hidden
            className={`relative inline-flex items-center justify-center overflow-hidden bg-[linear-gradient(#1c1c1c_0_49%,#0d0d0d_51%)] font-[family-name:var(--font-digits)] font-bold leading-none text-digit shadow-[inset_0_0_0_2px_#3a2b20] [animation:flip-in_.35s_var(--ease-out-quint)_both] ${BOX[size]}`}
            style={{ animationDelay: `${i * 40}ms`, transformOrigin: '50% 50%' }}
          >
            {ch}
            <span className="pointer-events-none absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 bg-espresso" />
          </span>
        ) : (
          <span key={`${i}-${ch}`} aria-hidden className="pb-1 font-[family-name:var(--font-digits)] text-2xl font-bold leading-none text-digit">
            {ch}
          </span>
        ),
      )}
    </span>
  )
}
