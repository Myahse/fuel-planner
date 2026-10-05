/** JS mirror of the CSS tokens in index.css — for canvas, SVG and map code that can't read CSS vars. */
export const darkColors = {
  bg: '#100c08',
  panel: '#19130d',
  panel2: '#221a12',
  line: '#2e241a',
  lineStrong: '#4a3a2a',
  fg: '#fff6e6',
  fg2: '#d2c4b0',
  fg3: '#9a8b78',
  signal: '#ffa21f',
  ok: '#8fe3a8',
  warn: '#ff8a1f',
  danger: '#ff5a4e',
} as const

export const lightColors = {
  bg: '#f6f2eb',
  panel: '#ffffff',
  panel2: '#faf7f2',
  line: '#e3dcd0',
  lineStrong: '#c9bfae',
  fg: '#1a140e',
  fg2: '#4a4034',
  fg3: '#7a6f62',
  signal: '#e88a00',
  ok: '#2d9d5a',
  warn: '#d96a00',
  danger: '#d93a30',
} as const

export type ThemeColors = {
  bg: string
  panel: string
  panel2: string
  line: string
  lineStrong: string
  fg: string
  fg2: string
  fg3: string
  signal: string
  ok: string
  warn: string
  danger: string
}

export const colors: ThemeColors = darkColors

export function themeColors(theme: 'light' | 'dark'): ThemeColors {
  return theme === 'light' ? lightColors : darkColors
}

/** Liquid colour ramps (surface, middle, bottom) by trip status. */
export const fuelPalettes = {
  ok: ['#ffd27a', '#ffa21f', '#c25a00'],
  low: ['#ffc04d', '#ff7a1a', '#a33a00'],
  out: ['#ff7a6b', '#e2262b', '#6e0a0e'],
} as const

export const fuelStatusThresholds = {
  safeMinPercent: 20,
  lowMinPercent: 10,
} as const
