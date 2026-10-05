import { NavLink } from 'react-router-dom'
import { Home, Map, Fuel, Car, History, BarChart3, Settings, Route } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { BrandMark } from './BrandMark'

const groups = [
  [
    { to: '/app', label: 'Home', icon: Home, end: true },
    { to: '/app/plan', label: 'Plan a trip', icon: Route },
    { to: '/app/map', label: 'Map', icon: Map },
    { to: '/app/stations', label: 'Fuel stations', icon: Fuel },
  ],
  [
    { to: '/app/vehicles', label: 'Garage', icon: Car },
    { to: '/app/history', label: 'Trips', icon: History },
    { to: '/app/statistics', label: 'Statistics', icon: BarChart3 },
    { to: '/app/settings', label: 'Settings', icon: Settings },
  ],
]

export function Sidebar() {
  const displayName = useAppStore((s) => s.displayName)

  return (
    <aside className="hidden overflow-hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[248px] lg:shrink-0 lg:flex-col lg:border-r lg:border-fg/10 lg:px-4 lg:py-7">
      <div className="px-3">
        <BrandMark />
      </div>

      <nav className="mt-10 flex flex-1 flex-col gap-6" aria-label="Main">
        {groups.map((group, gi) => (
          <ul key={gi} className="space-y-1">
            {group.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-full px-4 py-2.5 text-[15px] font-bold transition ${
                      isActive ? 'bg-fg text-signal-ink' : 'text-fg-2 hover:bg-fg/8 hover:text-fg'
                    }`
                  }
                >
                  <item.icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        ))}
      </nav>

      <div className="glass flex items-center gap-3 px-3 py-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-b from-fuel-1 to-fuel-2 font-[family-name:var(--font-display)] text-signal-ink">
          {displayName.slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0 truncate font-bold text-fg">{displayName}</span>
      </div>
    </aside>
  )
}
