import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useTripCalculation } from '../hooks/useTripCalculation'
import { useTripRoute } from '../hooks/useTripRoute'
import { useUserMapCenter } from '../hooks/useUserMapCenter'
import { useAppStore } from '../store/appStore'
import { placeSuggestionLabel } from '../hooks/usePlaceSuggestions'
import { planTripMapHasContent, planTripMapMarkers } from '../lib/planTripMapMarkers'
import { multiStopReadyForCalc } from '../lib/tripWaypoints'
import { newTripWaypoint, useTripStore } from '../store/tripStore'
import { MapView } from '../components/map/MapView'
import { PageHeader } from '../components/layout/PageHeader'
import { TripInput } from '../components/TripInput'
import { TravelPreferenceSelector, TripTypeSelector } from '../components/TripTypeSelector'
import { PrimaryButton } from '../components/buttons/PrimaryButton'
import { SectionLabel, SpecList } from '../components/ui'

export function PlanTripPage() {
  const { draft, setDraft, mapPinTarget, mapPinMode } = useTripStore()
  const trip = useTripRoute()
  const userCenter = useUserMapCenter()
  const hasUserLoc = Boolean(useAppStore((s) => s.userLocation))
  const planMarkers = useMemo(
    () => planTripMapMarkers({ draft, trip, userCenter, mapPinTarget, mapPinMode }),
    [draft, trip, userCenter, mapPinTarget, mapPinMode],
  )
  const { vehicle, fuelPricePerLiter, calculate, isPending, isError } = useTripCalculation()
  const hasOrigin =
    Boolean(draft.origin.trim()) || (draft.origin_lat != null && draft.origin_lng != null) || hasUserLoc
  const hasMultiStop =
    draft.trip_type !== 'multi_stop' || multiStopReadyForCalc(draft.waypoints)

  const fuelLiters = vehicle?.estimated_fuel_liters ?? 30

  return (
    <div className="space-y-7">
      <PageHeader title="Plan a trip" backTo="/app" />

      <TripInput
        origin={draft.origin}
        destination={draft.destination}
        multiStop={draft.trip_type === 'multi_stop'}
        waypoints={draft.waypoints}
        onWaypointsChange={(waypoints) => setDraft({ waypoints })}
        onOriginChange={(v) => setDraft({ origin: v, origin_lat: undefined, origin_lng: undefined })}
        onDestinationChange={(v) => setDraft({ destination: v, destination_lat: undefined, destination_lng: undefined })}
        onOriginPick={(p) =>
          setDraft({ origin: placeSuggestionLabel(p), origin_lat: p.lat, origin_lng: p.lng })
        }
        onDestinationPick={(p) =>
          setDraft({ destination: placeSuggestionLabel(p), destination_lat: p.lat, destination_lng: p.lng })
        }
        onSwap={() =>
          setDraft({
            origin: draft.destination,
            destination: draft.origin,
            origin_lat: draft.destination_lat,
            origin_lng: draft.destination_lng,
            destination_lat: draft.origin_lat,
            destination_lng: draft.origin_lng,
            waypoints: [...draft.waypoints].reverse(),
          })
        }
      />

      <div className="-mx-4 h-52 overflow-hidden border-y border-line sm:mx-0 sm:rounded-md sm:border lg:hidden">
        <MapView
          className="h-full"
          allowMapPin
          syncTripPin
          cameraLock={planTripMapHasContent(draft) || trip.points.length > 1 ? 'content' : 'user'}
          center={userCenter}
          zoom={12}
          markers={planMarkers}
          route={trip.points.length > 1 ? { points: trip.points } : undefined}
        />
      </div>

      <div>
        <SectionLabel>Trip</SectionLabel>
        <TripTypeSelector
          value={draft.trip_type}
          onChange={(v) =>
            setDraft({
              trip_type: v,
              includeReturn: v === 'round_trip',
              waypoints:
                v === 'multi_stop' && draft.waypoints.length === 0 ? [newTripWaypoint()] : draft.waypoints,
            })
          }
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
        <PrimaryButton
          fullWidth
          disabled={!vehicle || isPending || !hasOrigin || !draft.destination.trim() || !hasMultiStop}
          onClick={() => calculate()}
        >
          {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Can I make it?'}
        </PrimaryButton>
      </div>
    </div>
  )
}
