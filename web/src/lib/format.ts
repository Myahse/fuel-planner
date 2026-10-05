export function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

export function formatFcfa(amount: number) {
  return `${Math.round(amount).toLocaleString('en-US')} FCFA`
}

export function formatLiters(n: number, digits = 1) {
  return `${n.toFixed(digits)} L`
}

export function formatKm(n: number) {
  return `${Math.round(n).toLocaleString('en-US')} km`
}

export function formatConsumption(n: number) {
  return `${n.toFixed(1)} L/100 km`
}

export function formatPercent(n: number) {
  return `${Math.round(n)}%`
}

export function formatPricePerLiter(n: number) {
  return `${Math.round(n).toLocaleString('en-US')} FCFA/L`
}

/** "Yamoussoukro, Lacs, Côte d'Ivoire" → "Yamoussoukro" — geocoded labels are long; titles want the place. */
export function shortPlace(label: string) {
  return label.split(',')[0].trim() || label
}
