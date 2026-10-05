import { useEffect } from 'react'
import { useResolvedTheme } from '../hooks/useResolvedTheme'

/** Applies `data-theme` on `<html>` for CSS tokens and map engines. */
export function ThemeSync() {
  const theme = useResolvedTheme()
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
  }, [theme])
  return null
}
