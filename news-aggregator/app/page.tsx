'use client'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import NewsCard from '@/components/NewsCard'
import SkeletonCard from '@/components/SkeletonCard'
import Footer from '@/components/Footer'
import { Sparkles, Zap, TrendingUp, Filter } from 'lucide-react'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
const CATEGORIES = ['all', 'for-you', 'technology', 'sports', 'politics', 'business', 'health', 'entertainment', 'science']

function HomeContent() {
  const [articles, setArticles] = useState<any[]>([])
  const [trending, setTrending] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [fetching, setFetching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [user, setUser] = useState<any>(null)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))

    const cat = searchParams.get('category')
    const search = searchParams.get('search')
    
    if (search) {
      setSearchQuery(search)
      setActiveCategory('all')
    } else if (cat) {
      setActiveCategory(cat)
      setSearchQuery('')
    } else {
      setActiveCategory('all')
      setSearchQuery('')
    }
  }, [searchParams])

  const loadArticles = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      let url = ''
      let headers: any = {}

      if (searchQuery) {
        url = `${BACKEND}/api/search?q=${encodeURIComponent(searchQuery)}`
      } else if (activeCategory === 'for-you') {
        if (!token) {
          router.push('/login')
          return
        }
        url = `${BACKEND}/api/personalization/for-you`
        headers = { Authorization: `Bearer ${token}` }
      } else if (activeCategory === 'all') {
        url = `${BACKEND}/api/articles`
      } else {
        url = `${BACKEND}/api/articles?category=${activeCategory}`
      }

      const res = await fetch(url, { headers })
      const data = await res.json()
      
      // Ensure unique IDs to avoid React key warnings
      const uniqueArticles = Array.from(new Map((data.articles || []).map((a: any) => [a.id, a])).values())
      setArticles(uniqueArticles)

      // Fetch trending if on home
      if (activeCategory === 'all' && !searchQuery) {
        const trendRes = await fetch(`${BACKEND}/api/news/trending`)
        const trendData = await trendRes.json()
        setTrending(trendData.articles || [])
      }
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }, [activeCategory, searchQuery, router])

  useEffect(() => {
    loadArticles()
  }, [loadArticles])

  // The background ingestion is handled by a server-side cron job every 20 minutes.
  // This button now simply refreshes the feed from the database for a snappy experience.
  async function fetchFreshNews() {
    setFetching(true)
    try {
      // Short artificial delay to give the user visual feedback that a "sync" happened
      await new Promise(resolve => setTimeout(resolve, 800))
      await loadArticles()
    } catch (e) {
      console.error(e)
    }
    setFetching(false)
  }

  const featuredArticle = articles[0]
  const restArticles = articles.slice(1)

  return (
    <div className="min-h-screen bg-background" suppressHydrationWarning>
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Hero Section */}
        {!searchQuery && activeCategory === 'all' && (
          <div className="relative mb-16 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-600/10 text-blue-600 text-xs font-bold uppercase tracking-widest mb-6">
              <Sparkles size={14} fill="currentColor" />
              <span>Next-Gen News Intelligence</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 font-serif leading-[1.1]">
              The world, <span className="text-blue-600">understood.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Experience a news platform that doesn't just aggregate — it analyzes. Real-time sentiment, bias detection, and AI-powered semantic search.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={fetchFreshNews}
                disabled={fetching}
                className="flex items-center gap-2 px-8 py-4 bg-foreground text-background rounded-full font-bold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-foreground/10 disabled:opacity-50"
              >
                {fetching ? <Zap size={18} className="animate-spin" /> : <Zap size={18} fill="currentColor" />}
                {fetching ? 'Syncing...' : 'Get Latest News'}
              </button>
            </div>
          </div>
        )}



        {/* Trending Search Tags */}
        {!searchQuery && activeCategory === 'all' && (
          <div className="flex flex-wrap items-center gap-3 mb-10">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mr-2">Deep Insights:</span>
            {['AI Tech', 'Global Economy', 'Future of Space', 'Sustainability'].map(tag => (
              <button 
                key={tag}
                onClick={() => router.push(`/?search=${encodeURIComponent(tag)}`)}
                className="px-5 py-2 rounded-xl bg-blue-600/5 text-blue-600 border border-blue-600/10 text-xs font-bold hover:bg-blue-600 hover:text-white hover:scale-105 transition-all shadow-sm"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Category Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-border pb-8">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2 md:pb-0">
            <div className="p-2 bg-muted rounded-lg text-muted-foreground mr-2 hidden md:block">
              <Filter size={18} />
            </div>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  if (cat === 'all') router.push('/')
                  else setActiveCategory(cat)
                }}
                className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-semibold capitalize transition-all border-none cursor-pointer ${
                  activeCategory === cat 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105' 
                    : 'bg-muted text-muted-foreground hover:bg-border hover:text-foreground'
                }`}
              >
                {cat.replace('-', ' ')}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {searchQuery && (
              <div className="text-lg font-bold tracking-tight">
                Results for <span className="text-blue-600 bg-blue-600/10 px-3 py-1 rounded-lg">"{searchQuery}"</span>
              </div>
            )}
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={14} />
              {articles.length} Articles Found
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-24 px-6 rounded-3xl bg-muted/30 border border-dashed border-border">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4 text-muted-foreground">
              <Sparkles size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">No intelligence found</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              {searchQuery 
                ? "Our AI couldn't find matches for your query. Try different keywords or check out the 'For You' feed." 
                : "Try fetching fresh news to populate your feed."}
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Featured Article - Only on 'all' and no search */}
            {featuredArticle && !searchQuery && activeCategory === 'all' && (
              <div className="animate-in fade-in zoom-in-95 duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-muted/30 rounded-[2rem] p-6 md:p-10 border border-border group">
                  <div className="lg:col-span-7 overflow-hidden rounded-2xl aspect-video">
                    <img 
                      src={featuredArticle.image_url} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                      alt={featuredArticle.title}
                    />
                  </div>
                  <div className="lg:col-span-5 space-y-6">
                    <div className="inline-block px-3 py-1 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest">
                      Featured Today
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold font-serif leading-tight group-hover:text-blue-600 transition-colors">
                      {featuredArticle.title}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                      {featuredArticle.summary || featuredArticle.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm pt-4">
                      <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold">
                        {featuredArticle.source?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold">{featuredArticle.source}</p>
                        <p className="text-muted-foreground text-xs">{new Date(featuredArticle.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => window.open(featuredArticle.url, '_blank')}
                      className="w-full md:w-auto px-8 py-3 rounded-xl bg-foreground text-background font-bold hover:opacity-90 transition-all"
                    >
                      Read Full Analysis
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {(activeCategory === 'all' && !searchQuery ? restArticles : articles).map(article => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <HomeContent />
    </Suspense>
  )
}