import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useTripCalculation } from '../hooks/useTripCalculation'
import { useTripStore } from '../store/tripStore'
import { PageHeader } from '../components/layout/PageHeader'
import { TripInput } from '../components/TripInput'
import { TravelPreferenceSelector, TripTypeSelector } from '../components/TripTypeSelector'
import { PrimaryButton } from '../components/buttons/PrimaryButton'
import { SectionLabel, SpecList } from '../components/ui'

export function PlanTripPage() {
  const { draft, setDraft } = useTripStore()
  const { vehicle, fuelPricePerLiter, calculate, isPending, isError } = useTripCalculation()

  const fuelLiters = vehicle?.estimated_fuel_liters ?? 30

  return (
    <div className="space-y-7">
      <PageHeader title="Plan a trip" backTo="/app" />

      <TripInput
        origin={draft.origin}
        destination={draft.destination}
        onOriginChange={(v) => setDraft({ origin: v })}
        onDestinationChange={(v) => setDraft({ destination: v })}
        onSwap={() => setDraft({ origin: draft.destination, destination: draft.origin })}
      />

      <div>
        <SectionLabel>Trip</SectionLabel>
        <TripTypeSelector
          value={draft.trip_type}
          onChange={(v) => setDraft({ trip_type: v, includeReturn: v === 'round_trip' })}
        />
      </div>

      <div>
        <SectionLabel>Route</SectionLabel>
        <TravelPreferenceSelector value={draft.preference} onChange={(v) => setDraft({ preference: v })} />
      </div>

      <section>
        <div className="mb-1 flex items-baseline justify-between">
          <SectionLabel>Calculated with</SectionLabel>
          <Link to="/app/fuel/level" className="text-sm font-medium text-signal hover:text-signal-hi">
            Update fuel
          </Link>
        </div>
        <div className="border-y border-line">
          <SpecList
            rows={[
              ['Vehicle', vehicle ? `${vehicle.make} ${vehicle.model}` : '—'],
              ['In the tank', `${fuelLiters.toFixed(1)} L`],
              ['Consumption', `${(vehicle?.mixed_consumption ?? 7.5).toFixed(1)} L/100 km`],
              ['Fuel price', `${Math.round(fuelPricePerLiter).toLocaleString('en-US')} FCFA/L`],
            ]}
          />
        </div>
      </section>

      {isError && (
        <p className="flex items-center gap-2.5 text-sm text-fg-2" role="alert">
          <span className="lamp text-danger" aria-hidden />
          We couldn&apos;t calculate that route. Check the destination and try again.
        </p>
      )}

      <div className="sticky bottom-[84px] z-10 -mx-4 bg-gradient-to-t from-bg via-bg to-transparent px-4 pb-2 pt-6 lg:bottom-6 lg:mx-0 lg:px-0">
        <PrimaryButton fullWidth disabled={!vehicle || isPending} onClick={() => calculate()}>
          {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Can I make it?'}
        </PrimaryButton>
      </div>
    </div>
  )
}
