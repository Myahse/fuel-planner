import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { login, register } from '../api/endpoints'
import { ApiError } from '../api/client'
import { Card } from '../components/ui'
import { PrimaryButton } from '../components/buttons/PrimaryButton'
import { PRODUCT } from '../config/product'
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
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <Link to="/" className="mb-8 text-sm font-semibold text-brand-800 hover:text-brand-700">← Back</Link>
      <Card featured>
        <p className="text-sm font-bold text-brand-800">{PRODUCT.name}</p>
        <h1 className="mt-1 text-2xl font-semibold">{mode === 'login' ? 'Sign in' : 'Create account'}</h1>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          {mode === 'register' && (
            <label className="block text-sm">
              <span className="text-muted">Display name</span>
              <input
                className="input-field mt-1"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </label>
          )}
          <label className="block text-sm">
            <span className="text-muted">Email</span>
            <input
              type="email"
              required
              className="input-field mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted">Password</span>
            <input
              type="password"
              required
              minLength={8}
              className="input-field mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <PrimaryButton type="submit" disabled={loading} fullWidth>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </PrimaryButton>
        </form>
        <p className="mt-4 text-center text-sm text-muted">
          {mode === 'login' ? (
            <Link to="/auth?mode=register" className="text-brand-800">Create an account</Link>
          ) : (
            <Link to="/auth?mode=login" className="text-brand-800">Already have an account?</Link>
          )}
        </p>
      </Card>
    </div>
  )
}
