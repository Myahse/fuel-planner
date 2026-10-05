import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { useAppStore } from '../store/appStore'
import { ToggleRow } from '../components/ui'

function Row({ label, value, to }: { label: string; value?: ReactNode; to?: string }) {
  const inner = (
    <>
      <span className="flex-1 text-sm font-medium text-fg">{label}</span>
      {value && <span className="text-sm text-fg-3">{value}</span>}
      {to && <ChevronRight className="h-4 w-4 text-fg-3" />}
    </>
  )
  return to ? (
    <Link to={to} className="flex items-center gap-3 py-3.5 transition hover:text-signal">
      {inner}
    </Link>
  ) : (
    <div className="flex items-center gap-3 py-3.5">{inner}</div>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-1 text-sm font-semibold text-fg-2">{title}</h2>
      <div className="divide-y divide-line border-y border-line">{children}</div>
    </section>
  )
}

export function SettingsPage() {
  const store = useAppStore()

  return (
    <div className="space-y-8">
      <PageHeader title="Settings" backTo="/app/more" />

      <Group title="Vehicle & fuel">
        <Row label="Garage" to="/app/vehicles" />
        <Row label="Fuel price" value={`${store.fuelPricePerLiter} FCFA/L`} />
      </Group>

      <Group title="Units & region">
        <Row label="Distance" value="Kilometres" />
        <Row label="Consumption" value="L/100 km" />
        <Row label="Currency" value={store.currency} />
        <Row label="Country" value={store.country} />
      </Group>

      <Group title="App">
        <ToggleRow label="Notifications" checked={store.notificationsEnabled} onChange={store.setNotificationsEnabled} />
        <ToggleRow label="Offline maps" checked={store.offlineMapsEnabled} onChange={store.setOfflineMapsEnabled} />
        <Row label="Language" value={store.language} />
        <Row label="Map data" value="OpenStreetMap · CARTO" />
      </Group>
    </div>
  )
}
