import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { login, register } from '../api/endpoints'
import { ApiError } from '../api/client'
import { PrimaryButton } from '../components/buttons/PrimaryButton'
import { PasswordField } from '../components/PasswordField'
import { BrandMark } from '../components/layout/BrandMark'
import { useAppStore } from '../store/appStore'

export function AuthPage() {
  const [params] = useSearchParams()
  const mode = params.get('mode') === 'login' ? 'login' : 'register'
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const saveDisplayName = useAppStore((s) => s.setDisplayName)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        const name = displayName || 'Driver'
        await register(email, password, name)
        saveDisplayName(name)
      }
      navigate('/app')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col px-6 py-6">
      <header className="flex items-center justify-between">
        <Link to="/" aria-label="Back to start">
          <BrandMark />
        </Link>
        <Link
          to={mode === 'login' ? '/auth?mode=register' : '/auth?mode=login'}
          className="text-sm font-medium text-fg-2 hover:text-fg"
        >
          {mode === 'login' ? 'Create account' : 'Sign in'}
        </Link>
      </header>

      <main className="flex flex-1 flex-col justify-center py-10">
        <h1 className="title text-[2.75rem] text-fg">{mode === 'login' ? 'Welcome back' : 'Start your engine'}</h1>
        <p className="mt-2 text-sm text-fg-2">
          {mode === 'login' ? 'Sign in to see your range and trips.' : 'One account for all your vehicles.'}
        </p>
        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          {mode === 'register' && (
            <label className="block">
              <span className="field-label">Your name</span>
              <input className="field" autoComplete="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </label>
          )}
          <label className="block">
            <span className="field-label">Email</span>
            <input type="email" required autoComplete="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="block">
            <span className="field-label">Password</span>
            <PasswordField
              required
              minLength={8}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {mode === 'register' && <span className="mt-1.5 block text-xs text-fg-3">At least 8 characters.</span>}
          </label>
          {error && (
            <p className="flex items-center gap-2.5 text-sm text-fg-2" role="alert">
              <span className="lamp text-danger" aria-hidden />
              {error}
            </p>
          )}
          <PrimaryButton type="submit" disabled={loading} fullWidth className="!mt-6">
            {loading ? 'One moment…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </PrimaryButton>
        </form>
      </main>
    </div>
  )
}
