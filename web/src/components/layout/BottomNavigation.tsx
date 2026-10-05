import { NavLink } from 'react-router-dom'
import { Home, Map, Fuel, Menu, Route } from 'lucide-react'

const items = [
  { to: '/app', label: 'Home', icon: Home, end: true },
  { to: '/app/map', label: 'Map', icon: Map },
  { to: '/app/plan', label: 'Plan', icon: Route },
  { to: '/app/stations', label: 'Stations', icon: Fuel },
  { to: '/app/more', label: 'More', icon: Menu },
]

export function BottomNavigation() {
  return (
    <nav className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 lg:hidden" aria-label="Main">
      <div className="mx-auto flex h-[64px] max-w-xl items-center justify-around rounded-full border border-fg/12 bg-panel/80 px-2 shadow-[0_18px_40px_-14px_rgb(0_0_0/0.8)] backdrop-blur-xl">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} aria-label={item.label} className="flex h-12 items-center">
            {({ isActive }) => (
              <span
                className={`flex h-11 items-center gap-2 rounded-full px-4 transition-colors ${
                  isActive ? 'bg-fg text-signal-ink' : 'text-fg-3 hover:text-fg'
                }`}
              >
                <item.icon className="h-[22px] w-[22px]" strokeWidth={2.2} />
                {isActive && <span className="text-[13px] font-extrabold">{item.label}</span>}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
