import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listTrips } from '../api/endpoints'
import { PageHeader } from '../components/layout/PageHeader'
import { SpecList } from '../components/ui'
import { formatDuration, formatFcfa, formatKm, formatLiters } from '../lib/format'

export function TripDetailPage() {
  const { id } = useParams()
  const tripsQuery = useQuery({ queryKey: ['trips'], queryFn: listTrips })
  const trip = tripsQuery.data?.find((t) => t.id === id)

  if (!trip) {
    return (
      <div>
        <PageHeader title="Trip" backTo="/app/history" />
        <p className="text-fg-2">We couldn&apos;t find that trip.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`${trip.origin} → ${trip.destination}`} backTo="/app/history" subtitle={new Date(trip.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })} />
      <div className="border-y border-line">
        <SpecList
          rows={[
            ['Distance', formatKm(trip.distance_km)],
            ['Drive time', formatDuration(trip.estimated_duration_seconds)],
            ['Fuel', formatLiters(trip.fuel_required_liters)],
            ['Cost', formatFcfa(trip.fuel_cost)],
            ['Status', <span className="capitalize">{trip.status}</span>],
          ]}
        />
      </div>
      <Link to="/app/plan" className="btn btn-ghost w-full">
        Plan a similar trip
      </Link>
    </div>
  )
}
