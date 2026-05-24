'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api, saveSession } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { access_token, user } = await api.auth.login(form)
      saveSession(access_token, user)
      if (user.role === 'OFFICER') router.push('/officer')
      else if (user.role === 'ADMIN') router.push('/admin')
      else router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.brand}>
          <div style={styles.logo}>CT</div>
          <h1 style={styles.title}>CiviTrack</h1>
          <p style={styles.tagline}>Civic complaints. Tracked. Resolved.</p>
        </div>
        <div style={styles.stats}>
          {[['Real-time', 'SLA tracking'], ['Auto', 'Classification'], ['Full', 'Audit trail']].map(([n, l]) => (
            <div key={n} style={styles.stat}>
              <span style={styles.statNum}>{n}</span>
              <span style={styles.statLabel}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.right}>
        <form onSubmit={handleSubmit} style={styles.form} className="fade-up">
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Sign in</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>Access your dashboard</p>
          </div>

          {error && <div className="error-box">{error}</div>}

          <div>
            <label>Email address</label>
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>

          <div>
            <label>Password</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>
            No account?{' '}
            <Link href="/register" style={{ color: 'var(--accent)' }}>Register here</Link>
          </p>
        </form>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex',
    minHeight: '100vh',
  },
  left: {
    flex: 1,
    background: 'linear-gradient(135deg, #0d1117 0%, #111827 50%, #0a0f1e 100%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '60px',
    borderRight: '1px solid var(--border)',
    position: 'relative',
    overflow: 'hidden',
  },
  brand: { marginBottom: 60 },
  logo: {
    width: 56,
    height: 56,
    background: 'var(--accent)',
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: 20,
    color: '#fff',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 42,
    fontWeight: 800,
    color: '#fff',
    letterSpacing: '-0.03em',
    marginBottom: 10,
  },
  tagline: {
    color: 'var(--muted)',
    fontSize: 16,
    fontFamily: 'var(--font-body)',
  },
  stats: {
    display: 'flex',
    gap: 32,
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  statNum: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: 20,
    color: 'var(--accent)',
  },
  statLabel: {
    fontSize: 12,
    color: 'var(--muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  right: {
    width: 460,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    background: 'var(--bg)',
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  formHeader: { marginBottom: 8 },
  formTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 4,
  },
}
