import { PRODUCT } from '../../config/product'

/** Wordmark: the name in Bungee over red–orange–mustard racing stripes, like a forecourt sign. */
export function BrandMark({ size = 'md', stripes = true }: { size?: 'md' | 'lg'; stripes?: boolean }) {
  return (
    <span className="relative inline-flex items-center">
      {stripes && <span className="stripes absolute -left-6 right-[-14px] top-1/2 h-4 -translate-y-1/2" aria-hidden />}
      <span className={`title relative bg-bg px-1.5 text-fg ${size === 'lg' ? 'text-4xl' : 'text-[1.6rem]'}`}>{PRODUCT.name}</span>
    </span>
  )
}
