import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Droplets, Fuel, Route } from 'lucide-react'
import { getFuelCurrent, listFuelTransactions, listTrips } from '../api/endpoints'
import { useActiveVehicle } from '../hooks/useActiveVehicle'
import { CarViewer } from '../components/car3d/CarViewer'
import { VehicleHeroCard } from '../components/VehicleHeroCard'
import { WhereToSearch } from '../components/WhereToSearch'
import { EmptyState } from '../components/EmptyState'
import { CardSkeleton } from '../components/Skeleton'
import { MOCK_STATIONS } from '../data/mockStations'
import { formatFcfa, formatLiters } from '../lib/format'
import { PRODUCT } from '../config/product'

function greeting(hour = new Date().getHours()) {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { vehicle, vehicles, vehiclesQuery, displayName, fuelPricePerLiter, setSelectedVehicleId } = useActiveVehicle()

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

  return (
    <div className="space-y-5">
      <header className="pt-1 lg:pt-0">
        <p className="eyebrow">{PRODUCT.name}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {greeting()}, {displayName}
        </h1>
      </header>

      {vehiclesQuery.isLoading && <CardSkeleton />}

      {!vehiclesQuery.isLoading && !vehicle && (
        <>
          <div className="card-surface overflow-hidden p-0">
            <CarViewer vehicle={{ make: 'Toyota', model: 'Corolla' }} variant="hero" autoRotate />
          </div>
          <EmptyState
            title="Add your first vehicle"
            description="Track fuel, range, and trip costs for your car."
            actionLabel="Add Vehicle"
            icon="🚗"
            onAction={() => navigate('/app/vehicles/add')}
          />
        </>
      )}

      {vehicle && (
        <>
          <WhereToSearch />

          {fuelQuery.isLoading ? (
            <CardSkeleton />
          ) : (
            <VehicleHeroCard
              vehicle={vehicle}
              vehicles={vehicles}
              onSelect={setSelectedVehicleId}
              percent={pct}
              liters={liters}
              rangeKm={range}
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <Metric label="Consumption" value={consumption.toFixed(1)} unit="L/100 km" />
            <Metric label="Fuel price" value={Math.round(fuelPricePerLiter).toLocaleString('en-US')} unit="FCFA/L" />
          </div>

          <section aria-label="At a glance" className="space-y-3">
            <h2 className="eyebrow">At a glance</h2>
            <Insight
              to={lastFill ? `/app/fuel/transactions/${lastFill.id}` : '/app/fuel/add'}
              icon={<Droplets className="h-5 w-5" />}
              title="Last fill-up"
              detail={
                lastFill
                  ? `${formatLiters(lastFill.liters)} • ${formatFcfa(lastFill.total_amount)} • ${shortDate(lastFill.created_at)}`
                  : 'No fill-ups yet — log one to sharpen estimates'
              }
            />
            <Insight
              to="/app/stations"
              icon={<Fuel className="h-5 w-5" />}
              title="Cheapest station nearby"
              detail={`${cheapest.name} • ${cheapest.pricePerLiter.toLocaleString('en-US')} FCFA/L`}
            />
            <Insight
              to={lastTrip ? `/app/history/${lastTrip.id}` : '/app/plan'}
              icon={<Route className="h-5 w-5" />}
              title={lastTrip ? 'Recent trip' : 'No trips yet'}
              detail={
                lastTrip
                  ? `${lastTrip.origin} → ${lastTrip.destination} • ${Math.round(lastTrip.distance_km)} km`
                  : 'Plan your first trip to see fuel and cost'
              }
            />
          </section>
        </>
      )}
    </div>
  )
}

function Metric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="card-surface p-4">
      <p className="eyebrow">{label}</p>
      <p className="mt-2 whitespace-nowrap text-xl font-bold text-ink">
        {value} <span className="text-xs font-semibold text-muted">{unit}</span>
      </p>
    </div>
  )
}

function Insight({ to, icon, title, detail }: { to: string; icon: ReactNode; title: string; detail: string }) {
  return (
    <Link to={to} className="card-surface card-interactive flex items-center gap-3 p-3.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-800">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">{title}</span>
        <span className="block truncate text-xs text-muted">{detail}</span>
      </span>
    </Link>
  )
}
