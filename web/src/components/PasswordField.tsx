import { useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

export function PasswordField({ className = '', ...props }: Props) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input {...props} type={visible ? 'text' : 'password'} className={`field pr-12 ${className}`.trim()} />
      <button
        type="button"
        className="icon-btn absolute right-2 top-1/2 h-9 w-9 -translate-y-1/2"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
      >
        {visible ? <EyeOff className="h-4 w-4" strokeWidth={2.2} /> : <Eye className="h-4 w-4" strokeWidth={2.2} />}
      </button>
    </div>
  )
}
