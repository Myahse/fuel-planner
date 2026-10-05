import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { BrandMark } from '../components/layout/BrandMark'

const links = [
  { to: '/app/vehicles', label: 'Garage', hint: 'Your vehicles, paint and body' },
  { to: '/app/fuel/add', label: 'Log a fill-up', hint: 'Keeps the estimate honest' },
  { to: '/app/history', label: 'Trips', hint: 'Everything you planned' },
  { to: '/app/statistics', label: 'Statistics', hint: 'Fuel and money over time' },
  { to: '/app/settings', label: 'Settings', hint: 'Units, prices, region' },
]

export function MorePage() {
  const { displayName } = useAppStore()

  return (
    <div className="space-y-8 pt-2">
      <header className="flex items-center justify-between">
        <BrandMark />
        <span className="flex items-center gap-3 text-sm text-fg-2">
          {displayName}
          <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-panel-3 font-semibold text-fg">
            {displayName.slice(0, 1).toUpperCase()}
          </span>
        </span>
      </header>

      <nav aria-label="More">
        <ul className="-mx-4 divide-y divide-line border-y border-line sm:mx-0">
          {links.map((l) => (
            <li key={l.to}>
              <Link to={l.to} className="group flex items-center gap-4 px-4 py-5">
                <span className="min-w-0 flex-1">
                  <span className="title block text-2xl text-fg">{l.label}</span>
                  <span className="mt-1 block text-sm text-fg-3">{l.hint}</span>
                </span>
                <ArrowUpRight className="h-5 w-5 text-fg-3 transition group-hover:text-signal" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
