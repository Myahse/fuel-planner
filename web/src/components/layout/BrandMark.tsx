import { PRODUCT } from '../../config/product'

/** Wordmark: the name in condensed caps beside a lit amber lamp — the fuel light that never comes on. */
export function BrandMark({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className={`lamp text-signal ${size === 'lg' ? '!h-2.5 !w-2.5' : ''}`} aria-hidden />
      <span className={`title tracking-[0.12em] text-fg ${size === 'lg' ? 'text-2xl' : 'text-lg'}`}>{PRODUCT.name}</span>
    </span>
  )
}
