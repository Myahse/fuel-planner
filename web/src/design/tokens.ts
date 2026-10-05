export const colors = {
  primary: '#166534',
  primaryHover: '#15803D',
  accent: '#22C55E',
  ink: '#111827',
  muted: '#6B7280',
  surface: '#F8FAF8',
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#DC2626',
  info: '#2563EB',
  white: '#FFFFFF',
} as const

export const radius = {
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.75rem',
} as const

export const shadow = {
  card: '0 1px 3px rgba(17, 24, 39, 0.06), 0 8px 24px rgba(17, 24, 39, 0.04)',
  float: '0 4px 20px rgba(17, 24, 39, 0.12)',
} as const

export const fuelStatusThresholds = {
  safeMinPercent: 20,
  lowMinPercent: 10,
} as const
