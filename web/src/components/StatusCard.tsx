import type { TripAssessment } from '../api/types'
import type { FuelStatus } from '../lib/fuelStatus'

type TripStatus = 'enough' | 'low' | 'insufficient'

const tripMap: Record<TripStatus, { title: string; body: string; className: string; emoji: string }> = {
  enough: {
    emoji: '🟢',
    title: 'This trip is possible.',
    body: 'You should arrive with comfortable fuel remaining.',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  },
  low: {
    emoji: '🟠',
    title: "You can make it, but you'll arrive with low fuel.",
    body: 'Consider refueling along the route.',
    className: 'border-amber-200 bg-amber-50 text-amber-950',
  },
  insufficient: {
    emoji: '🔴',
    title: "Not enough fuel",
    body: 'You need more fuel to complete this trip safely.',
    className: 'border-red-200 bg-red-50 text-red-950',
  },
}

export function TripStatusCard({ status, shortageLiters }: { status: TripStatus; shortageLiters?: number }) {
  const m = tripMap[status]
  return (
    <div className={`rounded-2xl border px-4 py-4 ${m.className}`}>
      <p className="text-lg font-semibold">{m.emoji} {m.title}</p>
      <p className="mt-1 text-sm opacity-90">
        {status === 'insufficient' && shortageLiters != null
          ? `You need approximately ${shortageLiters.toFixed(1)} L more to complete this trip.`
          : m.body}
      </p>
    </div>
  )
}

export function FuelStatusCard({ status }: { status: FuelStatus }) {
  const tone =
    status.tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
      : status.tone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-950'
        : 'border-red-200 bg-red-50 text-red-950'
  return (
    <div className={`rounded-2xl border px-4 py-3 ${tone}`}>
      <p className="font-semibold">{status.emoji} {status.label}</p>
    </div>
  )
}

const verdictTone: Record<TripStatus, string> = {
  enough: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  low: 'border-amber-200 bg-amber-50 text-amber-950',
  insufficient: 'border-red-200 bg-red-50 text-red-950',
}

/** The answer to "can I make it?", shown before any other trip detail. */
export function TripVerdict({ assessment }: { assessment: TripAssessment }) {
  const { status } = assessment
  const left = Math.max(0, assessment.remaining_fuel)
  const headline =
    status === 'enough' ? "You'll make it" : status === 'low' ? "You'll make it — just" : "You won't make it on this tank"
  const detail =
    status === 'insufficient'
      ? `You need about ${(assessment.shortage_liters ?? -assessment.remaining_fuel).toFixed(1)} L more${
          assessment.recommended_refuel ? ` — add ${Math.round(assessment.recommended_refuel)} L to be safe` : ''
        }.`
      : `About ${left.toFixed(1)} L left on arrival (~${Math.round(Math.max(0, assessment.remaining_range_km))} km to spare).`

  return (
    <div className={`rounded-3xl border px-5 py-4 ${verdictTone[status]}`} role="status">
      <p className="text-xl font-bold leading-tight">
        {tripMap[status].emoji} {headline}
      </p>
      <p className="mt-1 text-sm opacity-90">{detail}</p>
    </div>
  )
}
