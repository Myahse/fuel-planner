import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { logout } from '../api/endpoints'
import { PageHeader } from '../components/layout/PageHeader'
import { MAPBOX_TOKEN } from '../config/mapbox'
import { useAppStore } from '../store/appStore'
import { ToggleRow } from '../components/ui'
import { requestLiquidMotion, type MotionStatus } from '../lib/liquidMotion'
import { useLiquidMotionStatus } from '../components/LiquidMotionSync'

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
  const navigate = useNavigate()

  function handleSignOut() {
    logout()
    navigate('/auth?mode=login', { replace: true })
  }

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
        <div className="py-3">
          <p className="mb-2 text-sm font-medium text-fg">Appearance</p>
          <div className="seg" role="group" aria-label="Theme">
            {(
              [
                ['system', 'System'],
                ['light', 'Light'],
                ['dark', 'Dark'],
              ] as const
            ).map(([id, label]) => (
              <button key={id} type="button" aria-pressed={store.theme === id} onClick={() => store.setTheme(id)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <ToggleRow
          label="Fuel follows phone movement"
          checked={store.liquidMotion}
          onChange={(on) => {
            store.setLiquidMotion(on)
            // iOS asks for motion access here, inside the tap.
            if (on) void requestLiquidMotion()
          }}
        />
        {store.liquidMotion && <MotionStatusNote />}
        <ToggleRow label="Notifications" checked={store.notificationsEnabled} onChange={store.setNotificationsEnabled} />
        <ToggleRow label="Offline maps" checked={store.offlineMapsEnabled} onChange={store.setOfflineMapsEnabled} />
        <Row label="Language" value={store.language} />
        <Row label="Map data" value={MAPBOX_TOKEN ? 'Mapbox' : 'OpenStreetMap · CARTO'} />
      </Group>

      <Group title="Account">
        <div className="py-3.5">
          <button type="button" className="btn btn-danger w-full" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </Group>
    </div>
  )
}

const MOTION_NOTES: Record<MotionStatus, string> = {
  active: 'Motion sensors are on. Tilt or shake your phone.',
  waiting: 'Waiting for motion sensors. Desktops have none; the fuel sloshes when you scroll.',
  'needs-permission': 'Tap the switch off and on to allow motion on this iPhone.',
  denied: 'Motion access was refused. Allow it in Safari settings for this site, then reload.',
  insecure: 'Phones only share motion with secure (https) pages. Open the app over https.',
  unsupported: 'This browser has no motion sensors.',
  off: '',
}

function MotionStatusNote() {
  const status = useLiquidMotionStatus()
  const ok = status === 'active'
  return (
    <p className="-mt-1 flex items-start gap-2 pb-3 text-xs font-semibold text-fg-3">
      <span className={`lamp mt-1 shrink-0 ${ok ? 'text-ok' : 'text-warn'}`} aria-hidden />
      {MOTION_NOTES[status]}
    </p>
  )
}
