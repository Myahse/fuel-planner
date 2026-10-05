import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
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
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: '2-digit' }).toUpperCase()
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
      <header className="flex items-center justify-between gap-3 pt-1 lg:pt-0">
        <span className="pl-5 lg:hidden">
          <BrandMark />
        </span>
        <p className="text-right text-sm font-medium text-fg-2">
          {greeting()},<br className="lg:hidden" /> <span className="font-bold text-fg">{displayName}</span>
        </p>
      </header>

      {vehiclesQuery.isLoading && <CardSkeleton />}

      {!vehiclesQuery.isLoading && !vehicle && (
        <>
          <CarViewer vehicle={{ make: 'Toyota', model: 'Corolla' }} variant="hero" autoRotate className="rounded-[26px] border-[2.5px] border-espresso bg-panel" />
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
              pricePerLiter={fuelPricePerLiter}
              verdict={`${consumption.toFixed(1)} L/100 km · about ${Math.round(consumption * fuelPricePerLiter).toLocaleString('en-US')} F per 100 km`}
            />
          )}

          <Link
            to="/app/stations"
            className="flex items-center justify-between gap-3 rounded-[18px] border-[2.5px] border-dashed border-signal bg-[repeating-linear-gradient(-45deg,rgb(226_70_43/0.06)_0_8px,transparent_8px_16px)] px-4 py-3"
          >
            <span>
              <span className="block text-sm font-bold text-fg">Cheapest pump nearby</span>
              <span className="title block text-2xl text-signal">{cheapest.pricePerLiter} F/L</span>
            </span>
            <span className="text-right text-sm font-bold text-fg">
              {cheapest.brand}
              <span className="flex items-center justify-end gap-1 font-medium text-fg-2">
                on the route <ArrowRight className="h-4 w-4" />
              </span>
            </span>
          </Link>

          <Link
            to={lastTrip ? `/app/history/${lastTrip.id}` : '/app/plan'}
            className="flex overflow-hidden rounded-[18px] border-[2.5px] border-espresso bg-mustard shadow-[0_3px_0_var(--color-espresso)]"
          >
            <span className="flex flex-col justify-center border-r-[2.5px] border-dashed border-espresso px-3 py-2.5">
              <span className="unit !text-espresso">last trip</span>
              <span className="readout text-2xl text-espresso">{lastTrip ? shortDate(lastTrip.created_at) : '—'}</span>
            </span>
            <span className="flex min-w-0 flex-col justify-center px-4 py-2.5 text-espresso">
              <span className="truncate text-[17px] font-bold">
                {lastTrip ? `${lastTrip.origin} → ${lastTrip.destination}` : 'No trips yet — plan your first'}
              </span>
              <span className="text-sm">
                {lastTrip ? `${Math.round(lastTrip.distance_km)} km · ${lastTrip.fuel_required_liters?.toFixed(1) ?? '—'} L` : 'Distance, fuel and cost in one tap'}
              </span>
            </span>
          </Link>

          <Link to={lastFill ? `/app/fuel/transactions/${lastFill.id}` : '/app/fuel/add'} className="flex items-center justify-between px-1 text-sm font-medium text-fg-2 hover:text-fg">
            <span>
              Last fill-up:{' '}
              <span className="font-bold text-fg">{lastFill ? `${lastFill.liters.toFixed(1)} L · ${shortDate(lastFill.created_at)}` : 'none logged yet'}</span>
            </span>
            <span className="font-bold text-signal">Log one →</span>
          </Link>
        </>
      )}
    </div>
  )
}
