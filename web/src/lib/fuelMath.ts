export function litersFromPercent(tankLiters: number, percent: number) {
  return (tankLiters * percent) / 100
}

export function percentFromLiters(tankLiters: number, liters: number) {
  if (tankLiters <= 0) return 0
  return Math.min(100, Math.max(0, (liters / tankLiters) * 100))
}

export function estimatedRangeKm(liters: number, consumptionLPer100Km: number) {
  if (consumptionLPer100Km <= 0) return 0
  return (liters / consumptionLPer100Km) * 100
}

export function fuelRequiredLiters(distanceKm: number, consumptionLPer100Km: number) {
  return (distanceKm / 100) * consumptionLPer100Km
}

export function barsFilled(totalBars: number, percent: number) {
  return Math.min(totalBars, Math.max(0, Math.round((percent / 100) * totalBars)))
}

export function percentFromBarIndex(totalBars: number, index: number) {
  return Math.min(100, Math.max(0, Math.round(((index + 1) / totalBars) * 100)))
}
