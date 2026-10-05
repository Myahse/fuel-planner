import { useState } from 'react'
import { MapView } from '../components/map/MapView'
import { PageHeader } from '../components/layout/PageHeader'
import { FuelStationCard } from '../components/FuelStationCard'
import { MOCK_STATIONS } from '../data/mockStations'
import { PLACES } from '../data/mapPlaces'
import { interpolateRoute } from '../components/map/routeGeometry'
import { EmptyState } from '../components/EmptyState'

type Tab = 'along' | 'cheapest'

export function FuelStationsPage() {
  const [tab, setTab] = useState<Tab>('along')
  const stations = [...MOCK_STATIONS].sort((a, b) =>
    tab === 'cheapest' ? a.pricePerLiter - b.pricePerLiter : a.distanceKmFromStart - b.distanceKmFromStart,
  )
  const cheapestId = [...MOCK_STATIONS].sort((a, b) => a.pricePerLiter - b.pricePerLiter)[0]?.id

  return (
    <div className="space-y-6">
      <PageHeader title="Fuel on the route" backTo="/app" subtitle="Abidjan → Yamoussoukro" />

      <div className="seg" role="group" aria-label="Sort stations">
        <button type="button" aria-pressed={tab === 'along'} onClick={() => setTab('along')}>
          In route order
        </button>
        <button type="button" aria-pressed={tab === 'cheapest'} onClick={() => setTab('cheapest')}>
          Cheapest first
        </button>
      </div>

      <div className="-mx-4 h-52 overflow-hidden border-y border-line lg:hidden">
        <MapView
          className="h-full"
          route={{ points: interpolateRoute(PLACES.abidjan, PLACES.yamoussoukro) }}
          markers={stations.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, variant: 'station' as const }))}
        />
      </div>

      {stations.length === 0 ? (
        <EmptyState title="No stations on this route" description="Try another route or widen your search." />
      ) : (
        <div className="-mx-4 divide-y divide-line border-y border-line sm:mx-0">
          {stations.map((s) => (
            <FuelStationCard key={s.id} station={s} cheapest={s.id === cheapestId} />
          ))}
        </div>
      )}
      <p className="unit">sample station data · prices may differ at the pump</p>
    </div>
  )
}
