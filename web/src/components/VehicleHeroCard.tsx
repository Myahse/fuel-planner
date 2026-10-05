import { Link } from 'react-router-dom'
import type { Vehicle } from '../api/types'
import { CarViewer } from './car3d/CarViewer'
import { FlipDigits } from './retro/FlipDigits'
import { RetroDial } from './retro/RetroDial'
import { barsFilled } from '../lib/fuelMath'

type Props = {
  vehicle: Vehicle
  vehicles: Vehicle[]
  onSelect: (id: string) => void
  percent: number
  liters: number
  rangeKm: number
  pricePerLiter: number
  verdict?: string
}

/** Home hero: the car on its pump island, then the pump display and the dial. */
export function VehicleHeroCard({ vehicle, vehicles, onSelect, percent, liters, rangeKm, pricePerLiter, verdict }: Props) {
  const filled = barsFilled(vehicle.fuel_gauge_bars, percent)
  const mood = percent < 20 ? 'Running low — find a pump soon.' : percent < 45 ? 'Fine for town, top up before a long drive.' : 'Plenty for today.'

  return (
    <section aria-label="Active vehicle" className="space-y-4">
      {vehicles.length > 1 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Switch vehicle">
          {vehicles.map((v) => {
            const active = v.id === vehicle.id
            return (
              <button
                key={v.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelect(v.id)}
                className={`shrink-0 rounded-full border-[2.5px] border-espresso px-4 py-1.5 text-sm font-bold transition ${
                  active ? 'bg-espresso text-digit' : 'bg-panel text-fg hover:bg-panel-2'
                }`}
              >
                {v.make} {v.model}
              </button>
            )
          })}
        </div>
      )}

      <div className="relative">
        <CarViewer vehicle={vehicle} variant="banner" autoRotate className="rounded-[26px] border-[2.5px] border-espresso bg-panel" />
        <Link to="/app/vehicles" className="absolute right-3 top-3 rounded-full border-2 border-espresso bg-mustard px-3 py-1 text-xs font-bold text-espresso">
          Garage →
        </Link>
      </div>

      <Link to="/app/fuel/level" aria-label="Adjust fuel level" className="pump block p-4 transition active:translate-y-0.5">
        <div className="flex items-center justify-between gap-3">
          <span className="unit !text-mustard">range · km</span>
          <FlipDigits value={String(Math.round(rangeKm))} size="lg" label={`${Math.round(rangeKm)} kilometres of range`} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <span className="unit mb-1.5 block !text-mustard">litres</span>
            <FlipDigits value={liters.toFixed(1)} size="sm" label={`${liters.toFixed(1)} litres`} />
          </div>
          <div>
            <span className="unit mb-1.5 block !text-mustard">fcfa / litre</span>
            <FlipDigits value={String(Math.round(pricePerLiter))} size="sm" label={`${Math.round(pricePerLiter)} francs per litre`} />
          </div>
        </div>
      </Link>

      <Link to="/app/fuel/level" className="ticket flex items-center gap-4 px-4 py-3 transition hover:bg-panel-2">
        <RetroDial percent={percent} bars={vehicle.fuel_gauge_bars} size={120} />
        <span className="min-w-0">
          <span className="block text-[17px] font-bold leading-snug text-fg">
            {filled} of {vehicle.fuel_gauge_bars} bars — {mood.toLowerCase()}
          </span>
          <span className="mt-1 block text-sm text-fg-2">{verdict ?? 'Tap to match your dashboard.'}</span>
        </span>
      </Link>
    </section>
  )
}
