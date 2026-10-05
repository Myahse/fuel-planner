import { Link, useLocation } from 'react-router-dom'
import { PRODUCT } from '../../config/product'

const titles: Record<string, string> = {
  '/app': 'Home',
  '/app/plan': 'Plan a Trip',
  '/app/map': 'Map',
  '/app/stations': 'Fuel Stations',
  '/app/history': 'History',
  '/app/more': 'More',
  '/app/settings': 'Settings',
  '/app/statistics': 'Statistics',
  '/app/vehicles': 'Vehicles',
}

function titleFor(path: string) {
  if (titles[path]) return titles[path]
  if (path.startsWith('/app/vehicles')) return 'Vehicles'
  if (path.startsWith('/app/fuel')) return 'Fuel'
  if (path.includes('trip')) return 'Trip'
  return PRODUCT.name
}

export function MobileAppBar() {
  const { pathname } = useLocation()
  const isHome = pathname === '/app' || pathname === '/app/'

  if (isHome) return null

  return (
    <header className="sticky top-0 z-20 border-b border-white/60 bg-white/70 px-4 py-3 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-xl items-center justify-between">
        <p className="text-sm font-bold tracking-tight text-brand-800">{titleFor(pathname)}</p>
        <Link to="/app" className="eyebrow text-brand-700 hover:text-brand-800">
          {PRODUCT.name}
        </Link>
      </div>
    </header>
  )
}
