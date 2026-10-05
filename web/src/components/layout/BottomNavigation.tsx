import { NavLink } from 'react-router-dom'
import { Home, Map, Fuel, History, MoreHorizontal } from 'lucide-react'

const items = [
  { to: '/app', label: 'Home', icon: Home, end: true },
  { to: '/app/map', label: 'Map', icon: Map },
  { to: '/app/stations', label: 'Stations', icon: Fuel },
  { to: '/app/history', label: 'History', icon: History },
  { to: '/app/more', label: 'More', icon: MoreHorizontal },
]

export function BottomNavigation() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 lg:hidden">
      <div className="mx-3 mb-[max(0.5rem,env(safe-area-inset-bottom))] rounded-2xl border border-white/80 bg-white/90 shadow-float backdrop-blur-xl">
        <div className="flex justify-around px-1 py-2">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className="flex min-w-[56px] flex-col items-center gap-0.5 rounded-xl px-2 py-1.5"
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                      isActive ? 'bg-brand-800 text-white shadow-sm' : 'text-muted'
                    }`}
                  >
                    <item.icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 2} />
                  </span>
                  <span
                    className={`text-[10px] font-semibold ${isActive ? 'text-brand-800' : 'text-muted'}`}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
