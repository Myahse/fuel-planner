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
        title="Garage"
        backTo="/app"
        right={
          <Link to="/app/vehicles/add" className="btn btn-ghost btn-sm" aria-label="Add vehicle">
            <Plus className="h-4 w-4" /> Add
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
          <Sheet open={customizing} onClose={() => setCustomizing(false)} title={`${featured.make} ${featured.model}`}>
            {customizing && <VehicleAppearancePanel vehicle={featured} onSaved={() => setCustomizing(false)} />}
          </Sheet>
        </>
      )}

      {others.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-2 text-sm font-semibold text-fg-2">Also in the garage</h2>
          <div className="-mx-4 divide-y divide-line border-y border-line sm:mx-0">
            {others.map((v) => (
              <VehicleCard key={v.id} vehicle={v} compact onSelect={() => setSelectedVehicleId(v.id)} />
            ))}
          </div>
        </section>
      )}

    </div>
  )
}
