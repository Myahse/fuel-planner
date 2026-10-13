import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useSession } from '../store/session'
import { useWorld } from '../store/world'
import { Plumbob } from '../components/Plumbob'
import { SimAvatar } from '../components/SimAvatar'
import type { Look } from '../lib/types'

const GOOGLE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)

const CROWD: { look: Look; gender: 'femme' | 'homme' }[] = [
  { gender: 'femme', look: { skin: '#8d5524', hair: 'headwrap', hairColor: '#1b1b1b', outfit: 'pagne', outfitColor: '#f77f00' } },
  { gender: 'homme', look: { skin: '#6b3e1f', hair: 'short', hairColor: '#1b1b1b', outfit: 'jersey', outfitColor: '#f77f00' } },
  { gender: 'femme', look: { skin: '#a0612c', hair: 'braids', hairColor: '#3b2416', outfit: 'boubou', outfitColor: '#009e60' } },
  { gender: 'homme', look: { skin: '#4a2a14', hair: 'locks', hairColor: '#1b1b1b', outfit: 'suit', outfitColor: '#22303c' } },
]

export function Title() {
  const signIn = useSession((s) => s.signIn)
  const world = useWorld((s) => s.world)
  const worldError = useWorld((s) => s.error)
  const navigate = useNavigate()
  const [devName, setDevName] = useState('Awa Koné')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function finish(p: Promise<{ token: string; user: Parameters<typeof signIn>[1] }>) {
    setBusy(true)
    setError(null)
    try {
      const { token, user } = await p
      signIn(token, user)
      navigate('/jeu')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connexion impossible')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-wax relative flex min-h-full flex-col overflow-hidden">
      <FlagStripe />

      <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col items-center gap-10 px-4 py-10 lg:flex-row lg:gap-16">
        <section className="flex-1 text-center lg:text-left">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white/90 ring-1 ring-white/15">
            🇨🇮 Le jeu de simulation de vie 100 % ivoirien
          </div>
          <h1 className="title-3d flex items-end justify-center gap-3 text-6xl leading-none sm:text-7xl lg:justify-start">
            Ivoire
            <span className="relative text-[var(--color-orange)]">
              Life
              <Plumbob size={22} className="absolute -top-14 left-1/2 -translate-x-1/2" />
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-md text-lg font-bold text-white/85 lg:mx-0">
            Crée ton Sim, installe-toi à Yop, Cocody ou Bouaké, et vis ta vie : garba au maquis, gbaka bondé, coupé-décalé jusqu'au matin.
          </p>

          <div className="mt-10 hidden items-end justify-center gap-2 sm:flex lg:justify-start">
            {CROWD.map((c, i) => (
              <div key={i} className="animate-pop" style={{ animationDelay: `${i * 120}ms` }}>
                <SimAvatar look={c.look} gender={c.gender} size={i % 2 ? 92 : 104} />
              </div>
            ))}
          </div>
        </section>

        <section className="panel animate-pop w-full max-w-sm p-6">
          <h2 className="font-display text-2xl font-bold">Entrer dans le jeu</h2>
          <p className="mt-1 text-sm text-black/60">Connecte-toi pour sauvegarder ton Sim et retrouver ta partie partout.</p>

          <div className="mt-6 flex flex-col items-stretch gap-3">
            {GOOGLE_ENABLED ? (
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={(r) => r.credential && finish(api.googleLogin(r.credential))}
                  onError={() => setError('Connexion Google annulée')}
                  shape="pill"
                  size="large"
                  text="continue_with"
                />
              </div>
            ) : (
              <button className="btn btn-ghost w-full" disabled title="Ajoute VITE_GOOGLE_CLIENT_ID pour activer">
                <GoogleIcon /> Continuer avec Google
              </button>
            )}

            {world?.config.devLogin && (
              <>
                <div className="my-1 flex items-center gap-3 text-xs font-bold text-black/40 uppercase">
                  <span className="h-px flex-1 bg-black/10" /> mode dev <span className="h-px flex-1 bg-black/10" />
                </div>
                <input
                  className="rounded-xl border-2 border-[#e6d7b8] bg-white px-3 py-2.5 font-bold outline-none focus:border-[var(--color-green)]"
                  value={devName}
                  onChange={(e) => setDevName(e.target.value)}
                  aria-label="Nom du joueur test"
                />
                <button className="btn btn-green w-full" disabled={busy} onClick={() => finish(api.devLogin(devName))}>
                  ▶ Jouer en local
                </button>
              </>
            )}
          </div>

          {(error || worldError) && (
            <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-[var(--color-danger)]">{error ?? `Serveur injoignable : ${worldError}`}</p>
          )}
          <p className="mt-6 text-center text-xs text-black/40">En jouant, tu acceptes que ton Sim mange beaucoup trop de garba.</p>
        </section>
      </main>
    </div>
  )
}

export function FlagStripe() {
  return (
    <div className="flex h-1.5 w-full shrink-0">
      <div className="flex-1 bg-[var(--color-orange)]" />
      <div className="flex-1 bg-white" />
      <div className="flex-1 bg-[var(--color-green)]" />
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}
