import { SecondaryButton } from './buttons/SecondaryButton'
import { PrimaryButton } from './buttons/PrimaryButton'
import { formatConsumption, formatLiters } from '../lib/format'
import type { Vehicle } from '../api/types'
import { CarViewer } from './car3d/CarViewer'

type Props = {
  vehicle: Vehicle
  featured?: boolean
  onSetDefault?: () => void
  onEdit?: () => void
  compact?: boolean
  show3d?: boolean
}

export function VehicleCard({ vehicle, featured, onSetDefault, onEdit, compact, show3d = true }: Props) {
  if (compact) {
    return (
      <div className="card-surface flex items-center gap-3 p-3">
        <CarViewer vehicle={vehicle} variant="thumb" autoRotate={false} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink">{vehicle.make} {vehicle.model}</p>
          <p className="text-xs text-muted">{vehicle.year} • {vehicle.engine} • {vehicle.fuel_type}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card-surface overflow-hidden p-0">
      {show3d && (
        <CarViewer vehicle={vehicle} variant="card" interactive={featured} autoRotate={!featured} />
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-xl font-bold text-ink">{vehicle.make} {vehicle.model}</h3>
            <p className="mt-1 text-sm text-muted capitalize">
              {vehicle.year} • {vehicle.engine} • {vehicle.fuel_type}
            </p>
          </div>
          {vehicle.is_default && (
            <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-800">Default</span>
          )}
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-2xl bg-surface px-2 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted">Tank</p>
            <p className="mt-1 text-sm font-bold text-ink">{formatLiters(vehicle.tank_capacity_liters, 0)}</p>
          </div>
          <div className="rounded-2xl bg-surface px-2 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted">Avg use</p>
            <p className="mt-1 text-sm font-bold text-ink">{formatConsumption(vehicle.mixed_consumption)}</p>
          </div>
          <div className="rounded-2xl bg-surface px-2 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted">Fuel</p>
            <p className="mt-1 text-sm font-bold capitalize text-ink">{vehicle.fuel_type}</p>
          </div>
        </div>
        {featured && (
          <div className="mt-5 flex gap-3">
            <SecondaryButton className="flex-1 py-3 text-sm" onClick={onEdit} type="button">
              Edit
            </SecondaryButton>
            {!vehicle.is_default && (
              <PrimaryButton className="flex-1 py-3 text-sm" onClick={onSetDefault} type="button">
                Set as Default
              </PrimaryButton>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function VehicleSelectorChip({
  vehicle,
  onClick,
}: {
  vehicle: Vehicle
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="card-surface card-interactive flex w-full items-center gap-3 p-2 text-left"
    >
      <CarViewer vehicle={vehicle} variant="thumb" className="!h-[72px] !w-[96px] shrink-0" />
      <div className="min-w-0 text-left">
        <p className="font-semibold text-ink">{vehicle.make} {vehicle.model}</p>
        <p className="text-xs text-muted">{vehicle.year} • {vehicle.engine} • {vehicle.fuel_type}</p>
      </div>
    </button>
  )
}
