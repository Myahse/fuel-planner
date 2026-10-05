import { useTripCalculation } from '../hooks/useTripCalculation'
import { useTripStore } from '../store/tripStore'
import { PageHeader } from '../components/layout/PageHeader'
import { TripInput } from '../components/TripInput'
import { TravelPreferenceSelector, TripTypeSelector } from '../components/TripTypeSelector'
import { PrimaryButton } from '../components/buttons/PrimaryButton'
import { Card, ToggleRow } from '../components/ui'
import { formatLiters, formatPricePerLiter } from '../lib/format'

export function PlanTripPage() {
  const { draft, setDraft } = useTripStore()
  const { vehicle, fuelPricePerLiter, calculate, isPending, isError } = useTripCalculation()

  const fuelLiters = vehicle?.estimated_fuel_liters ?? 30

  return (
    <div className="space-y-6">
      <PageHeader title="Plan a Trip" backTo="/app" />

      <Card className="space-y-5">
        <TripInput
          origin={draft.origin}
          destination={draft.destination}
          onOriginChange={(v) => setDraft({ origin: v })}
          onDestinationChange={(v) => setDraft({ destination: v })}
          onSwap={() =>
            setDraft({ origin: draft.destination, destination: draft.origin })
          }
        />

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Trip type</p>
          <TripTypeSelector value={draft.trip_type} onChange={(v) => setDraft({ trip_type: v })} />
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Travel preferences</p>
          <TravelPreferenceSelector
            value={draft.preference}
            onChange={(v) => setDraft({ preference: v })}
          />
        </div>

        <ToggleRow
          label="Include return to starting point"
          checked={draft.includeReturn}
          onChange={(v) => setDraft({ includeReturn: v, trip_type: v ? 'round_trip' : draft.trip_type })}
        />
      </Card>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Fuel information</p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
          <div>
            <p className="text-muted">Current fuel</p>
            <p className="font-bold">{formatLiters(fuelLiters)}</p>
          </div>
          <div>
            <p className="text-muted">Consumption</p>
            <p className="font-bold">{vehicle?.mixed_consumption ?? 7.5} L/100 km</p>
          </div>
          <div>
            <p className="text-muted">Fuel price</p>
            <p className="font-bold">{formatPricePerLiter(fuelPricePerLiter)}</p>
          </div>
        </div>
      </Card>

      {isError && (
        <Card>
          <p className="font-semibold text-red-700">We couldn&apos;t calculate your route.</p>
          <p className="mt-1 text-sm text-muted">Check your destination and try again.</p>
          <PrimaryButton className="mt-4" onClick={() => calculate()}>Retry</PrimaryButton>
        </Card>
      )}

      <PrimaryButton
        fullWidth
        disabled={!vehicle || isPending}
        onClick={() => calculate()}
      >
        Show Results →
      </PrimaryButton>
    </div>
  )
}
