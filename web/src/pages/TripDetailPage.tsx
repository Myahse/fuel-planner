import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listTrips } from '../api/endpoints'
import { PageHeader } from '../components/layout/PageHeader'
import { formatDuration, formatFcfa, formatKm, formatLiters } from '../lib/format'

export function TripDetailPage() {
  const { id } = useParams()
  const tripsQuery = useQuery({ queryKey: ['trips'], queryFn: listTrips })
  const trip = tripsQuery.data?.find((t) => t.id === id)

  if (!trip) {
    return (
      <div>
        <PageHeader title="Trip" backTo="/app/history" />
        <p className="text-muted">Trip not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Trip Details" backTo="/app/history" />
      <div className="rounded-3xl bg-white p-5 shadow-card space-y-3 text-sm">
        <p className="text-xl font-bold">{trip.origin} → {trip.destination}</p>
        <div className="flex justify-between"><span className="text-muted">Distance</span><span>{formatKm(trip.distance_km)}</span></div>
        <div className="flex justify-between"><span className="text-muted">Duration</span><span>{formatDuration(trip.estimated_duration_seconds)}</span></div>
        <div className="flex justify-between"><span className="text-muted">Fuel</span><span>{formatLiters(trip.fuel_required_liters)}</span></div>
        <div className="flex justify-between"><span className="text-muted">Cost</span><span className="font-bold text-brand-800">{formatFcfa(trip.fuel_cost)}</span></div>
        <div className="flex justify-between"><span className="text-muted">Status</span><span className="capitalize">{trip.status}</span></div>
      </div>
      <Link to="/app/plan" className="text-brand-800 font-semibold">Plan similar trip</Link>
    </div>
  )
}
