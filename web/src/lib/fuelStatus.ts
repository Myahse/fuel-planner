import { fuelStatusThresholds } from '../design/tokens'

export type FuelStatusLevel = 'safe' | 'low' | 'critical' | 'insufficient'

export type FuelStatus = {
  level: FuelStatusLevel
  label: string
  emoji: string
  tone: 'success' | 'warning' | 'danger'
}

export function fuelLevelStatus(percentRemaining: number, litersRemaining?: number): FuelStatus {
  if (litersRemaining != null && litersRemaining < 0) {
    return { level: 'insufficient', label: 'Not enough fuel', emoji: '🔴', tone: 'danger' }
  }
  if (percentRemaining < fuelStatusThresholds.lowMinPercent) {
    return { level: 'critical', label: 'Very low fuel', emoji: '🔴', tone: 'danger' }
  }
  if (percentRemaining < fuelStatusThresholds.safeMinPercent) {
    return { level: 'low', label: 'Low fuel', emoji: '🟠', tone: 'warning' }
  }
  return { level: 'safe', label: 'Enough fuel', emoji: '🟢', tone: 'success' }
}

export function tripFeasibilityStatus(
  startingLiters: number,
  requiredLiters: number,
): 'enough' | 'low' | 'insufficient' {
  const remaining = startingLiters - requiredLiters
  if (remaining < 0) return 'insufficient'
  const endPct = (remaining / (startingLiters || 1)) * 100
  if (endPct < fuelStatusThresholds.lowMinPercent) return 'insufficient'
  if (endPct < fuelStatusThresholds.safeMinPercent) return 'low'
  return 'enough'
}
