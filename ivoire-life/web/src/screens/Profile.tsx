import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import type { JournalEvent, Sim } from '../lib/types'
import { useSession } from '../store/session'
import { findCommune, useWorld } from '../store/world'
import { NeedBar } from '../components/NeedBar'
import { Plumbob } from '../components/Plumbob'
import { SimAvatar } from '../components/SimAvatar'
import { NEEDS, clock, fcfa, mood, moodColor } from '../game/rules'
import { Journal } from './Play'
import { FlagStripe } from './Title'

export function Profile() {
  const world = useWorld((s) => s.world)!
  const { user, signOut } = useSession()
  const navigate = useNavigate()
  const [sim, setSim] = useState<(Sim & { journal: JournalEvent[] }) | null>(null)

  useEffect(() => {
    api.sims().then((sims) => (sims.length ? api.sim(sims[0].id).then(setSim) : navigate('/creer')))
  }, [navigate])

  async function removeSim() {
    if (!sim || !confirm(`Supprimer ${sim.firstName} pour toujours ? Sa vie à ${sim.homeCommune} sera perdue.`)) return
    await api.deleteSim(sim.id)
    navigate('/creer')
  }

  const home = sim && findCommune(world, sim.homeCity, sim.homeCommune)
  const here = sim && findCommune(world, sim.city, sim.commune)
  const c = sim && clock(sim.gameMinutes)
  const asp = sim && world.aspirations.find((a) => a.id === sim.aspiration)
  const earned = sim?.journal.reduce((s, e) => s + Math.max(0, e.money), 0) ?? 0
  const spent = sim?.journal.reduce((s, e) => s + Math.min(0, e.money), 0) ?? 0

  return (
    <div className="bg-wax min-h-full">
      <FlagStripe />
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/jeu" className="btn btn-ghost px-4 py-2">
            ← Retour au jeu
          </Link>
          <button className="btn px-4 py-2" onClick={() => (signOut(), navigate('/'))}>
            Se déconnecter
          </button>
        </div>

        {/* Player */}
        <section className="panel mb-6 flex items-center gap-4 p-5">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="h-16 w-16 rounded-full ring-4 ring-[var(--color-orange)]" referrerPolicy="no-referrer" />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-full bg-[var(--color-orange)] font-display text-2xl font-bold text-white">
              {user?.name.slice(0, 1)}
            </div>
          )}
          <div className="flex-1">
            <div className="text-xs font-extrabold tracking-wide text-black/40 uppercase">Joueur</div>
            <div className="font-display text-2xl font-bold">{user?.name}</div>
            <div className="text-sm text-black/50">
              {user?.email} · membre depuis {user && new Date(user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </div>
          </div>
        </section>

        {sim && (
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <section className="panel flex flex-col items-center overflow-hidden p-0">
              <div className="flex w-full flex-col items-center bg-gradient-to-b from-[#0e5a43] to-[#082c22] pt-5">
                <Plumbob size={20} color={moodColor(mood(sim.needs))} />
                <SimAvatar look={sim.look} gender={sim.gender} size={150} />
              </div>
              <div className="w-full p-5">
                <div className="text-center font-display text-2xl font-bold">
                  {sim.firstName} {sim.lastName}
                </div>
                <div className="mt-1 text-center text-sm font-bold text-black/50">
                  {asp?.icon} {asp?.label}
                </div>
                <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                  {sim.traits.map((t) => {
                    const o = world.traits.find((x) => x.id === t)
                    return (
                      <span key={t} className="rounded-full bg-[var(--color-sand)] px-2.5 py-1 text-xs font-extrabold">
                        {o?.icon} {o?.label}
                      </span>
                    )
                  })}
                </div>
                <div className="mt-5 space-y-2">
                  {NEEDS.map((n) => (
                    <div key={n.key} className="rounded-xl bg-[var(--color-forest)] px-3 py-1.5 text-white">
                      <NeedBar label={n.label} icon={n.icon} value={sim.needs[n.key]} compact />
                    </div>
                  ))}
                </div>
                <button className="mt-5 w-full text-sm font-bold text-[var(--color-danger)] hover:underline" onClick={removeSim}>
                  Supprimer ce Sim
                </button>
              </div>
            </section>

            <div className="space-y-6">
              <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Porte-monnaie" value={fcfa(sim.money)} icon="💰" />
                <Stat label="Jour de jeu" value={`${c!.weekday} ${c!.day}`} icon="📅" />
                <Stat label="Habite à" value={home?.commune?.name ?? '—'} sub={home?.city?.name} icon="🏠" />
                <Stat label="Est à" value={here?.commune?.name ?? '—'} sub={here?.city?.name} icon="📍" />
                <Stat label="Gagné" value={fcfa(earned)} icon="📈" />
                <Stat label="Dépensé" value={fcfa(-spent)} icon="📉" />
                <Stat label="Actions" value={String(sim.journal.filter((e) => e.kind === 'interaction').length)} icon="✨" />
                <Stat label="Évènements" value={String(sim.journal.filter((e) => e.kind === 'random').length)} icon="🎲" />
              </section>
              <section className="panel p-5">
                <h2 className="mb-3 font-display text-xl font-bold">📔 Journal de {sim.firstName}</h2>
                <Journal events={sim.journal} />
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon: string }) {
  return (
    <div className="panel p-3">
      <div className="text-xs font-extrabold tracking-wide text-black/40 uppercase">
        {icon} {label}
      </div>
      <div className="mt-1 truncate font-display text-lg font-bold">{value}</div>
      {sub && <div className="text-xs font-bold text-black/40">{sub}</div>}
    </div>
  )
}
