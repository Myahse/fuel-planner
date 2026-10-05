import { NavLink } from 'react-router-dom'
import { Home, Map, Fuel, MoreHorizontal, Route } from 'lucide-react'

const items = [
  { to: '/app', label: 'Home', icon: Home, end: true },
  { to: '/app/map', label: 'Map', icon: Map },
  { to: '/app/plan', label: 'Plan', icon: Route, primary: true },
  { to: '/app/stations', label: 'Stations', icon: Fuel },
  { to: '/app/more', label: 'More', icon: MoreHorizontal },
]

export function BottomNavigation() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      aria-label="Main"
    >
      <div className="mx-auto flex max-w-xl items-stretch justify-around">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className="group relative flex flex-1 flex-col items-center gap-1 pb-2 pt-2.5">
            {({ isActive }) =>
              item.primary ? (
                <>
                  <span className="flex h-9 w-12 items-center justify-center rounded-sm bg-signal text-signal-ink transition group-hover:bg-signal-hi">
                    <item.icon className="h-5 w-5" strokeWidth={2.25} />
                  </span>
                  <span className="text-[11px] font-semibold text-fg">{item.label}</span>
                </>
              ) : (
                <>
                  <span
                    className={`absolute inset-x-5 top-0 h-0.5 rounded-b-sm transition ${isActive ? 'bg-signal' : 'bg-transparent'}`}
                    aria-hidden
                  />
                  <span className="flex h-9 items-center">
                    <item.icon className={`h-5 w-5 ${isActive ? 'text-fg' : 'text-fg-3'}`} strokeWidth={isActive ? 2.25 : 1.75} />
                  </span>
                  <span className={`text-[11px] font-medium ${isActive ? 'text-fg' : 'text-fg-3'}`}>{item.label}</span>
                </>
              )
            }
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
