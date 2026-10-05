import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { setDefaultVehicle } from '../api/endpoints'
import { useActiveVehicle } from '../hooks/useActiveVehicle'
import { PageHeader } from '../components/layout/PageHeader'
import { VehicleCard } from '../components/VehicleCard'
import { VehicleAppearancePanel } from '../components/car3d/VehicleAppearancePanel'
import { Sheet } from '../components/Sheet'
import { SecondaryButton } from '../components/buttons/SecondaryButton'
import { CardSkeleton } from '../components/Skeleton'

export function VehiclesPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { vehicles, vehicle, vehiclesQuery, setSelectedVehicleId } = useActiveVehicle()
  const [customizing, setCustomizing] = useState(false)

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
            aria-label="Add vehicle"
          >
            <Plus className="h-5 w-5" />
          </Link>
        }
      />

      {vehiclesQuery.isLoading && <CardSkeleton />}

      {featured && (
        <>
          <VehicleCard
            vehicle={featured}
            featured
            onCustomize={() => setCustomizing(true)}
            onSetDefault={() => defaultMutation.mutate(featured.id)}
            onEdit={() => navigate(`/app/vehicles/add?edit=${featured.id}`)}
          />
          <Sheet open={customizing} onClose={() => setCustomizing(false)} title={`Customize ${featured.make} ${featured.model}`}>
            {customizing && <VehicleAppearancePanel vehicle={featured} onSaved={() => setCustomizing(false)} />}
          </Sheet>
        </>
      )}

      {others.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-muted">Other Vehicles</h2>
          <div className="space-y-3">
            {others.map((v) => (
              <VehicleCard key={v.id} vehicle={v} compact onSelect={() => setSelectedVehicleId(v.id)} />
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
