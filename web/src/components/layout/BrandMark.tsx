import { useId } from 'react'
import { PRODUCT } from '../../config/product'
import { fuelPalettes } from '../../design/tokens'

/** Wordmark: the name in wide Unbounded with a glowing fuel drop. */
export function BrandMark({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const gradientId = `brand-drop-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  return (
    <span className="inline-flex items-center gap-2">
      <svg viewBox="0 0 16 20" className={size === 'lg' ? 'h-6 w-5' : 'h-[18px] w-[14px]'} aria-hidden>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={fuelPalettes.ok[0]} />
            <stop offset="1" stopColor={fuelPalettes.ok[1]} />
          </linearGradient>
        </defs>
        <path d="M8 0C8 0 0 9 0 13.5A8 8 0 0 0 16 13.5C16 9 8 0 8 0Z" fill={`url(#${gradientId})`} />
      </svg>
      <span className={`font-[family-name:var(--font-display)] font-extrabold tracking-[0.08em] text-fg ${size === 'lg' ? 'text-2xl' : 'text-[15px]'}`}>
        {PRODUCT.name}
      </span>
    </span>
  )
}
