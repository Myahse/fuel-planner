import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  fullWidth?: boolean
}

export function SecondaryButton({ children, className = '', fullWidth, ...props }: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-base font-semibold text-brand-800 shadow-sm transition hover:border-brand-200 hover:bg-brand-50/80 active:scale-[0.98] disabled:opacity-50 ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
