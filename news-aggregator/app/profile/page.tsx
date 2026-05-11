'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import NewsCard from '@/components/NewsCard'
import Footer from '@/components/Footer'
import { User, BookOpen, Bookmark, TrendingUp, Clock, Settings, ShieldCheck } from 'lucide-react'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (!token || !storedUser) {
      router.push('/login')
      return
    }

    const userData = JSON.parse(storedUser)
    setUser(userData)

    async function fetchProfileData() {
      try {
        const [statsRes, historyRes] = await Promise.all([
          fetch(`${BACKEND}/api/personalization/stats`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${BACKEND}/api/personalization/history`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ])

        const statsData = await statsRes.json()
        const historyData = await historyRes.json()

        setStats(statsData)
        setHistory(historyData.history || [])
      } catch (e) {
        console.error(e)
      }
      setLoading(false)
    }

    fetchProfileData()
  }, [router])

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Analyzing intelligence...</div>

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Profile Header */}
        <div className="relative mb-12 p-8 rounded-[2rem] bg-muted/30 border border-border overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full -mr-20 -mt-20" />
          
          <div className="relative flex flex-col md:flex-row items-center gap-8">
            <div className="w-24 h-24 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-2xl shadow-blue-500/20">
              <User size={48} />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-extrabold mb-2">{user.fullName}</h1>
              <p className="text-muted-foreground mb-4 flex items-center justify-center md:justify-start gap-2">
                <ShieldCheck size={16} className="text-blue-500" /> Member since {new Date().getFullYear()}
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                {stats?.interests?.map((it: any) => (
                  <span key={it.category} className="px-3 py-1 rounded-full bg-background border border-border text-xs font-bold uppercase tracking-wider">
                    {it.category}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-4">
              <button className="p-3 rounded-xl bg-background border border-border hover:bg-muted transition-colors">
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="premium-card flex flex-col gap-2">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <BookOpen size={20} />
            </div>
            <p className="text-4xl font-black mt-2">{stats?.reads || 0}</p>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Articles Read</p>
          </div>
          
          <div className="premium-card flex flex-col gap-2">
            <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center justify-center">
              <Bookmark size={20} />
            </div>
            <p className="text-4xl font-black mt-2">{stats?.saved || 0}</p>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Saved Insights</p>
          </div>

          <div className="premium-card flex flex-col gap-2">
            <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <p className="text-4xl font-black mt-2">{stats?.interests?.length || 0}</p>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Active Interests</p>
          </div>
        </div>

        {/* Reading History */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-muted rounded-lg">
              <Clock size={20} />
            </div>
            <h2 className="text-2xl font-bold">Recent Intelligence</h2>
          </div>
          
          {history.length === 0 ? (
            <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border">
              <p className="text-muted-foreground">Your reading history will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {history.map(article => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
