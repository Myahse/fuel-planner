import type { TripAssessment } from '../api/types'
import type { FuelStatus } from '../lib/fuelStatus'

type TripStatus = 'enough' | 'low' | 'insufficient'

const tone: Record<TripStatus, { lamp: string; border: string; headline: string }> = {
  enough: { lamp: 'text-ok', border: 'border-ok/40', headline: "You'll make it" },
  low: { lamp: 'text-warn', border: 'border-warn/50', headline: "You'll make it, just" },
  insufficient: { lamp: 'text-danger', border: 'border-danger/50', headline: "Not on this tank" },
}

/** The answer to "can I make it?", shown before any other trip detail. */
export function TripVerdict({ assessment }: { assessment: TripAssessment }) {
  const { status } = assessment
  const t = tone[status]
  const left = Math.max(0, assessment.remaining_fuel)
  const short = assessment.shortage_liters ?? -assessment.remaining_fuel

  return (
    <div className={`border-l-2 ${t.border} py-1 pl-4`} role="status">
      <p className="flex items-center gap-3">
        <span className={`lamp ${t.lamp}`} aria-hidden />
        <span className="title text-[2.5rem] text-fg">{t.headline}</span>
      </p>
      <p className="mt-2 text-base text-fg-2">
        {status === 'insufficient' ? (
          <>
            You&apos;re about <strong className="text-fg">{short.toFixed(1)} L</strong> short
            {assessment.recommended_refuel ? (
              <>
                {' '}— add <strong className="text-fg">{Math.round(assessment.recommended_refuel)} L</strong> to arrive safely
              </>
            ) : null}
            .
          </>
        ) : (
          <>
            You arrive with <strong className="text-fg">{left.toFixed(1)} L</strong>, about{' '}
            {Math.round(Math.max(0, assessment.remaining_range_km))} km to spare.
          </>
        )}
      </p>
    </div>
  )
}

/** Compact version for the confirm screen. */
export function TripStatusCard({ status, shortageLiters }: { status: TripStatus; shortageLiters?: number }) {
  const t = tone[status]
  return (
    <p className="flex items-center gap-2.5 text-sm text-fg-2">
      <span className={`lamp ${t.lamp}`} aria-hidden />
      <span className="font-semibold text-fg">{t.headline}</span>
      {status === 'insufficient' && shortageLiters != null && <span>· {shortageLiters.toFixed(1)} L short</span>}
    </p>
  )
}

export function FuelStatusCard({ status }: { status: FuelStatus }) {
  const lamp = status.tone === 'success' ? 'text-ok' : status.tone === 'warning' ? 'text-warn' : 'text-danger'
  return (
    <p className="flex items-center gap-2.5 text-sm font-medium text-fg">
      <span className={`lamp ${lamp}`} aria-hidden />
      {status.label}
    </p>
  )
}
