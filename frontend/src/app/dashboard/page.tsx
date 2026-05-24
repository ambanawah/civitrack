'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, getSession, clearSession, type Complaint } from '@/lib/api'

const DEPARTMENTS = ['WATER','ELECTRICITY','ROADS','HEALTH','SANITATION','EDUCATION','SECURITY','OTHER']

const PRIORITY_CLASS: Record<string, string> = {
  LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high', CRITICAL: 'badge-critical',
}
const STATUS_CLASS: Record<string, string> = {
  PENDING: 'badge-pending', IN_PROGRESS: 'badge-progress', RESOLVED: 'badge-resolved',
  CLOSED: 'badge-low', REJECTED: 'badge-rejected',
}

export default function DashboardPage() {
  const router = useRouter()
  const { user } = getSession()

  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({ title: '', description: '', department: '' })

  useEffect(() => {
    if (!user || user.role !== 'CITIZEN') { router.replace('/login'); return }
    load()
  }, [])

  async function load() {
    try {
      const data = await api.complaints.mine()
      setComplaints(data)
    } catch { router.replace('/login') }
    finally { setLoading(false) }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess('')
    setSubmitting(true)
    try {
      const body: any = { title: form.title, description: form.description }
      if (form.department) body.department = form.department
      await api.complaints.create(body)
      setSuccess('Complaint submitted! Auto-classified and SLA set.')
      setForm({ title: '', description: '', department: '' })
      setShowForm(false)
      await load()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false) }
  }

  function logout() { clearSession(); router.push('/login') }

  const pending   = complaints.filter(c => c.status === 'PENDING').length
  const resolved  = complaints.filter(c => c.status === 'RESOLVED').length
  const breached  = complaints.filter(c => c.slaBreached).length

  if (loading) return <Loading />

  return (
    <div style={styles.shell}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.logoWrap}>
          <div style={styles.logo}>CT</div>
          <span style={styles.logoText}>CiviTrack</span>
        </div>
        <nav style={styles.nav}>
          <div style={{ ...styles.navItem, background: 'rgba(59,130,246,0.12)', color: 'var(--accent)' }}>
            📋 My Complaints
          </div>
        </nav>
        <div style={styles.userBlock}>
          <div style={styles.avatar}>{user?.name?.[0]?.toUpperCase()}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{user?.name}</div>
            <div style={{ color: 'var(--muted)', fontSize: 11 }}>CITIZEN</div>
          </div>
          <button className="btn btn-ghost" onClick={logout} style={{ padding: '6px 10px', fontSize: 12, marginLeft: 'auto' }}>Out</button>
        </div>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        <div style={styles.topbar}>
          <div>
            <h1 style={styles.pageTitle}>My Complaints</h1>
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>Submit and track your civic issues</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
            {showForm ? '✕ Cancel' : '+ New Complaint'}
          </button>
        </div>

        {/* Stats row */}
        <div style={styles.statsRow}>
          {[
            { label: 'Total', value: complaints.length, color: 'var(--text)' },
            { label: 'Pending', value: pending, color: 'var(--accent)' },
            { label: 'Resolved', value: resolved, color: 'var(--green)' },
            { label: 'SLA Breached', value: breached, color: 'var(--red)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {error   && <div className="error-box">{error}</div>}
        {success && <div style={{ background: '#0d2010', border: '1px solid #2a4a2a', borderRadius: 8, color: 'var(--green)', fontSize: 13, padding: '10px 14px' }}>{success}</div>}

        {/* Submit form */}
        {showForm && (
          <div className="card fade-up">
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 20, fontSize: 18 }}>New Complaint</h3>
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label>Title</label>
                <input className="input" placeholder="e.g. Water pipe broken on Avenue Kennedy" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required minLength={5} />
              </div>
              <div>
                <label>Description</label>
                <textarea className="input" placeholder="Describe the issue in detail (min. 20 characters). The system will auto-detect the department and set SLA." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required minLength={20} />
              </div>
              <div>
                <label>Department (optional — auto-detected)</label>
                <select className="input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                  <option value="">Auto-detect from description</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <button className="btn btn-primary" type="submit" disabled={submitting} style={{ alignSelf: 'flex-start' }}>
                {submitting ? 'Submitting…' : 'Submit Complaint →'}
              </button>
            </form>
          </div>
        )}

        {/* Complaint list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {complaints.length === 0 && (
            <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: 48 }}>
              No complaints yet. Submit your first one above.
            </div>
          )}
          {complaints.map(c => (
            <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15 }}>{c.title}</span>
                    {c.slaBreached && <span className="badge badge-breached">⚠ SLA Breached</span>}
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: 12 }}>{c.category} · {c.department} · {new Date(c.createdAt).toLocaleDateString()}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <span className={`badge ${STATUS_CLASS[c.status] || 'badge-low'}`}>{c.status.replace('_', ' ')}</span>
                  <span className={`badge ${PRIORITY_CLASS[c.priority] || 'badge-low'}`}>{c.priority}</span>
                </div>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.5 }}>{c.description}</p>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted)', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                <span>SLA: {c.slaHours}h</span>
                <span>Deadline: {new Date(c.slaDeadline).toLocaleString()}</span>
                {c.assignedOfficerName && <span>Officer: {c.assignedOfficerName}</span>}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

function Loading() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--muted)', fontFamily: 'var(--font-display)' }}>
      Loading…
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  shell:     { display: 'flex', minHeight: '100vh' },
  sidebar:   { width: 220, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '24px 16px', gap: 8 },
  logoWrap:  { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '0 8px' },
  logo:      { width: 32, height: 32, background: 'var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: '#fff' },
  logoText:  { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 },
  nav:       { flex: 1, display: 'flex', flexDirection: 'column', gap: 4 },
  navItem:   { padding: '10px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' },
  userBlock: { display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid var(--border)', paddingTop: 16 },
  avatar:    { width: 32, height: 32, background: 'var(--accent-dim)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: '#fff', flexShrink: 0 },
  main:      { flex: 1, padding: 32, display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto', maxHeight: '100vh' },
  topbar:    { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 },
  pageTitle: { fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 4 },
  statsRow:  { display: 'flex', gap: 12 },
}
