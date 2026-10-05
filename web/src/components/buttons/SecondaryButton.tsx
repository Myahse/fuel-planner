import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  fullWidth?: boolean
  size?: 'md' | 'lg'
}

export function SecondaryButton({ children, className = '', fullWidth, size = 'lg', ...props }: Props) {
  return (
    <button
      className={`btn btn-ghost ${size === 'md' ? 'btn-sm' : ''} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
