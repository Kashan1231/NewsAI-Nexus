
'use client'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import NewsCard from '@/components/NewsCard'
import Footer from '@/components/Footer'
import Link from 'next/link'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'

export default function SavedPage() {
  const [saved, setSaved] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // Small delay taake localStorage ready ho
    const timer = setTimeout(() => {
      const stored = localStorage.getItem('user')
      const token = localStorage.getItem('token')

      if (stored && token) {
        try {
          const u = JSON.parse(stored)
          setUser(u)
          loadSaved(token)
        } catch {
          localStorage.removeItem('user')
          localStorage.removeItem('token')
        }
      }
      setChecked(true)
      setLoading(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  async function loadSaved(token: string) {
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND}/api/saved`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setSaved(data.saved || [])
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  // Jab tak check nahi hua — kuch mat dikhao
  if (!checked) return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      <Navbar />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      <Navbar />
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>

        <h1 style={{
          fontSize: '24px', fontWeight: '700', color: '#111',
          margin: '0 0 4px', fontFamily: "'Playfair Display', serif"
        }}>
          Saved Articles
        </h1>
        <p style={{ fontSize: '14px', color: '#888', margin: '0 0 2rem' }}>
          {user ? `${saved.length} articles saved` : ''}
        </p>

        {/* Not logged in */}
        {!user ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>
            <p style={{ fontSize: '18px', fontWeight: '600', color: '#111', marginBottom: '8px' }}>
              Sign in to see your saved articles
            </p>
            <p style={{ fontSize: '14px', marginBottom: '1.5rem' }}>
              Create an account or login to save and access articles anytime.
            </p>
            <Link href="/login" style={{
              display: 'inline-block', padding: '12px 28px',
              background: '#111', color: '#fff', borderRadius: '8px',
              textDecoration: 'none', fontWeight: '600', fontSize: '14px'
            }}>
              Login / Sign up
            </Link>
          </div>
        ) : loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem'
          }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{
                height: '300px', background: '#f0f0f0',
                borderRadius: '12px',
                animation: 'pulse 1.5s ease-in-out infinite'
              }} />
            ))}
          </div>
        ) : saved.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>
            <p style={{ fontSize: '18px', fontWeight: '600', color: '#111', marginBottom: '8px' }}>
              No saved articles yet
            </p>
            <p style={{ fontSize: '14px', marginBottom: '1.5rem' }}>
              Browse news and save articles you want to read later.
            </p>
            <Link href="/" style={{
              display: 'inline-block', padding: '12px 28px',
              background: '#111', color: '#fff', borderRadius: '8px',
              textDecoration: 'none', fontWeight: '600', fontSize: '14px'
            }}>
              Browse News
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            {saved.map((item: any) => (
              <NewsCard
                key={item.id}
                article={item}
                initialSaved={true}
                onUnsave={() => loadSaved(localStorage.getItem('token')!)}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}