import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { Vehicle } from '../api/types'
import { CarViewer } from './car3d/CarViewer'
import { VehicleSilhouette } from './car3d/VehicleSilhouette'
import { ProgressBar } from './ProgressBar'
import { resolveBodyType, resolvePaint } from '../config/vehicleModels'
import { barsFilled } from '../lib/fuelMath'
import { formatLiters } from '../lib/format'

type Props = {
  vehicle: Vehicle
  vehicles: Vehicle[]
  onSelect: (id: string) => void
  percent: number
  liters: number
  rangeKm: number
}

/** One card for "which car, how much fuel, how far" — replaces the separate hero, chip and fuel cards. */
export function VehicleHeroCard({ vehicle, vehicles, onSelect, percent, liters, rangeKm }: Props) {
  const filled = barsFilled(vehicle.fuel_gauge_bars, percent)

  return (
    <section className="card-surface overflow-hidden p-0" aria-label="Active vehicle">
      <div className="relative">
        <CarViewer vehicle={vehicle} variant="banner" autoRotate />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4">
          <div>
            <p className="text-lg font-bold leading-tight text-ink">
              {vehicle.make} {vehicle.model}
            </p>
            <p className="text-xs font-medium capitalize text-muted">
              {vehicle.year} • {vehicle.fuel_type}
            </p>
          </div>
          <Link
            to="/app/vehicles"
            className="pointer-events-auto rounded-full border border-white/70 bg-white/85 px-3 py-1 text-xs font-semibold text-brand-800 shadow-sm backdrop-blur"
          >
            Manage
          </Link>
        </div>
      </div>

      {vehicles.length > 1 && (
        <div className="flex gap-2 overflow-x-auto border-t border-slate-100 px-4 py-3" role="radiogroup" aria-label="Switch vehicle">
          {vehicles.map((v) => {
            const active = v.id === vehicle.id
            return (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onSelect(v.id)}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                  active ? 'border-brand-700 bg-brand-50 text-brand-800' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <VehicleSilhouette bodyType={resolveBodyType(v)} paint={resolvePaint(v.make, v.paint_color)} className="h-5 w-12 text-slate-900" />
                {v.model}
              </button>
            )
          })}
        </div>
      )}

      <Link to="/app/fuel/level" className="group block border-t border-slate-100 p-5 transition hover:bg-slate-50/60">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[2.5rem] font-extrabold leading-none tracking-tight text-brand-800">
              {Math.round(rangeKm).toLocaleString('en-US')}
              <span className="ml-1 text-lg font-bold text-brand-700/80">km</span>
            </p>
            <p className="mt-1 text-sm font-medium text-muted">Estimated range</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-ink">
              {filled}/{vehicle.fuel_gauge_bars} bars <span className="font-normal text-muted">≈{Math.round(percent)}%</span>
            </p>
            <p className="text-xs text-muted">
              {formatLiters(liters)} of {formatLiters(vehicle.tank_capacity_liters, 0)}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <ProgressBar percent={percent} />
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5" />
        </div>
      </Link>
    </section>
  )
}
