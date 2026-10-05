import { Link } from 'react-router-dom'
import type { Vehicle } from '../api/types'
import { CarViewer } from './car3d/CarViewer'
import { FuelSegments } from './FuelSegments'
import { barsFilled } from '../lib/fuelMath'

type Props = {
  vehicle: Vehicle
  vehicles: Vehicle[]
  onSelect: (id: string) => void
  percent: number
  liters: number
  rangeKm: number
}

/** The home "cluster": which car, how far it goes, how full it is. */
export function VehicleHeroCard({ vehicle, vehicles, onSelect, percent, liters, rangeKm }: Props) {
  const filled = barsFilled(vehicle.fuel_gauge_bars, percent)

  return (
    <section aria-label="Active vehicle" className="-mx-4 sm:mx-0">
      <div className="flex items-end justify-between gap-3 px-4 sm:px-0">
        <div className="min-w-0">
          <h2 className="title truncate text-[1.75rem] text-fg">
            {vehicle.make} <span className="text-fg-2">{vehicle.model}</span>
          </h2>
          <p className="unit mt-1">
            {vehicle.year} · {vehicle.engine} · {vehicle.fuel_type}
          </p>
        </div>
        <Link to="/app/vehicles" className="shrink-0 text-sm font-medium text-fg-2 underline decoration-line-strong underline-offset-4 hover:text-fg">
          Garage
        </Link>
      </div>

      {vehicles.length > 1 && (
        <div className="mt-4 flex gap-5 overflow-x-auto border-b border-line px-4 sm:px-0" role="tablist" aria-label="Switch vehicle">
          {vehicles.map((v) => {
            const active = v.id === vehicle.id
            return (
              <button
                key={v.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelect(v.id)}
                className={`-mb-px shrink-0 border-b-2 pb-2.5 text-sm font-semibold transition ${
                  active ? 'border-signal text-fg' : 'border-transparent text-fg-3 hover:text-fg-2'
                }`}
              >
                {v.model}
              </button>
            )
          })}
        </div>
      )}

      <CarViewer vehicle={vehicle} variant="banner" autoRotate />

      <Link to="/app/fuel/level" className="group block px-4 sm:px-0" aria-label="Adjust fuel level">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="readout text-[5.5rem] text-fg">
              {Math.round(rangeKm).toLocaleString('en-US')}
              <span className="unit ml-2 text-sm">km</span>
            </p>
            <p className="mt-2 text-sm text-fg-3">range on what&apos;s in the tank</p>
          </div>
          <div className="pb-1 text-right">
            <p className="readout text-3xl text-fg">
              {liters.toFixed(1)}
              <span className="unit ml-1">L</span>
            </p>
            <p className="unit mt-1">
              {filled}/{vehicle.fuel_gauge_bars} bars · {Math.round(percent)}%
            </p>
          </div>
        </div>
        <FuelSegments className="mt-5" percent={percent} bars={vehicle.fuel_gauge_bars} />
        <p className="mt-2 text-right text-xs text-fg-3 transition group-hover:text-signal">Tap to update fuel level →</p>
      </Link>
    </section>
  )
}
