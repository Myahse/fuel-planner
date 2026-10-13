import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, type NewSim } from '../lib/api'
import { useWorld } from '../store/world'
import { Plumbob } from '../components/Plumbob'
import { HAIR_COLORS, HAIRS, OUTFIT_COLORS, OUTFITS, SKIN_TONES, SimAvatar } from '../components/SimAvatar'
import { FlagStripe } from './Title'

const STEPS = [
  { id: 'identity', label: 'Identité', icon: '🪪' },
  { id: 'look', label: 'Apparence', icon: '👗' },
  { id: 'personality', label: 'Personnalité', icon: '✨' },
  { id: 'home', label: 'Quartier', icon: '🏠' },
] as const

const FIRST = { femme: ['Awa', 'Aya', 'Mariam', 'Adjoua', 'Fatou', 'Akissi', 'Ruth'], homme: ['Kouadio', 'Yao', 'Moussa', 'Koffi', 'Serge', 'Ibrahim', 'Didier'] }
const LAST = ['Koné', 'Kouassi', 'Traoré', 'Yao', 'Ouattara', 'Bamba', "N'Guessan", 'Diabaté', 'Gbagbo', 'Coulibaly']
const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)]

export function CreateSim() {
  const world = useWorld((s) => s.world)
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [sim, setSim] = useState<NewSim>({
    firstName: 'Awa',
    lastName: 'Koné',
    gender: 'femme',
    look: { skin: SKIN_TONES[3], hair: 'braids', hairColor: HAIR_COLORS[0], outfit: 'pagne', outfitColor: OUTFIT_COLORS[0] },
    traits: ['ambianceur'],
    aspiration: 'ambiance',
    homeCity: 'abidjan',
    homeCommune: 'yopougon',
  })

  if (!world) return null
  const set = (patch: Partial<NewSim>) => setSim((s) => ({ ...s, ...patch }))
  const setLook = (patch: Partial<NewSim['look']>) => setSim((s) => ({ ...s, look: { ...s.look, ...patch } }))
  const city = world.cities.find((c) => c.id === sim.homeCity)!

  function randomize() {
    const gender = pick(['femme', 'homme'] as const)
    const c = pick(world!.cities)
    set({
      gender,
      firstName: pick(FIRST[gender]),
      lastName: pick(LAST),
      look: { skin: pick(SKIN_TONES), hair: pick(HAIRS).id, hairColor: pick(HAIR_COLORS), outfit: pick(OUTFITS).id, outfitColor: pick(OUTFIT_COLORS) },
      traits: [...world!.traits].sort(() => Math.random() - 0.5).slice(0, 3).map((t) => t.id),
      aspiration: pick(world!.aspirations).id,
      homeCity: c.id,
      homeCommune: pick(c.communes).id,
    })
  }

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      await api.createSim(sim)
      navigate('/jeu')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-wax flex min-h-full flex-col">
      <FlagStripe />
      <header className="flex items-center justify-between px-4 py-3 text-white">
        <div className="font-display text-xl font-bold">Créer un Sim</div>
        <button className="btn btn-ghost px-3 py-2 text-sm" onClick={randomize}>
          🎲 Au hasard
        </button>
      </header>

      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-4 pb-8 lg:grid-cols-[1fr_1.2fr]">
        {/* Preview podium */}
        <section className="relative flex flex-col items-center justify-end overflow-hidden rounded-[28px] bg-gradient-to-b from-[#0e5a43] to-[#082c22] p-6 ring-2 ring-white/10">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[280px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,236,190,0.45),transparent)]" />
          <Plumbob size={26} />
          <div key={sim.look.outfit + sim.gender} className="animate-pop relative">
            <SimAvatar look={sim.look} gender={sim.gender} size={210} />
          </div>
          <div className="-mt-8 h-8 w-64 rounded-[50%] bg-[var(--color-orange)] shadow-[0_10px_0_#c96500]" />
          <div className="relative mt-6 text-center text-white">
            <div className="font-display text-3xl font-bold">
              {sim.firstName || '…'} {sim.lastName}
            </div>
            <div className="mt-1 text-sm font-bold text-white/70">
              {world.aspirations.find((a) => a.id === sim.aspiration)?.icon} {world.aspirations.find((a) => a.id === sim.aspiration)?.label} · 📍{' '}
              {city.communes.find((c) => c.id === sim.homeCommune)?.name}, {city.name}
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {sim.traits.map((t) => {
                const o = world.traits.find((x) => x.id === t)!
                return (
                  <span key={t} className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-extrabold">
                    {o.icon} {o.label}
                  </span>
                )
              })}
            </div>
          </div>
        </section>

        {/* Editor */}
        <section className="panel flex flex-col p-5">
          <nav className="mb-5 grid grid-cols-4 gap-2">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setStep(i)}
                className={`rounded-2xl px-2 py-2.5 text-center text-sm font-extrabold transition ${i === step ? 'bg-[var(--color-orange)] text-white shadow-[0_4px_0_#c96500]' : 'bg-white text-black/60 hover:bg-[var(--color-sand)]'}`}
              >
                <div className="text-lg">{s.icon}</div>
                {s.label}
              </button>
            ))}
          </nav>

          <div className="flex-1 space-y-5">
            {STEPS[step].id === 'identity' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Prénom">
                    <input className="input" value={sim.firstName} maxLength={40} onChange={(e) => set({ firstName: e.target.value })} />
                  </Field>
                  <Field label="Nom">
                    <input className="input" value={sim.lastName} maxLength={40} onChange={(e) => set({ lastName: e.target.value })} />
                  </Field>
                </div>
                <Field label="Genre">
                  <div className="flex gap-2">
                    {(['femme', 'homme'] as const).map((g) => (
                      <button key={g} className="chip flex-1" aria-pressed={sim.gender === g} onClick={() => set({ gender: g })}>
                        {g === 'femme' ? '👩🏾 Femme' : '👨🏾 Homme'}
                      </button>
                    ))}
                  </div>
                </Field>
              </>
            )}

            {STEPS[step].id === 'look' && (
              <>
                <Field label="Teint">
                  <Swatches colors={SKIN_TONES} value={sim.look.skin} onChange={(skin) => setLook({ skin })} />
                </Field>
                <Field label="Coiffure">
                  <div className="flex flex-wrap gap-2">
                    {HAIRS.map((h) => (
                      <button key={h.id} className="chip" aria-pressed={sim.look.hair === h.id} onClick={() => setLook({ hair: h.id })}>
                        {h.label}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Couleur des cheveux">
                  <Swatches colors={HAIR_COLORS} value={sim.look.hairColor} onChange={(hairColor) => setLook({ hairColor })} />
                </Field>
                <Field label="Tenue">
                  <div className="flex flex-wrap gap-2">
                    {OUTFITS.map((o) => (
                      <button key={o.id} className="chip" aria-pressed={sim.look.outfit === o.id} onClick={() => setLook({ outfit: o.id })}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Couleur du tissu">
                  <Swatches colors={OUTFIT_COLORS} value={sim.look.outfitColor} onChange={(outfitColor) => setLook({ outfitColor })} />
                </Field>
              </>
            )}

            {STEPS[step].id === 'personality' && (
              <>
                <Field label={`Traits de caractère (${sim.traits.length}/3)`}>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {world.traits.map((t) => {
                      const on = sim.traits.includes(t.id)
                      return (
                        <button
                          key={t.id}
                          className="chip text-left"
                          aria-pressed={on}
                          disabled={!on && sim.traits.length >= 3}
                          onClick={() => set({ traits: on ? sim.traits.filter((x) => x !== t.id) : [...sim.traits, t.id] })}
                        >
                          <div>
                            {t.icon} {t.label}
                          </div>
                          <div className="text-xs font-normal text-black/50">{t.hint}</div>
                        </button>
                      )
                    })}
                  </div>
                </Field>
                <Field label="Aspiration">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {world.aspirations.map((a) => (
                      <button key={a.id} className="chip text-left" aria-pressed={sim.aspiration === a.id} onClick={() => set({ aspiration: a.id })}>
                        <div>
                          {a.icon} {a.label}
                        </div>
                        <div className="text-xs font-normal text-black/50">{a.hint}</div>
                      </button>
                    ))}
                  </div>
                </Field>
              </>
            )}

            {STEPS[step].id === 'home' && (
              <>
                <Field label="Ville">
                  <div className="flex flex-wrap gap-2">
                    {world.cities.map((c) => (
                      <button key={c.id} className="chip" aria-pressed={sim.homeCity === c.id} onClick={() => set({ homeCity: c.id, homeCommune: c.communes[0].id })}>
                        {c.name}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label={city.communes.length > 1 ? 'Commune' : 'Quartier'}>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {city.communes.map((cm) => (
                      <button key={cm.id} className="chip text-left" aria-pressed={sim.homeCommune === cm.id} onClick={() => set({ homeCommune: cm.id })}>
                        <div>🏘️ {cm.name}</div>
                        <div className="text-xs font-normal text-black/50">{cm.blurb}</div>
                      </button>
                    ))}
                  </div>
                </Field>
              </>
            )}
          </div>

          {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-[var(--color-danger)]">{error}</p>}

          <div className="mt-6 flex justify-between gap-3">
            <button className="btn btn-ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
              ← Retour
            </button>
            {step < STEPS.length - 1 ? (
              <button className="btn" onClick={() => setStep(step + 1)}>
                Suivant →
              </button>
            ) : (
              <button className="btn btn-green" disabled={busy || !sim.firstName.trim() || !sim.lastName.trim() || sim.traits.length === 0} onClick={submit}>
                ✓ Commencer la partie
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="block">
      <div className="mb-2 text-xs font-extrabold tracking-wide text-black/50 uppercase">{label}</div>
      {children}
    </div>
  )
}

function Swatches({ colors, value, onChange }: { colors: string[]; value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={c}
          aria-pressed={value === c}
          onClick={() => onChange(c)}
          className={`h-10 w-10 rounded-full border-4 shadow-[0_3px_0_rgba(0,0,0,0.15)] transition ${value === c ? 'scale-110 border-[var(--color-green)]' : 'border-white'}`}
          style={{ background: c }}
        />
      ))}
    </div>
  )
}
