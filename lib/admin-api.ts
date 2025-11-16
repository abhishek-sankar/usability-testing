const TOKEN_KEY = 'admin_auth_token'

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(TOKEN_KEY)
}

export function setAdminToken(token: string) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearAdminToken() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(TOKEN_KEY)
}

export async function adminFetch<T = any>(
  path: string,
  init?: RequestInit,
  tokenOverride?: string | null,
): Promise<T> {
  const token = tokenOverride ?? getAdminToken()
  const headers = new Headers(init?.headers || {})
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  if (!headers.has('Content-Type') && init?.body) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(path, {
    ...init,
    headers,
  })

  if (!response.ok) {
    const message = await response
      .text()
      .catch(() => `Request failed with status ${response.status}`)
    throw new Error(message || 'Request failed')
  }

  return (await response.json()) as T
}


