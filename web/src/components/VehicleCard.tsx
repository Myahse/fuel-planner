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
      <button type="button" onClick={onSelect} className="row-link w-full text-left">
        <VehicleThumb vehicle={vehicle} />
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-fg">
            {vehicle.make} {vehicle.model}
          </span>
          <span className="unit block">
            {vehicle.year} · {vehicle.tank_capacity_liters} L · {vehicle.mixed_consumption.toFixed(1)} L/100km
          </span>
        </span>
        {onSelect && <span className="text-sm font-medium text-fg-3">Drive this</span>}
      </button>
    )
  }

  return (
    <article>
      {show3d && (
        <div className="-mx-4 sm:mx-0">
          <CarViewer vehicle={vehicle} variant="hero" interactive={featured} autoRotate={!featured} />
        </div>
      )}
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="title text-[1.75rem] text-fg">
            {vehicle.make} <span className="text-fg-2">{vehicle.model}</span>
          </h2>
          <p className="unit mt-1">
            {vehicle.year} · {vehicle.engine} · {vehicle.fuel_type}
          </p>
        </div>
        {vehicle.is_default && (
          <span className="flex items-center gap-2 text-xs font-semibold text-fg-2">
            <span className="lamp text-ok" aria-hidden /> Default
          </span>
        )}
      </div>

      <dl className="mt-5 grid grid-cols-3 divide-x divide-line border-y border-line">
        {[
          ['tank', vehicle.tank_capacity_liters.toFixed(0), 'L'],
          ['mixed', vehicle.mixed_consumption.toFixed(1), 'L/100km'],
          ['gauge', String(vehicle.fuel_gauge_bars), 'bars'],
        ].map(([k, v, u]) => (
          <div key={k} className="px-3 py-3.5 first:pl-0">
            <dt className="unit">{k}</dt>
            <dd className="readout mt-2 text-2xl text-fg">
              {v}
              <span className="unit ml-1">{u}</span>
            </dd>
          </div>
        ))}
      </dl>

      {featured && (
        <div className="mt-5 grid grid-cols-2 gap-3">
          {onCustomize && (
            <button className="btn btn-ghost btn-sm" onClick={onCustomize} type="button">
              Paint &amp; body
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={onEdit} type="button">
            Edit details
          </button>
          {!vehicle.is_default && (
            <button className="btn btn-primary btn-sm col-span-2" onClick={onSetDefault} type="button">
              Make default
            </button>
          )}
        </div>
      )}
    </article>
  )
}

/** Flat silhouette thumbnail — list rows must not each open a WebGL context. */
function VehicleThumb({ vehicle }: { vehicle: Vehicle }) {
  return (
    <span className="flex h-12 w-20 shrink-0 items-center">
      <VehicleSilhouette bodyType={resolveBodyType(vehicle)} paint={resolvePaint(vehicle.make, vehicle.paint_color)} className="w-full text-fg" />
    </span>
  )
}
