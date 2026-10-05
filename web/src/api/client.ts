const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

type TokenPair = {
  access_token: string
  refresh_token: string
  expires_in: number
}

let accessToken: string | null = sessionStorage.getItem('access_token')
let refreshToken: string | null = sessionStorage.getItem('refresh_token')

export function setTokens(tokens: TokenPair) {
  accessToken = tokens.access_token
  refreshToken = tokens.refresh_token
  sessionStorage.setItem('access_token', tokens.access_token)
  sessionStorage.setItem('refresh_token', tokens.refresh_token)
}

export function clearTokens() {
  accessToken = null
  refreshToken = null
  sessionStorage.removeItem('access_token')
  sessionStorage.removeItem('refresh_token')
}

export function hasSession() {
  return Boolean(accessToken)
}

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshToken) return false
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  if (!res.ok) {
    clearTokens()
    return false
  }
  const data = (await res.json()) as TokenPair
  setTokens(data)
  return true
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json')
  }
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  let res = await fetch(`${API_URL}${path}`, { ...init, headers })

  if (res.status === 401 && refreshToken) {
    const ok = await refreshAccessToken()
    if (ok) {
      headers.set('Authorization', `Bearer ${accessToken}`)
      res = await fetch(`${API_URL}${path}`, { ...init, headers })
    }
  }

  if (!res.ok) {
    let message = res.statusText
    try {
      const body = await res.json()
      message = body.error ?? message
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, message)
  }

  if (res.status === 204) {
    return undefined as T
  }
  return (await res.json()) as T
}
