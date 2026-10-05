/** JS mirror of the CSS tokens in index.css — for canvas, SVG and map code that can't read CSS vars. */
export const colors = {
  bg: '#0a0b0d',
  panel: '#111215',
  panel2: '#17191d',
  line: '#23252a',
  lineStrong: '#33363d',
  fg: '#ecedef',
  fg2: '#a4a8b0',
  fg3: '#6b7079',
  signal: '#ffb020',
  ok: '#5ad48a',
  warn: '#ffb020',
  danger: '#ff5a4e',
} as const

export const fuelStatusThresholds = {
  safeMinPercent: 20,
  lowMinPercent: 10,
} as const
