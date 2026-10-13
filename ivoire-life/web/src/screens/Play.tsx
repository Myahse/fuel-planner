import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import type { ActionResult, Interaction, JournalEvent, Sim, World } from '../lib/types'
import { useSession } from '../store/session'
import { useWorld } from '../store/world'
import { GameMap } from '../components/map/GameMap'
import { boundsFor, liftOverlaps, pinsFor, type Focus } from '../components/map/pins'
import { NeedBar } from '../components/NeedBar'
import { Plumbob } from '../components/Plumbob'
import { SimAvatar } from '../components/SimAvatar'
import { NEEDS, available, clock, decay, duration, fcfa, mood, moodColor, trip } from '../game/rules'

const MAX_LOCAL_CATCH_UP = 180 // game minutes, mirrors the server cap

type Toast = { id: number; title: string; text: string; money: number; kind: 'random' | 'info' | 'error' }

export function Play() {
  const world = useWorld((s) => s.world)!
  const user = useSession((s) => s.user)
  const navigate = useNavigate()

  const [base, setBase] = useState<{ sim: Sim; at: number } | null>(null)
  const [journal, setJournal] = useState<JournalEvent[]>([])
  const [now, setNow] = useState(Date.now())
  const [focus, setFocus] = useState<Focus>({})
  const [placeId, setPlaceId] = useState<string | null>(null)
  const [tab, setTab] = useState<'explore' | 'journal'>('explore')
  const [pending, setPending] = useState<{ label: string; icon: string } | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])

  // Load the player's Sim, or send them to the creator.
  useEffect(() => {
    api.sims().then(async (sims) => {
      if (!sims.length) return navigate('/creer', { replace: true })
      const full = await api.sim(sims[0].id)
      setBase({ sim: full, at: Date.now() })
      setJournal(full.journal)
      setFocus({ cityId: full.city })
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
    setToasts((ts) => [...ts.slice(-2), { ...t, id }])
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 6000)
  }, [])

  async function run(label: string, icon: string, call: () => Promise<ActionResult>) {
    setPending({ label, icon })
    const started = Date.now()
    try {
      const res = await call()
      await new Promise((r) => setTimeout(r, Math.max(0, 1400 - (Date.now() - started))))
      setBase({ sim: res.sim, at: Date.now() })
      setJournal(res.journal)
      if (res.outcome.random) toast({ kind: 'random', title: 'Évènement !', text: res.outcome.random.text, money: res.outcome.random.money })
      else toast({ kind: 'info', title: res.outcome.text, text: '', money: res.outcome.money })
    } catch (e) {
      toast({ kind: 'error', title: 'Impossible', text: e instanceof Error ? e.message : 'Erreur', money: 0 })
    } finally {
      setPending(null)
    }
  }

  const interact = (it: Interaction) => {
    setPlaceId(null)
    run(it.label, it.icon, () => api.interact(sim!.id, placeId!, it.id))
  }
  const travel = (cityId: string, communeId: string, label: string) => {
    setPlaceId(null)
    run(label, '🚐', () => api.travel(sim!.id, cityId, communeId)).then(() => setFocus({ cityId, communeId }))
  }

  // Pins only need to change when something visible on them changes.
  const moodHex = sim ? moodColor(mood(sim.needs)) : ''
  const pinSim = useMemo(() => sim, [sim?.id, sim?.city, sim?.commune, moodHex]) // eslint-disable-line react-hooks/exhaustive-deps
  const bounds = useMemo(() => boundsFor(world, focus), [world, focus])
  const pins = useMemo(
    () =>
      liftOverlaps(
        pinsFor(world, focus, pinSim, placeId, {
          onCity: (cityId) => setFocus({ cityId }),
          onCommune: (cityId, communeId) => setFocus({ cityId, communeId }),
          onPlace: setPlaceId,
        }),
        bounds,
      ),
    [world, focus, pinSim, placeId, bounds],
  )

  if (!sim) return <div className="bg-wax grid h-full place-items-center font-display text-2xl text-white">Chargement de Babi…</div>

  const c = clock(sim.gameMinutes)
  const m = mood(sim.needs)
  const city = world.cities.find((x) => x.id === focus.cityId)
  const commune = city?.communes.find((x) => x.id === focus.communeId)

  return (
    <div className="relative h-full overflow-hidden select-none">
      <GameMap pins={pins} bounds={bounds} night={c.isNight} sim={pinSim} />

      {/* Top bar */}
      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
        <Link to="/profil" className="panel-dark pointer-events-auto flex items-center gap-3 py-1.5 pr-4 pl-1.5">
          <div className="relative h-12 w-12 overflow-hidden rounded-full bg-[var(--color-sand)] ring-2 ring-[var(--color-orange)]">
            <div className="-mt-1 -ml-[10px]">
              <SimAvatar look={sim.look} gender={sim.gender} size={68} />
            </div>
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg font-bold">{sim.firstName}</div>
            <div className="text-xs font-bold text-white/60 max-sm:hidden">{user?.name}</div>
          </div>
        </Link>

        <div className="panel-dark pointer-events-auto hidden items-center gap-3 px-4 py-2 sm:flex">
          <span className="text-2xl">{c.isNight ? '🌙' : '☀️'}</span>
          <div className="leading-tight">
            <div className="font-display text-2xl font-bold tabular-nums">{c.time}</div>
            <div className="text-xs font-bold text-white/60">
              {c.weekday} · Jour {c.day}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="panel-dark pointer-events-auto flex items-center gap-2 px-4 py-2">
            <span className="text-xl">💰</span>
            <span className="font-display text-xl font-bold whitespace-nowrap tabular-nums">{fcfa(sim.money)}</span>
          </div>
          <div className="panel-dark pointer-events-auto flex items-center gap-2 px-3 py-1.5 sm:hidden">
            <span>{c.isNight ? '🌙' : '☀️'}</span>
            <span className="font-display font-bold tabular-nums">{c.time}</span>
          </div>
        </div>
      </header>

      {/* Needs */}
      <aside className="panel-dark absolute bottom-3 left-3 w-[min(16rem,calc(100vw-1.5rem))] p-4 max-lg:top-[4.75rem] max-lg:bottom-auto max-lg:left-2 max-lg:w-32 max-lg:rounded-2xl max-lg:p-2">
        <div className="mb-3 flex items-center gap-3 max-lg:hidden">
          <Plumbob size={18} color={moodColor(m)} />
          <div>
            <div className="text-xs font-extrabold tracking-wide text-white/60 uppercase">Humeur</div>
            <div className="font-display text-lg font-bold">{m >= 60 ? 'Ça va bien !' : m >= 35 ? 'Ça peut aller' : 'Ça ne va pas…'}</div>
          </div>
        </div>
        <div className="space-y-2.5 max-lg:space-y-1.5">
          {NEEDS.map((n) => (
            <NeedBar key={n.key} label={n.label} icon={n.icon} value={sim.needs[n.key]} responsive />
          ))}
        </div>
      </aside>

      {/* Context panel */}
      <aside className="panel absolute top-20 right-3 bottom-3 flex w-[360px] flex-col overflow-hidden max-lg:top-auto max-lg:right-2 max-lg:bottom-2 max-lg:left-2 max-lg:h-[42%] max-lg:w-auto">
        <div className="flex items-center gap-1 border-b-2 border-[var(--color-sand)] p-2">
          {(['explore', 'journal'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-xl py-2 font-display font-bold transition ${tab === t ? 'bg-[var(--color-forest)] text-white' : 'text-black/50 hover:bg-[var(--color-sand)]'}`}
            >
              {t === 'explore' ? '🧭 Explorer' : '📔 Journal'}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'journal' ? (
            <Journal events={journal} />
          ) : (
            <Explore world={world} sim={sim} focus={focus} setFocus={setFocus} onPlace={setPlaceId} onTravel={travel} city={city} commune={commune} />
          )}
        </div>
      </aside>

      {placeId && commune && (
        <PieMenu world={world} sim={sim} placeId={placeId} communeName={commune.name} cityId={city!.id} communeId={commune.id} hour={c.hour} onClose={() => setPlaceId(null)} onPick={interact} onTravel={travel} />
      )}

      {pending && <Progress {...pending} name={sim.firstName} />}

      <div className="pointer-events-none absolute top-20 left-1/2 flex w-[min(380px,90vw)] -translate-x-1/2 flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-pop pointer-events-auto rounded-2xl border-[3px] px-4 py-3 shadow-xl ${t.kind === 'random' ? 'border-[var(--color-gold)] bg-[#fffbe6]' : t.kind === 'error' ? 'border-[var(--color-danger)] bg-white' : 'border-white bg-[var(--color-cream)]'}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{t.kind === 'random' ? '🎲' : t.kind === 'error' ? '⚠️' : '✅'}</span>
              <div className="flex-1">
                <div className="font-display font-bold">{t.title}</div>
                {t.text && <div className="text-sm">{t.text}</div>}
              </div>
              {t.money !== 0 && <Money value={t.money} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Money({ value }: { value: number }) {
  return <span className={`font-display font-bold whitespace-nowrap ${value > 0 ? 'text-[var(--color-green)]' : 'text-[var(--color-danger)]'}`}>{value > 0 ? '+' : ''}{fcfa(value)}</span>
}

type ExploreProps = {
  world: World
  sim: Sim
  focus: Focus
  setFocus: (f: Focus) => void
  onPlace: (id: string) => void
  onTravel: (cityId: string, communeId: string, label: string) => void
  city?: World['cities'][number]
  commune?: World['cities'][number]['communes'][number]
}

function Explore({ world, sim, setFocus, onPlace, onTravel, city, commune }: ExploreProps) {
  const simCity = world.cities.find((c) => c.id === sim.city)!
  const simCommune = simCity.communes.find((c) => c.id === sim.commune)!

  return (
    <div>
      <nav className="mb-3 flex flex-wrap items-center gap-1 text-sm font-extrabold text-black/50">
        <button className="hover:text-[var(--color-orange)]" onClick={() => setFocus({})}>
          🇨🇮 Côte d'Ivoire
        </button>
        {city && (
          <>
            ›
            <button className="hover:text-[var(--color-orange)]" onClick={() => setFocus({ cityId: city.id })}>
              {city.name}
            </button>
          </>
        )}
        {commune && <>› {commune.name}</>}
      </nav>

      {!city && (
        <>
          <h2 className="font-display text-2xl font-bold">Où aller ?</h2>
          <p className="mb-4 text-sm text-black/60">Choisis une ville sur la carte. Les trajets en car prennent du temps… et des francs.</p>
          <ul className="space-y-2">
            {world.cities.map((c) => {
              const t = trip(simCity.id, simCommune, c.id, c.communes[0])
              return (
                <li key={c.id}>
                  <button className="chip w-full text-left" onClick={() => setFocus({ cityId: c.id })}>
                    <div className="flex items-center justify-between">
                      <span>📍 {c.name}</span>
                      {c.id === sim.city ? <Here /> : <span className="text-xs text-black/50">🚌 {fcfa(t.fare)} · {duration(t.minutes)}</span>}
                    </div>
                    <div className="text-xs font-normal text-black/50">{c.blurb}</div>
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}

      {city && !commune && (
        <>
          <h2 className="font-display text-2xl font-bold">{city.name}</h2>
          <p className="mb-4 text-sm text-black/60">{city.blurb}</p>
          <ul className="space-y-2">
            {city.communes.map((cm) => {
              const t = trip(simCity.id, simCommune, city.id, cm)
              const home = cm.id === sim.homeCommune && city.id === sim.homeCity
              return (
                <li key={cm.id}>
                  <button className="chip w-full text-left" onClick={() => setFocus({ cityId: city.id, communeId: cm.id })}>
                    <div className="flex items-center justify-between gap-2">
                      <span>
                        {home ? '🏠' : '🏘️'} {cm.name}
                      </span>
                      {cm.id === sim.commune && city.id === sim.city ? <Here /> : <span className="text-xs text-black/50">{t.mode === 'car' ? '🚌' : '🚕'} {fcfa(t.fare)}</span>}
                    </div>
                    <div className="text-xs font-normal text-black/50">{cm.blurb}</div>
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}

      {city && commune && (
        <>
          <h2 className="font-display text-2xl font-bold">{commune.name}</h2>
          <p className="mb-4 text-sm text-black/60">{commune.blurb}</p>
          {(sim.city !== city.id || sim.commune !== commune.id) && (
            <TravelButton sim={sim} world={world} cityId={city.id} communeId={commune.id} onTravel={onTravel} />
          )}
          <ul className="space-y-2">
            {sim.homeCity === city.id && sim.homeCommune === commune.id && (
              <li>
                <button className="chip w-full text-left" onClick={() => onPlace('home')}>
                  🏠 Chez toi
                  <div className="text-xs font-normal text-black/50">Dormir, se laver, cuisiner…</div>
                </button>
              </li>
            )}
            {commune.places.map((p) => (
              <li key={p.id}>
                <button className="chip w-full text-left" onClick={() => onPlace(p.id)}>
                  {world.kinds[p.kind].icon} {p.name}
                  <div className="text-xs font-normal text-black/50">
                    {world.kinds[p.kind].label} · {world.kinds[p.kind].interactions.length} actions
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function Here() {
  return <span className="rounded-full bg-[var(--color-green)] px-2 py-0.5 text-[11px] font-extrabold text-white">Tu es ici</span>
}

function TravelButton({ sim, world, cityId, communeId, onTravel, className = '' }: { sim: Sim; world: World; cityId: string; communeId: string; onTravel: ExploreProps['onTravel']; className?: string }) {
  const fromCity = world.cities.find((c) => c.id === sim.city)!
  const from = fromCity.communes.find((c) => c.id === sim.commune)!
  const toCity = world.cities.find((c) => c.id === cityId)!
  const to = toCity.communes.find((c) => c.id === communeId)!
  const t = trip(fromCity.id, from, toCity.id, to)
  const label = t.mode === 'car' ? `En car vers ${toCity.name}…` : `En woro-woro vers ${to.name}…`
  return (
    <button className={`btn mb-4 w-full ${className}`} disabled={sim.money < t.fare} onClick={() => onTravel(cityId, communeId, label)}>
      {t.mode === 'car' ? '🚌' : '🚕'} Y aller · {fcfa(t.fare)} · {duration(t.minutes)}
    </button>
  )
}

type PieProps = {
  world: World
  sim: Sim
  placeId: string
  communeName: string
  cityId: string
  communeId: string
  hour: number
  onClose: () => void
  onPick: (it: Interaction) => void
  onTravel: ExploreProps['onTravel']
}

// The Sims-style radial menu of interactions around a place.
function PieMenu({ world, sim, placeId, communeName, cityId, communeId, hour, onClose, onPick, onTravel }: PieProps) {
  const commune = world.cities.find((c) => c.id === cityId)!.communes.find((c) => c.id === communeId)!
  const place = placeId === 'home' ? { name: 'Chez toi', kind: 'home' } : commune.places.find((p) => p.id === placeId)!
  const kind = world.kinds[place.kind]
  const here = sim.city === cityId && sim.commune === communeId
  const items = kind.interactions
  const narrow = window.innerWidth < 640
  const rx = narrow ? 105 : 215
  const ry = narrow ? 175 : 150

  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-black/45 backdrop-blur-[2px]" onClick={onClose}>
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <div className="animate-pop relative z-10 grid h-36 w-36 place-items-center max-sm:h-28 max-sm:w-28 rounded-full border-4 border-white bg-[var(--color-forest)] text-center text-white shadow-2xl">
          <div>
            <div className="text-4xl">{kind.icon}</div>
            <div className="px-3 font-display text-sm leading-tight font-bold">{place.name}</div>
          </div>
        </div>

        {here ? (
          items.map((it, i) => {
            const angle = (i / items.length) * Math.PI * 2 - Math.PI / 2
            const open = available(it, hour)
            const broke = it.cost > 0 && sim.money < it.cost
            return (
              <button
                key={it.id}
                disabled={!open || broke}
                onClick={() => onPick(it)}
                className={`animate-pop absolute top-1/2 left-1/2 w-44 -translate-x-1/2 -translate-y-1/2 rounded-2xl border-[3px] px-3 py-2 text-left shadow-xl transition max-sm:w-36 ${open && !broke ? 'border-white bg-[var(--color-cream)] hover:scale-105 hover:bg-white' : 'border-white/40 bg-[#d9d2c3] [&>*]:opacity-50'}`}
                style={{ marginLeft: Math.cos(angle) * rx, marginTop: Math.sin(angle) * ry, animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-center gap-2 font-display text-sm leading-tight font-bold">
                  <span className="text-xl">{it.icon}</span>
                  {it.label}
                </div>
                <div className="mt-1 text-[11px] font-bold text-black/50">
                  ⏱ {duration(it.minutes)}
                  {it.cost !== 0 && <> · <Money value={-it.cost} /></>}
                  {!open && <> · 🔒 {String(it.minHour ?? 0).padStart(2, '0')}h–{String(it.maxHour || 24).padStart(2, '0')}h</>}
                </div>
              </button>
            )
          })
        ) : (
          <div className="animate-pop absolute top-full left-1/2 mt-4 w-72 -translate-x-1/2 rounded-2xl bg-[var(--color-cream)] p-4 text-center shadow-xl">
            <p className="mb-3 font-bold">{sim.firstName} n'est pas à {communeName}.</p>
            <TravelButton sim={sim} world={world} cityId={cityId} communeId={communeId} onTravel={onTravel} className="mb-0" />
          </div>
        )}
      </div>
    </div>
  )
}

function Progress({ label, icon, name }: { label: string; icon: string; name: string }) {
  return (
    <div className="absolute inset-0 z-30 grid place-items-center bg-black/30">
      <div className="panel animate-pop w-72 p-5 text-center">
        <div className="animate-bounce text-5xl">{icon}</div>
        <div className="mt-2 font-display text-lg font-bold">
          {name} : {label}
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-[var(--color-sand)]">
          <div className="h-full animate-[grow_1.4s_ease-in-out_forwards] rounded-full bg-[var(--color-green)]" />
        </div>
      </div>
    </div>
  )
}

export function Journal({ events }: { events: JournalEvent[] }) {
  if (!events.length) return <p className="text-sm text-black/50">Rien pour l'instant. Va vivre ta vie !</p>
  return (
    <ol className="space-y-2">
      {events.map((e) => {
        const c = clock(e.gameTime)
        return (
          <li key={e.id} className={`rounded-2xl px-3 py-2 ${e.kind === 'random' ? 'bg-[#fff4c2]' : 'bg-white'}`}>
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-bold">
                {e.kind === 'random' ? '🎲' : e.kind === 'travel' ? '🚐' : '•'} {e.text}
              </span>
              {e.money !== 0 && <span className="text-xs"><Money value={e.money} /></span>}
            </div>
            <div className="text-[11px] font-bold text-black/40">
              Jour {c.day} · {c.time}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
