'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import NewsCard from '@/components/NewsCard'
import Footer from '@/components/Footer'
import { History, Clock } from 'lucide-react'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    async function fetchHistory() {
      try {
        const res = await fetch(`${BACKEND}/api/personalization/history`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        setHistory(data.history || [])
      } catch (e) {
        console.error(e)
      }
      setLoading(false)
    }

    fetchHistory()
  }, [router])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-foreground shadow-sm">
            <History size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Reading History</h1>
            <p className="text-muted-foreground">Articles you've analyzed recently</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-24 text-muted-foreground">Loading your history...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-24 bg-muted/20 rounded-3xl border border-dashed border-border">
            <Clock size={48} className="mx-auto mb-4 text-muted-foreground opacity-20" />
            <h3 className="text-xl font-bold mb-2">Your history is empty</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Start reading articles and they will appear here to help the AI personalize your feed.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {history.map(article => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
