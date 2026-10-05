import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { getFuelCurrent, listFuelTransactions, listTrips } from '../api/endpoints'
import { useActiveVehicle } from '../hooks/useActiveVehicle'
import { CarViewer } from '../components/car3d/CarViewer'
import { VehicleHeroCard } from '../components/VehicleHeroCard'
import { WhereToSearch } from '../components/WhereToSearch'
import { BrandMark } from '../components/layout/BrandMark'
import { EmptyState } from '../components/EmptyState'
import { CardSkeleton } from '../components/Skeleton'
import { MOCK_STATIONS } from '../data/mockStations'

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
  const costPer100 = consumption * fuelPricePerLiter

  const lastFill = txQuery.data?.[0]
  const lastTrip = tripsQuery.data?.find((t) => !vehicle || t.vehicle_id === vehicle.id) ?? tripsQuery.data?.[0]
  const cheapest = [...MOCK_STATIONS].sort((a, b) => a.pricePerLiter - b.pricePerLiter)[0]

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between pt-1 lg:pt-0">
        <span className="lg:hidden">
          <BrandMark />
        </span>
        <p className="text-sm text-fg-3">
          {greeting()}, <span className="text-fg-2">{displayName}</span>
        </p>
      </header>

      {vehiclesQuery.isLoading && <CardSkeleton />}

      {!vehiclesQuery.isLoading && !vehicle && (
        <>
          <CarViewer vehicle={{ make: 'Toyota', model: 'Corolla' }} variant="hero" autoRotate />
          <EmptyState
            title="Add your car to start"
            description="FUELGO needs your tank size and consumption to tell you how far you can go."
            actionLabel="Add a vehicle"
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

          <dl className="grid grid-cols-3 divide-x divide-line border-y border-line">
            <Metric label="consumption" value={consumption.toFixed(1)} unit="L/100km" />
            <Metric label="fuel price" value={Math.round(fuelPricePerLiter).toLocaleString('en-US')} unit="FCFA/L" />
            <Metric label="per 100 km" value={Math.round(costPer100).toLocaleString('en-US')} unit="FCFA" />
          </dl>

          <section aria-labelledby="glance">
            <h2 id="glance" className="mb-2 text-sm font-semibold text-fg-2">
              Recently
            </h2>
            <ul className="divide-y divide-line border-y border-line">
              <Row
                to={lastFill ? `/app/fuel/transactions/${lastFill.id}` : '/app/fuel/add'}
                k="Last fill-up"
                v={lastFill ? `${lastFill.liters.toFixed(1)} L · ${shortDate(lastFill.created_at)}` : 'Log your first one'}
              />
              <Row to="/app/stations" k="Cheapest nearby" v={`${cheapest.brand} · ${cheapest.pricePerLiter} FCFA/L`} />
              <Row
                to={lastTrip ? `/app/history/${lastTrip.id}` : '/app/plan'}
                k="Last trip"
                v={lastTrip ? `${lastTrip.destination} · ${Math.round(lastTrip.distance_km)} km` : 'None yet'}
              />
            </ul>
          </section>
        </>
      )}
    </div>
  )
}

function Metric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="px-3 py-4 first:pl-0">
      <dt className="unit">{label}</dt>
      <dd className="readout mt-2 text-2xl text-fg">
        {value}
        <span className="unit ml-1">{unit}</span>
      </dd>
    </div>
  )
}

function Row({ to, k, v }: { to: string; k: string; v: string }) {
  return (
    <li>
      <Link to={to} className="group flex items-center gap-4 py-3.5">
        <span className="w-32 shrink-0 text-sm text-fg-3">{k}</span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">{v}</span>
        <ArrowUpRight className="h-4 w-4 text-fg-3 transition group-hover:text-signal" />
      </Link>
    </li>
  )
}
