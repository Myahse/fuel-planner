import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  fullWidth?: boolean
  size?: 'md' | 'lg'
}

export function PrimaryButton({
  children,
  className = '',
  fullWidth,
  size = 'lg',
  ...props
}: Props) {
  const sizeClass = size === 'lg' ? 'px-5 py-3.5 text-base' : 'px-4 py-2.5 text-sm'
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-brand-700 to-brand-800 font-semibold text-white shadow-md shadow-brand-900/15 transition hover:from-brand-600 hover:to-brand-700 hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:shadow-none ${sizeClass} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
