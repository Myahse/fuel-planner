import { Link } from 'react-router-dom'
import { ChevronRight, Car, Fuel, Globe, Map, Languages, Palette } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { useAppStore } from '../store/appStore'
import { ToggleRow, Card } from '../components/ui'

function Row({ icon: Icon, label, value, to }: { icon: typeof Car; label: string; value?: string; to?: string }) {
  const inner = (
    <div className="flex items-center gap-3 py-3.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-800">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-ink">{label}</p>
        {value && <p className="text-xs text-muted">{value}</p>}
      </div>
      <ChevronRight className="h-4 w-4 text-slate-400" />
    </div>
  )
  if (to) return <Link to={to}>{inner}</Link>
  return inner
}

export function SettingsPage() {
  const store = useAppStore()

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" backTo="/app/more" />

      <Card className="divide-y divide-slate-100">
        <p className="pb-2 text-xs font-bold uppercase tracking-wide text-muted">Vehicle & Fuel</p>
        <Row icon={Car} label="My Vehicles" to="/app/vehicles" />
        <Row icon={Fuel} label="Fuel Prices" value={`${store.fuelPricePerLiter} FCFA/L`} to="/app/settings/fuel-price" />
        <Row icon={Fuel} label="Fuel Type" value="Petrol" />
        <Row icon={Car} label="Default Vehicle" to="/app/vehicles" />
      </Card>

      <Card className="divide-y divide-slate-100">
        <p className="pb-2 text-xs font-bold uppercase tracking-wide text-muted">Units & Region</p>
        <Row icon={Globe} label="Distance" value="Kilometers (km)" />
        <Row icon={Fuel} label="Fuel Consumption" value="L/100 km" />
        <Row icon={Globe} label="Currency" value={store.currency} />
        <Row icon={Globe} label="Country" value={store.country} />
      </Card>

      <Card>
        <p className="pb-2 text-xs font-bold uppercase tracking-wide text-muted">App</p>
        <ToggleRow
          label="Notifications"
          checked={store.notificationsEnabled}
          onChange={store.setNotificationsEnabled}
        />
        <ToggleRow
          label="Offline Maps"
          checked={store.offlineMapsEnabled}
          onChange={store.setOfflineMapsEnabled}
        />
        <Row icon={Languages} label="Language" value={store.language} />
        <Row icon={Palette} label="Theme" value={store.theme} />
        <Row icon={Map} label="Map provider" value="OpenStreetMap" />
      </Card>
    </div>
  )
}
