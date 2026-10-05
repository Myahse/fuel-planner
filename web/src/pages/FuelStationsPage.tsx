import { useState } from 'react'
import { MapView } from '../components/map/MapView'
import { PageHeader } from '../components/layout/PageHeader'
import { FuelStationCard } from '../components/FuelStationCard'
import { MOCK_STATIONS } from '../data/mockStations'
import { PLACES } from '../data/mapPlaces'
import { interpolateRoute } from '../components/map/routeGeometry'
import { EmptyState } from '../components/EmptyState'

type Tab = 'along' | 'cheapest' | 'nearest'

export function FuelStationsPage() {
  const [tab, setTab] = useState<Tab>('along')
  const stations = [...MOCK_STATIONS].sort((a, b) => {
    if (tab === 'cheapest') return a.pricePerLiter - b.pricePerLiter
    if (tab === 'nearest') return a.distanceKmFromStart - b.distanceKmFromStart
    return a.distanceKmFromStart - b.distanceKmFromStart
  })

  return (
    <div className="space-y-4">
      <PageHeader title="Fuel Stations" backTo="/app" />

      <div className="flex gap-2 rounded-2xl bg-slate-100 p-1">
        {[
          { id: 'along' as Tab, label: 'Along Route' },
          { id: 'cheapest' as Tab, label: 'Cheapest' },
          { id: 'nearest' as Tab, label: 'Nearest' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-xl py-2 text-xs font-semibold sm:text-sm ${
              tab === t.id ? 'bg-white text-brand-800 shadow-sm' : 'text-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="-mx-4 h-48 overflow-hidden lg:hidden">
        <MapView
          className="h-full"
          route={{ points: interpolateRoute(PLACES.abidjan, PLACES.yamoussoukro) }}
          markers={stations.map((s) => ({
            id: s.id,
            lat: s.lat,
            lng: s.lng,
            variant: 'station' as const,
          }))}
        />
      </div>

      <div className="space-y-3">
        {stations.length === 0 ? (
          <EmptyState title="No fuel stations found nearby." description="Try another route or widen your search." />
        ) : (
          stations.map((s) => <FuelStationCard key={s.id} station={s} />)
        )}
      </div>
    </div>
  )
}
