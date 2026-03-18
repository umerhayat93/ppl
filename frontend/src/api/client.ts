const BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || ''

let _token: string | null = null
try { _token = localStorage.getItem('ppl_token') } catch {}

export function setToken(t: string | null) {
  _token = t
  try {
    if (t) localStorage.setItem('ppl_token', t)
    else    localStorage.removeItem('ppl_token')
  } catch {}
}
export function getToken() { return _token }
export function isAdmin()  { return !!_token }

export async function api<T = any>(path: string, method = 'GET', body?: any): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (_token) headers['Authorization'] = `Bearer ${_token}`

  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json.message || json.error || `HTTP ${res.status}`)
  return json.data ?? json
}

export const apiGet    = <T = any>(path: string)                => api<T>(path, 'GET')
export const apiPost   = <T = any>(path: string, body: any)     => api<T>(path, 'POST', body)
export const apiPut    = <T = any>(path: string, body: any)     => api<T>(path, 'PUT', body)
export const apiDelete = <T = any>(path: string)                => api<T>(path, 'DELETE')
