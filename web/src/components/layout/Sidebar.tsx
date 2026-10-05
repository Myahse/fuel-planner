import { NavLink } from 'react-router-dom'
import {
  Home,
  Map,
  Fuel,
  Car,
  History,
  BarChart3,
  Settings,
  Route,
} from 'lucide-react'
import { PRODUCT } from '../../config/product'
import { useAppStore } from '../../store/appStore'

const items = [
  { to: '/app', label: 'Home', icon: Home, end: true },
  { to: '/app/plan', label: 'Plan Trip', icon: Route },
  { to: '/app/map', label: 'Map', icon: Map },
  { to: '/app/stations', label: 'Fuel Stations', icon: Fuel },
  { to: '/app/vehicles', label: 'Vehicles', icon: Car },
  { to: '/app/history', label: 'History', icon: History },
  { to: '/app/statistics', label: 'Statistics', icon: BarChart3 },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const displayName = useAppStore((s) => s.displayName)

  return (
    <aside className="hidden lg:flex lg:w-[272px] lg:flex-col lg:border-r lg:border-slate-200/60 lg:bg-white/80 lg:px-4 lg:py-7 lg:backdrop-blur-xl">
      <div className="flex items-center gap-3 px-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-800 to-brand-600 text-sm font-extrabold text-white shadow-md">
          F
        </div>
        <div>
          <p className="text-lg font-bold tracking-tight text-brand-900">{PRODUCT.name}</p>
          <p className="text-[11px] font-medium text-muted">Fuel intelligence</p>
        </div>
      </div>

      <nav className="mt-9 flex flex-1 flex-col gap-0.5">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? 'bg-brand-50 text-brand-800 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-ink'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-full bg-brand-700" />
                )}
                <item.icon
                  className={`h-4 w-4 ${isActive ? 'text-brand-800' : 'text-slate-400 group-hover:text-brand-700'}`}
                  strokeWidth={2.2}
                />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-4 rounded-2xl border border-slate-200/80 bg-surface p-3">
        <p className="eyebrow">Signed in</p>
        <p className="mt-1 truncate text-sm font-semibold text-ink">{displayName}</p>
      </div>
    </aside>
  )
}
