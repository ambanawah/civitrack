'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api, saveSession } from '@/lib/api'

const DEPARTMENTS = ['WATER','ELECTRICITY','ROADS','HEALTH','SANITATION','EDUCATION','SECURITY','OTHER']

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'CITIZEN', department: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const body: any = { name: form.name, email: form.email, password: form.password, role: form.role }
      if (form.role === 'OFFICER' && form.department) body.department = form.department
      const { access_token, user } = await api.auth.register(body)
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
      <div style={styles.panel} className="fade-up">
        <div style={styles.top}>
          <div style={styles.logo}>CT</div>
          <h2 style={styles.title}>Create account</h2>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Join CiviTrack to submit and track complaints</p>
        </div>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div>
            <label>Full name</label>
            <input className="input" placeholder="Jean Dupont" value={form.name} onChange={set('name')} required />
          </div>
          <div>
            <label>Email address</label>
            <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
          </div>
          <div>
            <label>Password</label>
            <input className="input" type="password" placeholder="Min. 6 characters" value={form.password} onChange={set('password')} required minLength={6} />
          </div>
          <div>
            <label>Account type</label>
            <select className="input" value={form.role} onChange={set('role')}>
              <option value="CITIZEN">Citizen</option>
              <option value="OFFICER">Officer</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          {form.role === 'OFFICER' && (
            <div>
              <label>Department</label>
              <select className="input" value={form.department} onChange={set('department')}>
                <option value="">Select department…</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: 4 }}>
            {loading ? 'Creating account…' : 'Create account →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--accent)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    background: 'radial-gradient(ellipse at 30% 20%, #0d1b3e 0%, var(--bg) 60%)',
  },
  panel: {
    width: '100%',
    maxWidth: 460,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 18,
    padding: 36,
  },
  top: { textAlign: 'center' },
  logo: {
    width: 48,
    height: 48,
    background: 'var(--accent)',
    borderRadius: 12,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: 18,
    color: '#fff',
    marginBottom: 14,
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 26,
    fontWeight: 700,
    marginBottom: 6,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
}
