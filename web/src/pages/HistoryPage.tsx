import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listTrips } from '../api/endpoints'
import { PageHeader } from '../components/layout/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { CardSkeleton } from '../components/Skeleton'
import { formatDuration, formatFcfa, formatKm, formatLiters } from '../lib/format'

export function HistoryPage() {
  const navigate = useNavigate()
  const tripsQuery = useQuery({ queryKey: ['trips'], queryFn: listTrips })

  const trips = tripsQuery.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader title="Trips" backTo="/app" />

      {tripsQuery.isLoading && <CardSkeleton />}
      {tripsQuery.isError && (
        <p className="flex items-center gap-2.5 text-sm text-fg-2">
          <span className="lamp text-danger" aria-hidden /> Couldn&apos;t load your trips. Try again later.
        </p>
      )}

      {trips.length > 0 && (
        <ol className="-mx-4 divide-y divide-line border-y border-line sm:mx-0">
          {trips.map((t) => (
            <li key={t.id}>
              <Link to={`/app/history/${t.id}`} className="row-link items-start">
                <span className="w-14 shrink-0 pt-0.5">
                  <span className="unit block">{new Date(t.created_at).toLocaleDateString(undefined, { month: 'short' }).toLowerCase()}</span>
                  <span className="readout block text-2xl text-fg">{new Date(t.created_at).getDate()}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-fg">
                    {t.origin} → {t.destination}
                  </span>
                  <span className="unit mt-1 block">
                    {formatKm(t.distance_km)} · {formatLiters(t.fuel_required_liters)} · {formatFcfa(t.fuel_cost)} · {formatDuration(t.estimated_duration_seconds)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}

      {!tripsQuery.isLoading && !tripsQuery.isError && trips.length === 0 && (
        <EmptyState
          title="No trips yet"
          description="Plan a trip and it shows up here with its distance, fuel and cost."
          actionLabel="Plan a trip"
          onAction={() => navigate('/app/plan')}
        />
      )}
    </div>
  )
}
