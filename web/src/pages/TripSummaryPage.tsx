import { Link } from 'react-router-dom'
import { MapView } from '../components/map/MapView'
import { useTripStore } from '../store/tripStore'
import { PageHeader } from '../components/layout/PageHeader'
import { FuelSegments } from '../components/FuelSegments'
import { SpecList } from '../components/ui'
import { shortPlace, formatConsumption, formatDuration, formatFcfa, formatKm, formatLiters } from '../lib/format'
import { useTripRoute } from '../hooks/useTripRoute'

export function TripSummaryPage() {
  const { draft, lastResult } = useTripStore()
  const trip = useTripRoute()

  return (
    <div className="space-y-7">
      <PageHeader title="You've arrived" backTo="/app" subtitle={`${shortPlace(draft.origin)} → ${shortPlace(draft.destination)} · ${draft.trip_type.replace('_', ' ')}`} />

      <div className="-mx-4 h-44 overflow-hidden border-y border-line">
        <MapView className="h-full" route={{ points: trip.points }} />
      </div>

      <p className="readout text-6xl text-fg">
        {Math.round(31600).toLocaleString('en-US')}
        <span className="unit ml-1.5 text-sm">FCFA spent</span>
      </p>

      <div className="border-y border-line">
        <SpecList
          rows={[
            ['Distance', formatKm(lastResult?.distance_km ?? 490)],
            ['Drive time', formatDuration(lastResult?.estimated_duration_seconds ?? 20280)],
            ['Fuel used', formatLiters(36.1)],
            ['Average', formatConsumption(7.4)],
            ['Cost', formatFcfa(31600)],
          ]}
        />
      </div>

      <section className="grid grid-cols-2 gap-6">
        <div>
          <p className="unit">tank at start</p>
          <p className="readout mt-1.5 text-3xl text-fg">
            30.0<span className="unit ml-1">L</span>
          </p>
          <FuelSegments className="mt-3" percent={60} bars={8} />
        </div>
        <div>
          <p className="unit">tank now</p>
          <p className="readout mt-1.5 text-3xl text-fg">
            4.2<span className="unit ml-1">L</span>
          </p>
          <FuelSegments className="mt-3" percent={8} bars={8} />
        </div>
      </section>

      <div className="flex flex-col gap-3">
        <Link to="/app/history" className="btn btn-primary w-full">
          Save to trips
        </Link>
        <Link to="/app/stations" className="btn btn-ghost w-full">
          Find fuel nearby
        </Link>
      </div>
    </div>
  )
}
