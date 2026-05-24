'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, getSession, clearSession, type Complaint, type Stats } from '@/lib/api'

const PRIORITY_CLASS: Record<string, string> = {
  LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high', CRITICAL: 'badge-critical',
}
const STATUS_CLASS: Record<string, string> = {
  PENDING: 'badge-pending', IN_PROGRESS: 'badge-progress', RESOLVED: 'badge-resolved',
  CLOSED: 'badge-low', REJECTED: 'badge-rejected',
}

type View = 'overview' | 'all' | 'breaches'

export default function AdminPage() {
  const router = useRouter()
  const { user } = getSession()

  const [view, setView]             = useState<View>('overview')
  const [stats, setStats]           = useState<Stats | null>(null)
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [breaches, setBreaches]     = useState<Complaint[]>([])
  const [loading, setLoading]       = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDept, setFilterDept]     = useState('')
  const [assignForm, setAssignForm]     = useState<Record<string, { officerId: string; officerName: string }>>({})
  const [assigning, setAssigning]       = useState<string | null>(null)

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') { router.replace('/login'); return }
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [s, c, b] = await Promise.all([
        api.complaints.stats(),
        api.complaints.all(),
        api.complaints.slaBreaches(),
      ])
      setStats(s); setComplaints(c); setBreaches(b)
    } catch { router.replace('/login') }
    finally { setLoading(false) }
  }

  async function assign(id: string) {
    const f = assignForm[id]
    if (!f?.officerId || !f?.officerName) return
    setAssigning(id)
    try {
      await api.complaints.updateStatus(id, { status: 'IN_PROGRESS' })
      await loadAll()
    } catch (err: any) { alert(err.message) }
    finally { setAssigning(null) }
  }

  function logout() { clearSession(); router.push('/login') }

  const filtered = complaints.filter(c => {
    if (filterStatus && c.status !== filterStatus) return false
    if (filterDept && c.department !== filterDept) return false
    return true
  })

  if (loading) return <Loader />

  return (
    <div style={styles.shell}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.logoWrap}>
          <div style={styles.logo}>CT</div>
          <span style={styles.logoText}>CiviTrack</span>
        </div>
        <nav style={styles.nav}>
          {([['overview', '📊 Overview'], ['all', '📋 All Complaints'], ['breaches', '⚠ SLA Breaches']] as [View, string][]).map(([v, label]) => (
            <div
              key={v}
              style={{ ...styles.navItem, ...(view === v ? { background: 'rgba(59,130,246,0.12)', color: 'var(--accent)' } : { color: 'var(--muted)' }) }}
              onClick={() => setView(v)}
            >
              {label}
              {v === 'breaches' && breaches.length > 0 && (
                <span style={{ marginLeft: 'auto', background: 'var(--red)', color: '#fff', borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>{breaches.length}</span>
              )}
            </div>
          ))}
        </nav>
        <div style={styles.userBlock}>
          <div style={{ ...styles.avatar, background: '#7c3aed' }}>{user?.name?.[0]?.toUpperCase()}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{user?.name}</div>
            <div style={{ color: 'var(--muted)', fontSize: 11 }}>ADMIN</div>
          </div>
          <button className="btn btn-ghost" onClick={logout} style={{ padding: '6px 10px', fontSize: 12, marginLeft: 'auto' }}>Out</button>
        </div>
      </aside>

      {/* Main */}
      <main style={styles.main}>

        {/* ── OVERVIEW ── */}
        {view === 'overview' && stats && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="fade-up">
            <div>
              <h1 style={styles.pageTitle}>System Overview</h1>
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>Real-time metrics across all departments</p>
            </div>

            {/* Big stats */}
            <div style={styles.statsGrid}>
              {[
                { label: 'Total Complaints', value: stats.total, color: 'var(--text)', icon: '📋' },
                { label: 'Pending', value: stats.pending, color: 'var(--accent)', icon: '🕐' },
                { label: 'In Progress', value: stats.inProgress, color: 'var(--yellow)', icon: '⚙' },
                { label: 'Resolved', value: stats.resolved, color: 'var(--green)', icon: '✓' },
                { label: 'SLA Breached', value: stats.slaBreached, color: 'var(--red)', icon: '⚠' },
              ].map(s => (
                <div key={s.label} className="card">
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontSize: 36, fontFamily: 'var(--font-display)', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Department breakdown */}
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 16, fontSize: 16 }}>Complaints by Department</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {stats.byDepartment.sort((a, b) => b.count - a.count).map(d => {
                  const pct = stats.total > 0 ? (d.count / stats.total) * 100 : 0
                  return (
                    <div key={d.department}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{d.department}</span>
                        <span style={{ color: 'var(--muted)' }}>{d.count}</span>
                      </div>
                      <div style={{ background: 'var(--border)', borderRadius: 4, height: 6 }}>
                        <div style={{ background: 'var(--accent)', borderRadius: 4, height: 6, width: `${pct}%`, transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Recent breaches preview */}
            {breaches.length > 0 && (
              <div className="card" style={{ borderColor: '#4a2a2a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--red)' }}>⚠ SLA Breaches ({breaches.length})</h3>
                  <button className="btn btn-ghost" style={{ fontSize: 12, padding: '5px 10px' }} onClick={() => setView('breaches')}>View all</button>
                </div>
                {breaches.slice(0, 3).map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <span>{c.title}</span>
                    <span style={{ color: 'var(--muted)' }}>{c.department} · {c.citizenName}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ALL COMPLAINTS ── */}
        {view === 'all' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="fade-up">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 style={styles.pageTitle}>All Complaints</h1>
                <p style={{ color: 'var(--muted)', fontSize: 13 }}>{filtered.length} of {complaints.length} shown</p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <select className="input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 150 }}>
                  <option value="">All statuses</option>
                  {['PENDING','IN_PROGRESS','RESOLVED','CLOSED','REJECTED'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                </select>
                <select className="input" value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ width: 150 }}>
                  <option value="">All departments</option>
                  {['WATER','ELECTRICITY','ROADS','HEALTH','SANITATION','EDUCATION','SECURITY','OTHER'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(c => (
                <div key={c.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14 }}>{c.title}</span>
                      {c.slaBreached && <span className="badge badge-breached">⚠ SLA</span>}
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: 12 }}>{c.citizenName} · {c.department} · {new Date(c.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span className={`badge ${STATUS_CLASS[c.status] || 'badge-low'}`}>{c.status.replace('_',' ')}</span>
                    <span className={`badge ${PRIORITY_CLASS[c.priority] || 'badge-low'}`}>{c.priority}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SLA BREACHES ── */}
        {view === 'breaches' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="fade-up">
            <div>
              <h1 style={{ ...styles.pageTitle, color: 'var(--red)' }}>⚠ SLA Breaches</h1>
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>{breaches.length} complaints exceeded their resolution deadline</p>
            </div>

            {breaches.length === 0 && (
              <div className="card" style={{ textAlign: 'center', color: 'var(--green)', padding: 48 }}>
                ✓ No SLA breaches. All complaints are within deadline.
              </div>
            )}

            {breaches.map(c => (
              <div key={c.id} className="card" style={{ borderColor: '#4a2a2a', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{c.title}</div>
                    <div style={{ color: 'var(--muted)', fontSize: 12 }}>{c.citizenName} · {c.category} · {c.department}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span className={`badge ${STATUS_CLASS[c.status] || 'badge-low'}`}>{c.status.replace('_',' ')}</span>
                    <span className={`badge ${PRIORITY_CLASS[c.priority] || 'badge-low'}`}>{c.priority}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'var(--red)', borderTop: '1px solid #4a2a2a', paddingTop: 8 }}>
                  <span>Deadline was: {new Date(c.slaDeadline).toLocaleString()}</span>
                  <span>SLA: {c.slaHours}h</span>
                  {c.assignedOfficerName
                    ? <span style={{ color: 'var(--muted)' }}>Assigned to: {c.assignedOfficerName}</span>
                    : <span style={{ color: 'var(--orange)' }}>⚠ Unassigned</span>
                  }
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  )
}

function Loader() {
  return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'var(--muted)', fontFamily:'var(--font-display)' }}>Loading…</div>
}

const styles: Record<string, React.CSSProperties> = {
  shell:     { display: 'flex', minHeight: '100vh' },
  sidebar:   { width: 230, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '24px 16px', gap: 8 },
  logoWrap:  { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '0 8px' },
  logo:      { width: 32, height: 32, background: 'var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: '#fff' },
  logoText:  { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 },
  nav:       { flex: 1, display: 'flex', flexDirection: 'column', gap: 4 },
  navItem:   { padding: '10px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center' },
  userBlock: { display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid var(--border)', paddingTop: 16 },
  avatar:    { width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: '#fff', flexShrink: 0 },
  main:      { flex: 1, padding: 32, display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto', maxHeight: '100vh' },
  pageTitle: { fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 4 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 },
}
