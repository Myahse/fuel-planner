import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowUpRight, Droplets, Fuel, Route } from 'lucide-react'
import type { ReactNode } from 'react'
import { getFuelCurrent, listFuelTransactions, listTrips } from '../api/endpoints'
import { useActiveVehicle } from '../hooks/useActiveVehicle'
import { CarViewer } from '../components/car3d/CarViewer'
import { VehicleHeroCard } from '../components/VehicleHeroCard'
import { EmptyState } from '../components/EmptyState'
import { CardSkeleton } from '../components/Skeleton'
import { MOCK_STATIONS } from '../data/mockStations'
import { shortPlace } from '../lib/format'

const DEFAULT_DESTINATIONS = ['Yamoussoukro', 'Bouaké', 'San-Pédro', 'Korhogo']

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { vehicle, vehicles, vehiclesQuery, fuelPricePerLiter, setSelectedVehicleId } = useActiveVehicle()

  const fuelQuery = useQuery({
    queryKey: ['fuel-current', vehicle?.id],
    queryFn: () => getFuelCurrent(vehicle!.id),
    enabled: Boolean(vehicle?.id),
  })
  const txQuery = useQuery({
    queryKey: ['fuel-transactions', vehicle?.id],
    queryFn: () => listFuelTransactions(vehicle!.id),
    enabled: Boolean(vehicle?.id),
  })
  const tripsQuery = useQuery({ queryKey: ['trips'], queryFn: listTrips, enabled: Boolean(vehicle) })

  const pct = Math.round(fuelQuery.data?.fuel_percentage ?? vehicle?.fuel_percentage ?? 60)
  const liters = fuelQuery.data?.estimated_fuel_liters ?? vehicle?.estimated_fuel_liters ?? 30
  const range = fuelQuery.data?.estimated_range_km ?? 400
  const consumption = fuelQuery.data?.consumption_l_per_100km ?? vehicle?.mixed_consumption ?? 7.5

  const lastFill = txQuery.data?.[0]
  const lastTrip = tripsQuery.data?.find((t) => !vehicle || t.vehicle_id === vehicle.id) ?? tripsQuery.data?.[0]
  const cheapest = [...MOCK_STATIONS].sort((a, b) => a.pricePerLiter - b.pricePerLiter)[0]
  // Recent destinations first, topped up with common long trips from Abidjan.
  const recent = [...new Set((tripsQuery.data ?? []).map((t) => shortPlace(t.destination)))]
  const destinations = [...new Set([...recent, ...DEFAULT_DESTINATIONS])].slice(0, 4)

  if (vehiclesQuery.isLoading) return <CardSkeleton />

  if (!vehicle) {
    return (
      <div className="space-y-5">
        <CarViewer vehicle={{ make: 'Toyota', model: 'Corolla' }} variant="hero" autoRotate />
        <EmptyState
          title="Add your car to fill the tank"
          description="FUELGO needs your tank size and consumption to tell you how far you can go."
          actionLabel="Add a vehicle"
          onAction={() => navigate('/app/vehicles/add')}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {fuelQuery.isLoading ? (
        <CardSkeleton />
      ) : (
        <VehicleHeroCard
          key={vehicle.id}
          vehicle={vehicle}
          vehicles={vehicles}
          onSelect={setSelectedVehicleId}
          percent={pct}
          liters={liters}
          rangeKm={range}
          destinations={destinations}
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <Tile to="/app/stations" icon={<Fuel className="h-4 w-4" />} label="Cheapest nearby" value={`${cheapest.pricePerLiter}`} unit="F/L" hint={cheapest.brand} />
        <Tile
          to="/app/statistics"
          icon={<Droplets className="h-4 w-4" />}
          label="100 km costs"
          value={Math.round(consumption * fuelPricePerLiter).toLocaleString('en-US')}
          unit="F"
          hint={`${consumption.toFixed(1)} L/100 km`}
        />
      </div>

      <Link to={lastTrip ? `/app/history/${lastTrip.id}` : '/app/plan'} className="glass flex items-center gap-4 px-4 py-3.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fg/10 text-fuel-1">
          <Route className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="unit block">{lastTrip ? `last trip · ${shortDate(lastTrip.created_at)}` : 'no trips yet'}</span>
          <span className="block truncate font-bold text-fg">
            {lastTrip ? `${shortPlace(lastTrip.origin)} → ${shortPlace(lastTrip.destination)}` : 'Plan your first trip'}
          </span>
        </span>
        <span className="font-[family-name:var(--font-display)] font-bold text-fg">{lastTrip ? `${Math.round(lastTrip.distance_km)} km` : ''}</span>
      </Link>

      <Link to={lastFill ? `/app/fuel/transactions/${lastFill.id}` : '/app/fuel/add'} className="glass flex items-center gap-4 px-4 py-3.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fg/10 text-fuel-1">
          <Droplets className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="unit block">{lastFill ? `last fill-up · ${shortDate(lastFill.created_at)}` : 'fill-ups'}</span>
          <span className="block truncate font-bold text-fg">{lastFill ? `${lastFill.liters.toFixed(1)} L for ${Math.round(lastFill.total_amount).toLocaleString('en-US')} F` : 'Log a fill-up to sharpen estimates'}</span>
        </span>
        <ArrowUpRight className="h-5 w-5 text-fg-3" />
      </Link>

      <Link to="/app/vehicles" className="glass block overflow-hidden">
        <CarViewer vehicle={vehicle} variant="banner" autoRotate />
        <div className="flex items-center justify-between px-4 pb-4">
          <span>
            <span className="unit block">garage</span>
            <span className="font-bold text-fg">
              {vehicle.make} {vehicle.model}
            </span>
          </span>
          <ArrowUpRight className="h-5 w-5 text-fg-3" />
        </div>
      </Link>
    </div>
  )
}

function Tile({ to, icon, label, value, unit, hint }: { to: string; icon: ReactNode; label: string; value: string; unit: string; hint: string }) {
  return (
    <Link to={to} className="glass block px-4 py-3.5">
      <span className="flex items-center gap-2 text-fuel-1">
        {icon}
        <span className="unit">{label}</span>
      </span>
      <span className="readout mt-2 block text-[1.75rem] text-fg">
        {value}
        <span className="ml-1 font-[family-name:var(--font-sans)] text-sm font-bold tracking-normal text-fg-3">{unit}</span>
      </span>
      <span className="mt-1 block truncate text-xs font-semibold text-fg-3">{hint}</span>
    </Link>
  )
}
