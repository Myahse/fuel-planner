import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listTrips } from '../api/endpoints'
import { PageHeader } from '../components/layout/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { CardSkeleton } from '../components/Skeleton'
import { formatDuration, formatFcfa, formatKm, formatLiters } from '../lib/format'

export function HistoryPage() {
  const tripsQuery = useQuery({ queryKey: ['trips'], queryFn: listTrips })

  return (
    <div className="space-y-4">
      <PageHeader title="Trip History" backTo="/app" />

      {tripsQuery.isLoading && <CardSkeleton />}
      {tripsQuery.isError && (
        <p className="text-sm text-red-600">Could not load trips. Try again later.</p>
      )}

      <div className="space-y-3">
        {(tripsQuery.data ?? []).map((t) => (
          <Link
            key={t.id}
            to={`/app/history/${t.id}`}
            className="block rounded-3xl bg-white p-5 shadow-card transition hover:shadow-md"
          >
            <p className="font-bold text-ink">{t.origin} → {t.destination}</p>
            <p className="mt-2 text-sm text-muted">
              {formatKm(t.distance_km)} • {formatLiters(t.fuel_required_liters)} • {formatFcfa(t.fuel_cost)}
            </p>
            <p className="mt-1 text-xs text-muted">
              {new Date(t.created_at).toLocaleDateString()} • {formatDuration(t.estimated_duration_seconds)}
            </p>
          </Link>
        ))}
      </div>

      {!tripsQuery.isLoading && (tripsQuery.data?.length ?? 0) === 0 && (
        <EmptyState
          title="Your trips will appear here."
          description="Plan a trip to start building your fuel history."
          actionLabel="Plan a Trip"
          onAction={() => (window.location.href = '/app/plan')}
        />
      )}
    </div>
  )
}
