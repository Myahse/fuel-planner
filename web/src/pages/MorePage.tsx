import { Link } from 'react-router-dom'
import { Settings, BarChart3, Car, Droplets, User } from 'lucide-react'
import { PRODUCT } from '../config/product'
import { useAppStore } from '../store/appStore'

export function MorePage() {
  const { displayName } = useAppStore()
  const links = [
    { to: '/app/statistics', label: 'Statistics', icon: BarChart3 },
    { to: '/app/settings', label: 'Settings', icon: Settings },
    { to: '/app/vehicles', label: 'My Vehicles', icon: Car },
    { to: '/app/fuel/add', label: 'Add Fuel', icon: Droplets },
  ]

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-brand-800 p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
            <User className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm opacity-80">{PRODUCT.name}</p>
            <p className="text-xl font-bold">{displayName}</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-card">
        {links.map((l) => (
          <Link key={l.to} to={l.to} className="flex items-center gap-3 border-b border-slate-100 px-4 py-4 last:border-0">
            <l.icon className="h-5 w-5 text-brand-800" />
            <span className="flex-1 font-semibold text-ink">{l.label}</span>
            <span className="text-muted">→</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
