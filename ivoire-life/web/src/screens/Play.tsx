import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, Building2, Bus, CarTaxiFront, ChevronLeft, ChevronRight, Clock3, Dice5, House, Lock, MapPin, Sparkles, TriangleAlert, X, type LucideIcon } from 'lucide-react'
import { api } from '../lib/api'
import type { ActionResult, City, Commune, Interaction, JournalEvent, Sim, World } from '../lib/types'
import { useWorld } from '../store/world'
import { GameMap } from '../components/map/GameMap'
import { boundsFor, pinsFor, type Focus, type Padding } from '../components/map/pins'
import { SimAvatar } from '../components/SimAvatar'
import { iconFor, kindColors } from '../components/icons'
import { Chip, Coin, DayNight, IconTile, MotiveRing, Plumbob, needColor } from '../components/ui'
import { NEEDS, amount, available, clock, decay, duration, mood, trip } from '../game/rules'

const MAX_LOCAL_CATCH_UP = 180 // game minutes, mirrors the server cap
const SHEET_PEEK = 0.38 // share of the screen the mobile sheet covers when collapsed

type Toast = { id: number; title: string; text?: string; money: number; tone: 'random' | 'done' | 'error'; kind?: string; icon?: string }

function useIsDesktop() {
  const q = '(min-width: 1024px)'
  const [match, setMatch] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const m = window.matchMedia(q)
    const on = () => setMatch(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return match
}

export function Play() {
  const world = useWorld((s) => s.world)!
  const navigate = useNavigate()
  const desktop = useIsDesktop()

  const [base, setBase] = useState<{ sim: Sim; at: number } | null>(null)
  const [journal, setJournal] = useState<JournalEvent[]>([])
  const [seen, setSeen] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [focus, setFocus] = useState<Focus>({})
  const [placeId, setPlaceId] = useState<string | null>(null)
  const [journalOpen, setJournalOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [pending, setPending] = useState<{ label: string; icon: string; kind: string } | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    api.sims().then(async (sims) => {
      if (!sims.length) return navigate('/creer', { replace: true })
      const full = await api.sim(sims[0].id)
      setBase({ sim: full, at: Date.now() })
      setJournal(full.journal)
      setSeen(full.journal[0]?.id ?? 0)
      setFocus({ cityId: full.city, communeId: full.commune })
    })
  }, [navigate])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  // Between server round-trips the clock and needs advance locally.
  const sim = useMemo(() => {
    if (!base) return null
    const mins = Math.min(Math.floor((now - base.at) / 1000), MAX_LOCAL_CATCH_UP)
    return { ...base.sim, gameMinutes: base.sim.gameMinutes + mins, needs: decay(base.sim.needs, mins) }
  }, [base, now])

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random()
    setToasts((ts) => [...ts.slice(-1), { ...t, id }])
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 5000)
  }, [])

  async function run(label: string, icon: string, kind: string, call: () => Promise<ActionResult>) {
    setPending({ label, icon, kind })
    const started = Date.now()
    try {
      const res = await call()
      await new Promise((r) => setTimeout(r, Math.max(0, 1500 - (Date.now() - started))))
      setBase({ sim: res.sim, at: Date.now() })
      setJournal(res.journal)
      toast({ tone: 'done', title: res.outcome.text, money: res.outcome.money, kind, icon })
      if (res.outcome.random) setTimeout(() => toast({ tone: 'random', title: 'Imprévu !', text: res.outcome.random!.text, money: res.outcome.random!.money }), 600)
      return true
    } catch (e) {
      toast({ tone: 'error', title: 'Pas possible', text: e instanceof Error ? e.message : 'Erreur', money: 0 })
      return false
    } finally {
      setPending(null)
    }
  }

  const interact = (it: Interaction, kind: string) => {
    const id = placeId!
    setPlaceId(null)
    run(it.label, it.icon, kind, () => api.interact(sim!.id, id, it.id))
  }
  const travel = (cityId: string, communeId: string, label: string) => {
    setPlaceId(null)
    run(label, 'bus', 'transport', () => api.travel(sim!.id, cityId, communeId)).then((ok) => ok && setFocus({ cityId, communeId }))
  }

  // Pins only change when something visible on them changes.
  const moodHex = sim ? needColor(mood(sim.needs)) : ''
  const pinSim = useMemo(() => sim, [sim?.id, sim?.city, sim?.commune, moodHex]) // eslint-disable-line react-hooks/exhaustive-deps
  const bounds = useMemo(() => boundsFor(world, focus), [world, focus])
  const pins = useMemo(
    () =>
      pinsFor(world, focus, pinSim, placeId, {
        onCity: (cityId) => setFocus({ cityId }),
        onCommune: (cityId, communeId) => setFocus({ cityId, communeId }),
        onPlace: setPlaceId,
      }),
    [world, focus, pinSim, placeId],
  )
  const padding = useMemo<Padding>(
    () => (desktop ? { top: 110, bottom: 60, left: 440, right: 80 } : { top: 120, bottom: Math.round(window.innerHeight * SHEET_PEEK) + 30, left: 24, right: 24 }),
    [desktop],
  )

  if (!sim) {
    return (
      <div className="grid h-full place-items-center bg-[var(--color-night)] text-white">
        <div className="flex flex-col items-center gap-3">
          <Plumbob size={22} />
          <span className="font-display text-xl font-bold">Chargement de Babi…</span>
        </div>
      </div>
    )
  }

  const c = clock(sim.gameMinutes)
  const city = world.cities.find((x) => x.id === focus.cityId)
  const commune = city?.communes.find((x) => x.id === focus.communeId)
  const unseen = journal.filter((e) => e.id > seen).length

  return (
    <div className="relative h-full overflow-hidden bg-[var(--color-night)] select-none">
      <GameMap pins={pins} bounds={bounds} night={c.isNight} sim={pinSim} padding={padding} />

      {/* ---------- Top HUD ---------- */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] lg:p-5">
        <Link to="/profil" className="hud pointer-events-auto flex items-center gap-2.5 rounded-full py-1 pr-4 pl-1 transition active:scale-95">
          <span className="relative">
            <span className="block rounded-full p-[3px]" style={{ background: `conic-gradient(${moodHex} ${mood(sim.needs) * 3.6}deg, #e7e9f2 0)` }}>
              <span className="block h-11 w-11 overflow-hidden rounded-full border-2 border-white bg-gradient-to-b from-[#ffe7c7] to-[#ffb27a]">
                <SimAvatar look={sim.look} gender={sim.gender} crop="head" size={40} animated={false} />
              </span>
            </span>
          </span>
          <span className="leading-tight">
            <span className="block font-display text-[17px] font-extrabold">{sim.firstName}</span>
            <span className="flex items-center gap-1 text-[11px] font-extrabold text-[var(--color-ink-soft)]">
              <MapPin size={11} strokeWidth={3} />
              {world.cities.find((x) => x.id === sim.city)?.communes.find((x) => x.id === sim.commune)?.name}
            </span>
          </span>
        </Link>

        <div className="pointer-events-auto flex items-center gap-2">
          <div key={sim.money} className="hud animate-pop flex h-11 items-center gap-1.5 rounded-full pr-4 pl-1.5">
            <Coin size={30} />
            <span className="tnum font-display text-lg font-extrabold">{amount(sim.money)}</span>
          </div>
          <div className="hud flex h-11 items-center gap-1.5 rounded-full px-3 max-sm:hidden">
            <DayNight night={c.isNight} />
            <span className="tnum font-display text-lg font-extrabold">{c.time}</span>
            <span className="text-xs font-extrabold text-[var(--color-ink-soft)]">J{c.day}</span>
          </div>
          <button className="hud relative grid h-11 w-11 place-items-center rounded-full" onClick={() => (setJournalOpen(true), setSeen(journal[0]?.id ?? 0))} aria-label="Journal">
            <BookOpen size={20} strokeWidth={2.4} />
            {unseen > 0 && <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--color-rose)] px-1 text-[11px] font-extrabold text-white ring-2 ring-white">{unseen}</span>}
          </button>
        </div>
      </header>

      {/* Mobile clock sits under the HUD */}
      <div className="hud pointer-events-none absolute top-[4.4rem] right-3 z-10 flex h-9 items-center gap-1.5 rounded-full px-3 sm:hidden">
        <DayNight night={c.isNight} size={15} />
        <span className="tnum font-display font-extrabold">{c.time}</span>
        <span className="text-[11px] font-extrabold text-[var(--color-ink-soft)]">J{c.day}</span>
      </div>

      {/* ---------- Panel: bottom sheet on mobile, floating card on desktop ---------- */}
      <aside
        className="sheet absolute inset-x-0 bottom-0 z-10 flex flex-col rounded-t-[28px] transition-[height] duration-300 ease-out lg:top-24 lg:bottom-5 lg:left-5 lg:!h-auto lg:w-[400px] lg:rounded-[28px]"
        style={{ height: `${(expanded ? 0.72 : SHEET_PEEK) * 100}%` }}
      >
        <button className="mx-auto flex h-5 w-16 shrink-0 items-center justify-center lg:hidden" onClick={() => setExpanded(!expanded)} aria-label={expanded ? 'Réduire' : 'Agrandir'}>
          <span className="h-1.5 w-10 rounded-full bg-[var(--color-line)]" />
        </button>
        <div className="grid grid-cols-5 gap-1 px-3 pb-3 lg:px-5 lg:pt-5">
          {NEEDS.map((n) => (
            <MotiveRing key={n.key} value={sim.needs[n.key]} icon={n.icon} label={n.label} size={desktop ? 54 : 48} />
          ))}
        </div>
        <div className="h-px bg-[var(--color-line)]" />
        <div onScroll={(e) => !desktop && !expanded && e.currentTarget.scrollTop > 24 && setExpanded(true)} className="flex-1 overflow-y-auto px-3 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] lg:px-5">
          <Explore world={world} sim={sim} city={city} commune={commune} setFocus={(f) => (setFocus(f), setExpanded(false))} onPlace={setPlaceId} onTravel={travel} />
        </div>
      </aside>

      {placeId && city && commune && (
        <InteractionMenu
          world={world}
          sim={sim}
          city={city}
          commune={commune}
          placeId={placeId}
          hour={c.hour}
          desktop={desktop}
          onClose={() => setPlaceId(null)}
          onPick={interact}
          onTravel={travel}
        />
      )}

      {pending && <ActionProgress {...pending} name={sim.firstName} />}

      <div className="pointer-events-none absolute top-[7.5rem] left-1/2 z-40 flex w-[min(400px,calc(100vw-24px))] -translate-x-1/2 flex-col gap-2 lg:top-24">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} />
        ))}
      </div>

      {journalOpen && <JournalDrawer events={journal} onClose={() => setJournalOpen(false)} />}
    </div>
  )
}

