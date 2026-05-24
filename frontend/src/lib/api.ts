const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('civitrack_token')
}

function authHeaders(): HeadersInit {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const message = data?.message || `Request failed: ${res.status}`
    throw new Error(Array.isArray(message) ? message.join(', ') : message)
  }

  return data as T
}

// ── Auth ─────────────────────────────────────
export const api = {
  auth: {
    register: (body: { email: string; password: string; name: string; role?: string }) =>
      request<{ access_token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    login: (body: { email: string; password: string }) =>
      request<{ access_token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    profile: () => request<User>('/auth/profile'),
  },

  complaints: {
    create: (body: { title: string; description: string; department?: string }) =>
      request<Complaint>('/complaints', { method: 'POST', body: JSON.stringify(body) }),

    mine: () => request<Complaint[]>('/complaints/mine'),

    all: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return request<Complaint[]>(`/complaints${qs}`)
    },

    byDepartment: (dept: string) =>
      request<Complaint[]>(`/complaints/department/${dept}`),

    one: (id: string) => request<Complaint>(`/complaints/${id}`),

    updateStatus: (id: string, body: { status: string; note?: string }) =>
      request<Complaint>(`/complaints/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),

    slaBreaches: () => request<Complaint[]>('/complaints/sla-breaches'),

    stats: () => request<Stats>('/complaints/stats'),
  },
}

// ── Types ────────────────────────────────────
export interface User {
  id: string
  email: string
  name: string
  role: 'CITIZEN' | 'OFFICER' | 'ADMIN'
  department?: string
}

export interface Complaint {
  id: string
  citizenId: string
  citizenEmail: string
  citizenName: string
  title: string
  description: string
  department: string
  category: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REJECTED'
  slaHours: number
  slaDeadline: string
  slaBreached: boolean
  assignedOfficerName?: string
  events: ComplaintEvent[]
  createdAt: string
  updatedAt: string
}

export interface ComplaintEvent {
  id: string
  action: string
  actorName: string
  actorRole: string
  oldValue?: string
  newValue?: string
  note?: string
  createdAt: string
}

export interface Stats {
  total: number
  pending: number
  inProgress: number
  resolved: number
  slaBreached: number
  byDepartment: { department: string; count: number }[]
}

export function saveSession(token: string, user: User) {
  localStorage.setItem('civitrack_token', token)
  localStorage.setItem('civitrack_user', JSON.stringify(user))
}

export function getSession(): { token: string | null; user: User | null } {
  if (typeof window === 'undefined') return { token: null, user: null }
  const token = localStorage.getItem('civitrack_token')
  const raw = localStorage.getItem('civitrack_user')
  const user = raw ? JSON.parse(raw) : null
  return { token, user }
}

export function clearSession() {
  localStorage.removeItem('civitrack_token')
  localStorage.removeItem('civitrack_user')
}
