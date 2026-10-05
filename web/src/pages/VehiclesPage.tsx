import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { setDefaultVehicle } from '../api/endpoints'
import { useActiveVehicle } from '../hooks/useActiveVehicle'
import { PageHeader } from '../components/layout/PageHeader'
import { VehicleCard } from '../components/VehicleCard'
import { VehicleAppearancePanel } from '../components/car3d/VehicleAppearancePanel'
import { SecondaryButton } from '../components/buttons/SecondaryButton'
import { CardSkeleton } from '../components/Skeleton'

export function VehiclesPage() {
  const qc = useQueryClient()
  const { vehicles, vehicle, vehiclesQuery } = useActiveVehicle()

  const defaultMutation = useMutation({
    mutationFn: setDefaultVehicle,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  })

  const featured = vehicle ?? vehicles[0]
  const others = vehicles.filter((v) => v.id !== featured?.id)

  return (
    <div>
      <PageHeader
        title="My Vehicles"
        backTo="/app"
        right={
          <Link
            to="/app/vehicles/add"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-800 text-white"
          >
            <Plus className="h-5 w-5" />
          </Link>
        }
      />

      {vehiclesQuery.isLoading && <CardSkeleton />}

      {featured && (
        <>
          <VehicleAppearancePanel vehicle={featured} />
          <VehicleCard
            vehicle={featured}
            featured
            show3d={false}
            onSetDefault={() => defaultMutation.mutate(featured.id)}
            onEdit={() => (window.location.href = `/app/vehicles/add?edit=${featured.id}`)}
          />
        </>
      )}

      {others.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-muted">Other Vehicles</h2>
          <div className="space-y-3">
            {others.map((v) => (
              <VehicleCard key={v.id} vehicle={v} compact />
            ))}
          </div>
        </div>
      )}

      <Link to="/app/vehicles/add" className="mt-8 block">
        <SecondaryButton fullWidth>+ Add Vehicle</SecondaryButton>
      </Link>
    </div>
  )
}
