import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Bell, Droplets, Car, History, Fuel } from 'lucide-react'
import { getFuelCurrent } from '../api/endpoints'
import { useActiveVehicle } from '../hooks/useActiveVehicle'
import { CarViewer } from '../components/car3d/CarViewer'
import { FuelLevelCard } from '../components/FuelLevelCard'
import { VehicleSelectorChip } from '../components/VehicleCard'
import { PrimaryButton } from '../components/buttons/PrimaryButton'
import { EmptyState } from '../components/EmptyState'
import { CardSkeleton } from '../components/Skeleton'
import { formatConsumption, formatPricePerLiter } from '../lib/format'
import { PRODUCT } from '../config/product'

export function DashboardPage() {
  const { vehicle, vehiclesQuery, displayName, fuelPricePerLiter } = useActiveVehicle()

  const fuelQuery = useQuery({
    queryKey: ['fuel-current', vehicle?.id],
    queryFn: () => getFuelCurrent(vehicle!.id),
    enabled: Boolean(vehicle?.id),
  })

  const pct = Math.round(fuelQuery.data?.fuel_percentage ?? vehicle?.fuel_percentage ?? 60)
  const liters = fuelQuery.data?.estimated_fuel_liters ?? vehicle?.estimated_fuel_liters ?? 30
  const range = fuelQuery.data?.estimated_range_km ?? 400
  const consumption = fuelQuery.data?.consumption_l_per_100km ?? vehicle?.mixed_consumption ?? 7.5

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4 pt-1 lg:pt-0">
        <div>
          <p className="eyebrow">{PRODUCT.name}</p>
          <p className="mt-1 text-sm text-muted">Good morning,</p>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{displayName}</h1>
        </div>
        <button type="button" className="icon-btn h-11 w-11 shrink-0" aria-label="Notifications">
          <Bell className="h-5 w-5 text-ink" />
        </button>
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
            onAction={() => (window.location.href = '/app/vehicles/add')}
          />
        </>
      )}

      {vehicle && (
        <>
          <div className="card-surface overflow-hidden p-0">
            <CarViewer vehicle={vehicle} variant="hero" autoRotate />
          </div>

          <Link to="/app/vehicles" className="block">
            <VehicleSelectorChip vehicle={vehicle} />
          </Link>

          {fuelQuery.isLoading ? (
            <CardSkeleton />
          ) : (
            <FuelLevelCard
              percent={pct}
              liters={liters}
              tankLiters={vehicle.tank_capacity_liters}
              rangeKm={range}
              bars={vehicle.fuel_gauge_bars}
              to="/app/fuel/level"
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="card-surface p-4">
              <p className="eyebrow">Consumption</p>
              <p className="mt-2 text-base font-bold text-ink">{formatConsumption(consumption)}</p>
            </div>
            <div className="card-surface p-4">
              <p className="eyebrow">Fuel price</p>
              <p className="mt-2 text-base font-bold text-ink">{formatPricePerLiter(fuelPricePerLiter)}</p>
            </div>
          </div>

          <Link to="/app/plan" className="block">
            <PrimaryButton fullWidth>Plan a Trip →</PrimaryButton>
          </Link>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { to: '/app/fuel/add', label: 'Add Fuel', icon: Droplets },
              { to: '/app/vehicles', label: 'Vehicles', icon: Car },
              { to: '/app/history', label: 'History', icon: History },
              { to: '/app/stations', label: 'Stations', icon: Fuel },
            ].map((s) => (
              <Link
                key={s.to}
                to={s.to}
                className="card-surface card-interactive flex flex-col items-center gap-2.5 px-3 py-4 text-center"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-800">
                  <s.icon className="h-5 w-5" strokeWidth={2.2} />
                </span>
                <span className="text-xs font-semibold text-ink">{s.label}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