/* ---------- Explore panel ---------- */

type ExploreProps = {
  world: World
  sim: Sim
  city?: City
  commune?: Commune
  setFocus: (f: Focus) => void
  onPlace: (id: string) => void
  onTravel: (cityId: string, communeId: string, label: string) => void
}

function Explore({ world, sim, city, commune, setFocus, onPlace, onTravel }: ExploreProps) {
  const simCity = world.cities.find((c) => c.id === sim.city)!
  const simCommune = simCity.communes.find((c) => c.id === sim.commune)!
  const here = (cityId: string, communeId?: string) => cityId === sim.city && (!communeId || communeId === sim.commune)
  const back = commune ? () => setFocus({ cityId: city!.id }) : city ? () => setFocus({}) : undefined

  return (
    <div className="animate-up" key={`${city?.id}-${commune?.id}`}>
      <div className="mb-3 flex items-start gap-2">
        {back && (
          <button className="icon-btn -ml-1 shrink-0 bg-[var(--color-canvas)]" onClick={back} aria-label="Retour">
            <ChevronLeft size={22} strokeWidth={2.6} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <div className="label">{commune ? city!.name : city ? "Côte d'Ivoire" : 'Carte'}</div>
          <h2 className="font-display text-[26px] leading-tight font-extrabold">{commune?.name ?? city?.name ?? 'Où aller ?'}</h2>
          <p className="text-sm leading-snug font-semibold text-[var(--color-ink-soft)]">{commune?.blurb ?? city?.blurb ?? 'Choisis une ville. Le car coûte du temps… et des francs.'}</p>
        </div>
      </div>

      {commune && !here(city!.id, commune.id) && <TravelCTA world={world} sim={sim} cityId={city!.id} communeId={commune.id} onTravel={onTravel} />}

      <ul className="space-y-2">
        {!city &&
          world.cities.map((c) => {
            const t = trip(simCity.id, simCommune, c.id, c.communes[0])
            return (
              <Row key={c.id} icon={c.id === sim.homeCity ? House : Building2} colors={['#ffa040', '#ff6a00']} title={c.name} sub={c.blurb} onClick={() => setFocus({ cityId: c.id })}>
                {here(c.id) ? <HereChip /> : <FareChip fare={t.fare} minutes={t.minutes} />}
              </Row>
            )
          })}

        {city &&
          !commune &&
          city.communes.map((cm) => {
            const t = trip(simCity.id, simCommune, city.id, cm)
            const home = city.id === sim.homeCity && cm.id === sim.homeCommune
            return (
              <Row key={cm.id} icon={home ? House : MapPin} colors={home ? ['#ffa040', '#ff6a00'] : ['#69e2a0', '#00a862']} title={cm.name} sub={cm.blurb} onClick={() => setFocus({ cityId: city.id, communeId: cm.id })}>
                {here(city.id, cm.id) ? <HereChip /> : <FareChip fare={t.fare} />}
              </Row>
            )
          })}

        {commune && (
          <>
            {sim.homeCity === city!.id && sim.homeCommune === commune.id && (
              <Row icon={House} colors={kindColors('home')} title="Chez toi" sub="Dormir, se doucher, cuisiner" onClick={() => onPlace('home')}>
                <ChevronRight size={20} className="text-[var(--color-ink-soft)]" />
              </Row>
            )}
            {commune.places.map((p) => {
              const k = world.kinds[p.kind]
              return (
                <Row key={p.id} icon={iconFor(k.icon)} colors={kindColors(p.kind)} title={p.name} sub={`${k.label} · ${k.interactions.length} activités`} onClick={() => onPlace(p.id)}>
                  <ChevronRight size={20} className="text-[var(--color-ink-soft)]" />
                </Row>
              )
            })}
          </>
        )}
      </ul>
    </div>
  )
}

function Row({ icon, colors, title, sub, onClick, children }: { icon: LucideIcon; colors: [string, string]; title: string; sub: string; onClick: () => void; children?: React.ReactNode }) {
  return (
    <li>
      <button onClick={onClick} className="flex w-full items-center gap-3 rounded-[20px] bg-[var(--color-canvas)] p-2.5 text-left transition hover:bg-[#eceef6] active:scale-[0.98]">
        <IconTile icon={icon} colors={colors} size={46} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-[17px] leading-tight font-extrabold">{title}</span>
          <span className="block truncate text-xs font-semibold text-[var(--color-ink-soft)]">{sub}</span>
        </span>
        {children}
      </button>
    </li>
  )
}

const HereChip = () => <Chip tone="good">Tu es ici</Chip>

function FareChip({ fare, minutes }: { fare: number; minutes?: number }) {
  return (
    <span className="flex flex-col items-end gap-0.5">
      <span className="flex items-center gap-1 font-display text-sm font-extrabold">
        <Coin size={15} />
        {amount(fare)}
      </span>
      {minutes !== undefined && <span className="text-[11px] font-bold text-[var(--color-ink-soft)]">{duration(minutes)}</span>}
    </span>
  )
}

function TravelCTA({ world, sim, cityId, communeId, onTravel }: { world: World; sim: Sim; cityId: string; communeId: string; onTravel: ExploreProps['onTravel'] }) {
  const fromCity = world.cities.find((c) => c.id === sim.city)!
  const from = fromCity.communes.find((c) => c.id === sim.commune)!
  const toCity = world.cities.find((c) => c.id === cityId)!
  const to = toCity.communes.find((c) => c.id === communeId)!
  const t = trip(fromCity.id, from, toCity.id, to)
  const bus = t.mode === 'car'
  const label = bus ? `En car vers ${toCity.name}` : `En woro-woro vers ${to.name}`
  return (
    <div className="mb-3 rounded-[22px] bg-gradient-to-br from-[#fff4e8] to-[#ffe6cc] p-3">
      <div className="mb-2.5 flex items-center gap-2.5">
        <IconTile icon={bus ? Bus : CarTaxiFront} colors={['#ffa040', '#ff6a00']} size={40} />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="font-display text-base font-extrabold">{bus ? 'Prendre le car' : 'Prendre un woro-woro'}</div>
          <div className="text-xs font-bold text-[var(--color-ink-soft)]">
            {from.name} → {to.name}
          </div>
        </div>
        <Chip>
          <Clock3 size={12} /> {duration(t.minutes)}
        </Chip>
      </div>
      <button className="btn w-full" disabled={sim.money < t.fare} onClick={() => onTravel(cityId, communeId, label)}>
        Y aller · <Coin size={22} /> {amount(t.fare)}
      </button>
    </div>
  )
}

/* ---------- Interaction menu ---------- */

type MenuProps = {
  world: World
  sim: Sim
  city: City
  commune: Commune
  placeId: string
  hour: number
  desktop: boolean
  onClose: () => void
  onPick: (it: Interaction, kind: string) => void
  onTravel: ExploreProps['onTravel']
}

function InteractionMenu({ world, sim, city, commune, placeId, hour, desktop, onClose, onPick, onTravel }: MenuProps) {
  const place = placeId === 'home' ? { name: 'Chez toi', kind: 'home' } : commune.places.find((p) => p.id === placeId)!
  const kind = world.kinds[place.kind]
  const colors = kindColors(place.kind)
  const here = sim.city === city.id && sim.commune === commune.id
  const items = kind.interactions
  const state = (it: Interaction) => ({ open: available(it, hour), broke: it.cost > 0 && sim.money < it.cost })

  // Desktop: the Sims radial menu around the place.
  if (desktop && here) {
    const rx = 250
    const ry = 175
    return (
      <div className="absolute inset-0 z-30 grid place-items-center bg-[#0f1230]/55 backdrop-blur-[3px]" onClick={onClose}>
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button className="animate-pop relative z-10 flex flex-col items-center" onClick={onClose} aria-label="Fermer">
            <IconTile icon={iconFor(kind.icon)} colors={colors} size={96} radius={34} />
            <span className="mt-2 rounded-full bg-white px-4 py-1.5 font-display text-lg font-extrabold shadow-lg">{place.name}</span>
          </button>
          {items.map((it, i) => {
            const a = (i / items.length) * Math.PI * 2 - Math.PI / 2
            return (
              <div key={it.id} className="absolute top-1/2 left-1/2" style={{ transform: `translate(calc(-50% + ${Math.cos(a) * rx}px), calc(-50% + ${Math.sin(a) * ry}px))` }}>
                <div className="animate-pop" style={{ animationDelay: `${60 + i * 45}ms` }}>
                  <ActionButton it={it} colors={colors} {...state(it)} onPick={() => onPick(it, place.kind)} compact />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Mobile (and "not here"): a thumb-friendly action sheet.
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end bg-[#0f1230]/55 backdrop-blur-[3px] lg:items-center lg:justify-center" onClick={onClose}>
      <div className="sheet animate-up max-h-[80%] w-full overflow-y-auto rounded-t-[28px] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:w-[440px] lg:rounded-[28px]" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center gap-3">
          <IconTile icon={iconFor(kind.icon)} colors={colors} size={52} />
          <div className="min-w-0 flex-1">
            <div className="label">{kind.label}</div>
            <div className="truncate font-display text-[22px] leading-tight font-extrabold">{place.name}</div>
          </div>
          <button className="icon-btn bg-[var(--color-canvas)]" onClick={onClose} aria-label="Fermer">
            <X size={22} strokeWidth={2.6} />
          </button>
        </div>
        {here ? (
          <div className="grid gap-2">
            {items.map((it) => (
              <ActionButton key={it.id} it={it} colors={colors} {...state(it)} onPick={() => onPick(it, place.kind)} />
            ))}
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm font-bold text-[var(--color-ink-soft)]">
              {sim.firstName} n'est pas à {commune.name}. Vas-y d'abord pour faire une activité ici.
            </p>
            <TravelCTA world={world} sim={sim} cityId={city.id} communeId={commune.id} onTravel={onTravel} />
          </>
        )}
      </div>
    </div>
  )
}

function ActionButton({ it, colors, open, broke, onPick, compact }: { it: Interaction; colors: [string, string]; open: boolean; broke: boolean; onPick: () => void; compact?: boolean }) {
  const disabled = !open || broke
  const ups = NEEDS.filter((n) => it.effect[n.key] >= 10)
  return (
    <button
      disabled={disabled}
      onClick={onPick}
      className={`flex items-center gap-3 rounded-[20px] p-2.5 text-left transition ${compact ? 'w-60 bg-white shadow-[0_14px_30px_-10px_rgba(0,0,0,0.45)] hover:scale-105' : 'w-full bg-[var(--color-canvas)] active:scale-[0.98]'} ${disabled ? 'opacity-55 grayscale-[0.6] hover:scale-100' : ''}`}
    >
      <IconTile icon={disabled && !open ? Lock : iconFor(it.icon)} colors={colors} size={44} />
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[15px] leading-tight font-extrabold">{it.label}</span>
        <span className="mt-1 flex flex-wrap items-center gap-1">
          <Chip>
            <Clock3 size={11} /> {duration(it.minutes)}
          </Chip>
          {it.cost !== 0 && (
            <Chip tone={it.cost < 0 ? 'good' : 'gold'}>
              {it.cost < 0 ? '+' : '−'}
              {amount(Math.abs(it.cost))} F
            </Chip>
          )}
          {!open && <Chip tone="bad">{String(it.minHour ?? 0).padStart(2, '0')}h–{String(it.maxHour || 24).padStart(2, '0')}h</Chip>}
          {ups.map((n) => (
            <span key={n.key} className="grid h-[22px] w-[22px] place-items-center rounded-full bg-[#e3f9ee] text-[var(--color-emerald-deep)]" title={`${n.label} +`}>
              <n.icon size={12} strokeWidth={3} />
            </span>
          ))}
        </span>
      </span>
    </button>
  )
}

/* ---------- Feedback ---------- */

function ActionProgress({ label, icon, kind, name }: { label: string; icon: string; kind: string; name: string }) {
  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-[#0f1230]/40">
      <div className="card animate-pop w-[min(320px,85vw)] p-5 text-center">
        <div className="animate-float mx-auto w-fit">
          <IconTile icon={iconFor(icon)} colors={kindColors(kind)} size={72} />
        </div>
        <div className="mt-3 label">{name}</div>
        <div className="font-display text-xl leading-tight font-extrabold">{label}</div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-[var(--color-canvas)]">
          <div className="h-full rounded-full bg-gradient-to-r from-[#22d388] to-[#00b86b]" style={{ animation: 'grow 1.5s ease-in-out forwards' }} />
        </div>
      </div>
    </div>
  )
}

function ToastCard({ toast: t }: { toast: Toast }) {
  const icon = t.tone === 'random' ? Dice5 : t.tone === 'error' ? TriangleAlert : t.icon ? iconFor(t.icon) : Sparkles
  const colors: [string, string] = t.tone === 'random' ? ['#ffd54f', '#ffa000'] : t.tone === 'error' ? ['#ff8a9b', '#ff3d57'] : kindColors(t.kind ?? '')
  return (
    <div className={`card animate-pop pointer-events-auto flex items-center gap-3 p-3 ${t.tone === 'random' ? 'ring-2 ring-[var(--color-gold)]' : ''}`}>
      <IconTile icon={icon} colors={colors} size={44} />
      <div className="min-w-0 flex-1">
        <div className="font-display text-[15px] leading-tight font-extrabold">{t.title}</div>
        {t.text && <div className="text-sm leading-snug font-semibold text-[var(--color-ink-soft)]">{t.text}</div>}
      </div>
      {t.money !== 0 && <MoneyDelta value={t.money} />}
    </div>
  )
}

export function MoneyDelta({ value }: { value: number }) {
  return (
    <span className={`flex shrink-0 items-center gap-1 font-display text-base font-extrabold ${value > 0 ? 'text-[var(--color-emerald-deep)]' : 'text-[#d81b3f]'}`}>
      {value > 0 ? '+' : '−'}
      {amount(Math.abs(value))}
      <Coin size={16} />
    </span>
  )
}

function JournalDrawer({ events, onClose }: { events: JournalEvent[]; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex justify-end bg-[#0f1230]/55 backdrop-blur-[3px]" onClick={onClose}>
      <div className="sheet animate-up flex h-full w-full flex-col lg:w-[420px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 p-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <IconTile icon={BookOpen} colors={['#b39dff', '#6c47ff']} size={44} />
          <h2 className="flex-1 font-display text-2xl font-extrabold">Journal</h2>
          <button className="icon-btn bg-[var(--color-canvas)]" onClick={onClose} aria-label="Fermer">
            <X size={22} strokeWidth={2.6} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          <Journal events={events} />
        </div>
      </div>
    </div>
  )
}

export function Journal({ events }: { events: JournalEvent[] }) {
  if (!events.length) return <p className="text-sm font-bold text-[var(--color-ink-soft)]">Rien pour l'instant. Va vivre ta vie !</p>
  return (
    <ol className="relative space-y-2">
      {events.map((e) => {
        const c = clock(e.gameTime)
        const [icon, colors]: [LucideIcon, [string, string]] =
          e.kind === 'random' ? [Dice5, ['#ffd54f', '#ffa000']] : e.kind === 'travel' ? [Bus, ['#8c9eff', '#3d4fd6']] : [Sparkles, ['#ffa040', '#ff6a00']]
        return (
          <li key={e.id} className={`flex items-center gap-3 rounded-[20px] p-2.5 ${e.kind === 'random' ? 'bg-[#fff7df]' : 'bg-[var(--color-canvas)]'}`}>
            <IconTile icon={icon} colors={colors} size={38} />
            <div className="min-w-0 flex-1">
              <div className="text-sm leading-snug font-bold">{e.text}</div>
              <div className="text-[11px] font-extrabold text-[var(--color-ink-soft)]">
                {c.weekday} · Jour {c.day} · {c.time}
              </div>
            </div>
            {e.money !== 0 && <MoneyDelta value={e.money} />}
          </li>
        )
      })}
    </ol>
  )
}
