'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, getSession, clearSession, type Complaint } from '@/lib/api'

const STATUS_OPTIONS = ['PENDING','IN_PROGRESS','RESOLVED','CLOSED','REJECTED']
const PRIORITY_CLASS: Record<string, string> = {
  LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high', CRITICAL: 'badge-critical',
}
const STATUS_CLASS: Record<string, string> = {
  PENDING: 'badge-pending', IN_PROGRESS: 'badge-progress', RESOLVED: 'badge-resolved',
  CLOSED: 'badge-low', REJECTED: 'badge-rejected',
}

export default function OfficerPage() {
  const router = useRouter()
  const { user } = getSession()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [statusForm, setStatusForm] = useState<Record<string, { status: string; note: string }>>({})

  useEffect(() => {
    if (!user || user.role !== 'OFFICER') { router.replace('/login'); return }
    load()
  }, [])

  async function load() {
    try {
      const dept = user?.department || 'WATER'
      const data = await api.complaints.byDepartment(dept)
      setComplaints(data)
    } catch { router.replace('/login') }
    finally { setLoading(false) }
  }

  async function updateStatus(id: string) {
    const f = statusForm[id]
    if (!f?.status) return
    setUpdating(id)
    try {
      await api.complaints.updateStatus(id, { status: f.status, note: f.note })
      await load()
      setExpanded(null)
    } catch (err: any) {
      alert(err.message)
    } finally { setUpdating(null) }
  }

  function logout() { clearSession(); router.push('/login') }

  const pending    = complaints.filter(c => c.status === 'PENDING').length
  const inProgress = complaints.filter(c => c.status === 'IN_PROGRESS').length
  const breached   = complaints.filter(c => c.slaBreached).length

  if (loading) return <Loader />

  return (
    <div style={styles.shell}>
      <aside style={styles.sidebar}>
        <div style={styles.logoWrap}>
          <div style={styles.logo}>CT</div>
          <span style={styles.logoText}>CiviTrack</span>
        </div>
        <nav style={styles.nav}>
          <div style={{ ...styles.navItem, background: 'rgba(59,130,246,0.12)', color: 'var(--accent)' }}>
            🗂 Department Queue
          </div>
        </nav>
        <div style={styles.userBlock}>
          <div style={styles.avatar}>{user?.name?.[0]?.toUpperCase()}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{user?.name}</div>
            <div style={{ color: 'var(--muted)', fontSize: 11 }}>{user?.department || 'OFFICER'}</div>
          </div>
          <button className="btn btn-ghost" onClick={logout} style={{ padding: '6px 10px', fontSize: 12, marginLeft: 'auto' }}>Out</button>
        </div>
      </aside>

      <main style={styles.main}>
        <div style={styles.topbar}>
          <div>
            <h1 style={styles.pageTitle}>
              {user?.department || 'My'} Department
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>Review and update complaint statuses</p>
          </div>
        </div>

        {/* Stats */}
        <div style={styles.statsRow}>
          {[
            { label: 'Total', value: complaints.length, color: 'var(--text)' },
            { label: 'Pending', value: pending, color: 'var(--accent)' },
            { label: 'In Progress', value: inProgress, color: 'var(--yellow)' },
            { label: 'SLA Breached', value: breached, color: 'var(--red)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Complaint list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {complaints.length === 0 && (
            <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: 48 }}>
              No complaints in your department queue.
            </div>
          )}

          {complaints.map(c => {
            const open = expanded === c.id
            const sf = statusForm[c.id] || { status: c.status, note: '' }

            return (
              <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15 }}>{c.title}</span>
                      {c.slaBreached && <span className="badge badge-breached">⚠ SLA</span>}
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                      {c.citizenName} · {c.category} · {new Date(c.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span className={`badge ${STATUS_CLASS[c.status] || 'badge-low'}`}>{c.status.replace('_', ' ')}</span>
                    <span className={`badge ${PRIORITY_CLASS[c.priority] || 'badge-low'}`}>{c.priority}</span>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '5px 10px', fontSize: 12 }}
                      onClick={() => setExpanded(open ? null : c.id)}
                    >
                      {open ? 'Close' : 'Update'}
                    </button>
                  </div>
                </div>

                {open && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }} className="fade-up">
                    <p style={{ color: 'var(--muted)', fontSize: 13 }}>{c.description}</p>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <label>New Status</label>
                        <select
                          className="input"
                          value={sf.status}
                          onChange={e => setStatusForm(f => ({ ...f, [c.id]: { ...sf, status: e.target.value } }))}
                        >
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: 2 }}>
                        <label>Note (optional)</label>
                        <input
                          className="input"
                          placeholder="Add a note…"
                          value={sf.note}
                          onChange={e => setStatusForm(f => ({ ...f, [c.id]: { ...sf, note: e.target.value } }))}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button
                        className="btn btn-primary"
                        onClick={() => updateStatus(c.id)}
                        disabled={updating === c.id}
                        style={{ padding: '8px 16px', fontSize: 13 }}
                      >
                        {updating === c.id ? 'Saving…' : 'Save Update'}
                      </button>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                        SLA deadline: {new Date(c.slaDeadline).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}

function Loader() {
  return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'var(--muted)', fontFamily:'var(--font-display)' }}>Loading…</div>
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
  avatar:    { width: 32, height: 32, background: '#065f46', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: '#fff', flexShrink: 0 },
  main:      { flex: 1, padding: 32, display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto', maxHeight: '100vh' },
  topbar:    { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 },
  pageTitle: { fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 4 },
  statsRow:  { display: 'flex', gap: 12 },
}
