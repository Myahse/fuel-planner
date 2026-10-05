import { useEffect, useState } from 'react'
import { useAppStore } from '../store/appStore'

export type ResolvedTheme = 'light' | 'dark'

function resolve(pref: 'system' | 'light' | 'dark'): ResolvedTheme {
  if (pref === 'light') return 'light'
  if (pref === 'dark') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** App theme preference resolved to light or dark (includes system). */
export function useResolvedTheme(): ResolvedTheme {
  const pref = useAppStore((s) => s.theme)
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolve(pref))

  useEffect(() => {
    const apply = () => setResolved(resolve(pref))
    apply()
    if (pref !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [pref])

  return resolved
}
