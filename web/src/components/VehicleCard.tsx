import { SecondaryButton } from './buttons/SecondaryButton'
import { PrimaryButton } from './buttons/PrimaryButton'
import { formatConsumption, formatLiters } from '../lib/format'
import type { Vehicle } from '../api/types'
import { CarViewer } from './car3d/CarViewer'
import { VehicleSilhouette } from './car3d/VehicleSilhouette'
import { resolveBodyType, resolvePaint } from '../config/vehicleModels'

type Props = {
  vehicle: Vehicle
  featured?: boolean
  onSetDefault?: () => void
  onEdit?: () => void
  onCustomize?: () => void
  onSelect?: () => void
  compact?: boolean
  show3d?: boolean
}

export function VehicleCard({ vehicle, featured, onSetDefault, onEdit, onCustomize, onSelect, compact, show3d = true }: Props) {
  if (compact) {
    return (
      <button type="button" onClick={onSelect} className="card-surface card-interactive flex w-full items-center gap-3 p-3 text-left">
        <VehicleThumb vehicle={vehicle} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink">{vehicle.make} {vehicle.model}</p>
          <p className="text-xs text-muted">{vehicle.year} • {vehicle.engine} • {vehicle.fuel_type}</p>
        </div>
        {onSelect && <span className="text-xs font-semibold text-brand-800">Select</span>}
      </button>
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
          <div className="mt-5 flex flex-wrap gap-3">
            {onCustomize && (
              <SecondaryButton className="flex-1 py-3 text-sm" onClick={onCustomize} type="button">
                Customize look
              </SecondaryButton>
            )}
            <SecondaryButton className="flex-1 py-3 text-sm" onClick={onEdit} type="button">
              Edit details
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
      <VehicleThumb vehicle={vehicle} />
      <div className="min-w-0 text-left">
        <p className="font-semibold text-ink">{vehicle.make} {vehicle.model}</p>
        <p className="text-xs text-muted">{vehicle.year} • {vehicle.engine} • {vehicle.fuel_type}</p>
      </div>
    </button>
  )
}

/** Flat silhouette thumbnail — list rows must not each open a WebGL context. */
function VehicleThumb({ vehicle }: { vehicle: Vehicle }) {
  return (
    <span className="flex h-[60px] w-[88px] shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-slate-100 to-white px-1.5">
      <VehicleSilhouette
        bodyType={resolveBodyType(vehicle)}
        paint={resolvePaint(vehicle.make, vehicle.paint_color)}
        className="w-full text-slate-900"
      />
    </span>
  )
}
