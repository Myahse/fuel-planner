/** JS mirror of the CSS tokens in index.css — for canvas, SVG and map code that can't read CSS vars. */
export const colors = {
  bg: '#f6ead2',
  panel: '#fff8ea',
  panel2: '#f3e3c5',
  line: '#e3cfac',
  lineStrong: '#2b1d14',
  fg: '#2b1d14',
  fg2: '#5c4636',
  fg3: '#8a735f',
  signal: '#e2462b',
  ok: '#1d6b67',
  warn: '#e59a1a',
  danger: '#b3261e',
  mustard: '#f2b33d',
  teal: '#1d6b67',
  espresso: '#2b1d14',
} as const

export const fuelStatusThresholds = {
  safeMinPercent: 20,
  lowMinPercent: 10,
} as const
