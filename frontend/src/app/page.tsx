'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/api'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const { token, user } = getSession()
    if (!token || !user) {
      router.replace('/login')
      return
    }
    if (user.role === 'OFFICER') router.replace('/officer')
    else if (user.role === 'ADMIN') router.replace('/admin')
    else router.replace('/dashboard')
  }, [router])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ color: 'var(--muted)', fontFamily: 'var(--font-display)' }}>Loading…</div>
    </div>
  )
}
