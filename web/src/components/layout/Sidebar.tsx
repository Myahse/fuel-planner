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
    { to: '/app/vehicles', label: 'Vehicles', icon: Car },
    { to: '/app/history', label: 'History', icon: History },
    { to: '/app/statistics', label: 'Statistics', icon: BarChart3 },
    { to: '/app/settings', label: 'Settings', icon: Settings },
  ],
]

export function Sidebar() {
  const displayName = useAppStore((s) => s.displayName)

  return (
    <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[232px] lg:shrink-0 lg:flex-col lg:border-r lg:border-line lg:px-3 lg:py-6">
      <div className="px-3">
        <BrandMark />
      </div>

      <nav className="mt-10 flex flex-1 flex-col gap-6" aria-label="Main">
        {groups.map((group, gi) => (
          <ul key={gi} className="space-y-px">
            {group.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `relative flex items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium transition ${
                      isActive ? 'bg-panel-2 text-fg' : 'text-fg-3 hover:bg-panel hover:text-fg'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-r-sm bg-signal" />}
                      <item.icon className="h-4 w-4" strokeWidth={isActive ? 2.25 : 1.75} />
                      {item.label}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        ))}
      </nav>

      <div className="flex items-center gap-3 border-t border-line px-3 pt-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-panel-3 text-sm font-semibold text-fg">
          {displayName.slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0 truncate text-sm font-medium text-fg-2">{displayName}</span>
      </div>
    </aside>
  )
}
