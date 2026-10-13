// The floating losange above a Sim — green when happy, red when in need.
export function Plumbob({ color = '#00b36b', size = 28, className = '' }: { color?: string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size * 1.6} viewBox="0 0 40 64" className={`animate-float drop-shadow-lg ${className}`} aria-hidden>
      <path d="M20 0 40 32 20 64 0 32Z" fill={color} />
      <path d="M20 0 40 32H20Z" fill="#fff" opacity="0.35" />
      <path d="M0 32h20v32Z" fill="#000" opacity="0.18" />
      <path d="M20 0 0 32h20Z" fill="#fff" opacity="0.12" />
    </svg>
  )
}
