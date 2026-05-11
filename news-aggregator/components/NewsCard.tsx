import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Bookmark, BookmarkCheck, ExternalLink, Sparkles, Clock, Globe, Brain, Send, X, MessageSquare, Zap } from 'lucide-react'



const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'

type Article = {
  id: string
  title: string
  description: string
  summary?: string
  url: string
  image_url: string
  source: string
  category: string
  sentiment: string
  bias_score: string
  published_at: string
}

const fallbackImages: Record<string, string[]> = {
  technology: [
    'https://images.unsplash.com/photo-1518770660439-4636190af475', 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c',
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1', 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97',
    'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5'
  ],
  sports: [
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211',
    'https://images.unsplash.com/photo-1517649763962-0c623066013b', 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e',
    'https://images.unsplash.com/photo-1504450758481-7338eba7524a', 'https://images.unsplash.com/photo-1471295253337-3ceaaedca402',
    'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d', 'https://images.unsplash.com/photo-1516567727245-ad8c68f3ec93',
    'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8', 'https://images.unsplash.com/photo-1505235687559-28b5f54645b7'
  ],
  politics: [
    'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620', 'https://images.unsplash.com/photo-1541872703-74c5e443d1f9',
    'https://images.unsplash.com/photo-1523995462485-3d171b5c8fb9', 'https://images.unsplash.com/photo-1450149632596-3ef25a620117',
    'https://images.unsplash.com/photo-1555848962-6e79363ec58f', 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c',
    'https://images.unsplash.com/photo-1575320181282-9afab399332c', 'https://images.unsplash.com/photo-1517048676732-d65bc937f952',
    'https://images.unsplash.com/photo-1521791136064-7986c2959210', 'https://images.unsplash.com/photo-1494172961521-33799dab43a5'
  ],
  business: [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf', 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f',
    'https://images.unsplash.com/photo-1454165833222-d1d724630d67', 'https://images.unsplash.com/photo-1556761175-b413da4baf72',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f', 'https://images.unsplash.com/photo-1444653614773-995cb1ef9efa',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7', 'https://images.unsplash.com/photo-1552664730-d307ca884978'
  ],
  science: [
    'https://images.unsplash.com/photo-1507413245164-6160d8298b31', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa',
    'https://images.unsplash.com/photo-1532094349884-543bb1198343', 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa',
    'https://images.unsplash.com/photo-1530210124550-912dc1381cb8', 'https://images.unsplash.com/photo-1518152006812-edab29bb0a6a',
    'https://images.unsplash.com/photo-1516339901600-2e1a62dc0c45', 'https://images.unsplash.com/photo-1564325724739-bae0bd08bc62',
    'https://images.unsplash.com/photo-1507668077129-56e32842fceb', 'https://images.unsplash.com/photo-1519681393784-d120267933ba'
  ],
  health: [
    'https://images.unsplash.com/photo-1505751172107-573225a9120e', 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773',
    'https://images.unsplash.com/photo-1535914223966-332a7e4400a0', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
    'https://images.unsplash.com/photo-1551076805-e1869033e561', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b', 'https://images.unsplash.com/photo-1445510861639-5651173bc5d5'
  ],
  entertainment: [
    'https://images.unsplash.com/photo-1499364615650-ec385728efce', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745',
    'https://images.unsplash.com/photo-1514525253361-bee8a19740c1', 'https://images.unsplash.com/photo-1586899028174-e7098604235b',
    'https://images.unsplash.com/photo-1485846234645-a62644f84728', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4',
    'https://images.unsplash.com/photo-1536440136628-849c177e76a1', 'https://images.unsplash.com/photo-1478720568477-152d9b164e26',
    'https://images.unsplash.com/photo-1510511459019-5dee995d3ff4', 'https://images.unsplash.com/photo-1496337589254-7e19d01ced44'
  ],
  general: [
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c', 'https://images.unsplash.com/photo-1495020689067-958852a7765e',
    'https://images.unsplash.com/photo-1476242906366-d8eb64c2f661', 'https://images.unsplash.com/photo-1585829365234-78d2b9ff0447',
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3',
    'https://images.unsplash.com/photo-1503694978374-8a2fa686963a', 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d',
    'https://images.unsplash.com/photo-1508921334172-b1fad99033b8', 'https://images.unsplash.com/photo-1511649475669-e278d2c67b72'
  ]
}

// Simple hash function to consistently map a string to an index
function getHashIndex(str: string, max: number) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % max;
}

export default function NewsCard({
  article,
  initialSaved = false,
  onUnsave
}: {
  article: Article
  initialSaved?: boolean
  onUnsave?: () => void
}) {
  const [saved, setSaved] = useState(initialSaved)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [isAskModalOpen, setIsAskModalOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [asking, setAsking] = useState(false)


  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))
    
    // Prevent scrolling when modal is open
    if (isAskModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isAskModalOpen])


  async function handleCardClick() {
    window.open(article.url, '_blank')
    
    // Track click for personalization if user is logged in
    if (user) {
      const token = localStorage.getItem('token')
      try {
        fetch(`${BACKEND}/api/personalization/track`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ articleId: article.id, category: article.category })
        })
      } catch (e) { /* silent fail for tracking */ }
    }
  }

  async function toggleSave(e: React.MouseEvent) {
    e.stopPropagation()
    if (!user) { window.location.href = '/login'; return }
    if (loading) return
    setLoading(true)

    const token = localStorage.getItem('token')
    try {
      if (saved) {
        await fetch(`${BACKEND}/api/saved`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ article_id: article.id })
        })
        setSaved(false)
        if (onUnsave) onUnsave()
      } else {
        await fetch(`${BACKEND}/api/saved`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ article_id: article.id })
        })
        setSaved(true)
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }
  
  async function handleAskAI(e: React.FormEvent, presetQuestion?: string) {
    if (e) e.preventDefault()
    const q = presetQuestion || question
    if (!q.trim() || asking) return
    
    setAsking(true)
    setAnswer('')
    try {
      const res = await fetch(`${BACKEND}/api/ai/ask/${article.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q })
      })
      const data = await res.json()
      setAnswer(data.answer)
    } catch (e) {
      setAnswer('Sorry, I encountered an error. Please try again.')
    }
    setAsking(false)
  }


  if (!article) return null

  const sentimentColors: Record<string, string> = {
    positive: 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400',
    negative: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
    neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400'
  }

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex flex-col gap-4 p-5 rounded-[2rem] bg-card/60 backdrop-blur-sm border border-border/60 hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-500 cursor-pointer overflow-hidden"
    >
      {/* Image Container */}
      <div className="relative w-full aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
        {article.image_url ? (
          <img 
            src={article.image_url} 
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              const pool = fallbackImages[article.category] || fallbackImages.general;
              const idx = getHashIndex(article.title, pool.length);
              const randomFallback = pool[idx] + '?auto=format&fit=crop&q=80&w=800';
              if (target.src !== randomFallback) {
                target.src = randomFallback;
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl grayscale opacity-20">📰</div>
        )}
        
        {/* Overlay Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <span className="px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] bg-white/90 dark:bg-black/80 backdrop-blur-md rounded-full shadow-lg text-foreground">
            {article.category}
          </span>
        </div>

        <button 
          onClick={toggleSave}
          className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 dark:bg-black/80 backdrop-blur-md text-foreground hover:text-blue-500 transition-all shadow-lg hover:scale-110 active:scale-90"
        >
          {saved ? <BookmarkCheck size={18} fill="currentColor" /> : <Bookmark size={18} />}
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-black uppercase tracking-widest">
          <div className="flex items-center gap-1.5">
            <Globe size={12} className="text-blue-600" />
            <span>{article.source}</span>
          </div>
          <span className="opacity-30">•</span>
          <div className="flex items-center gap-1.5" suppressHydrationWarning>
            <Clock size={12} />
            <span>{new Date(article.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>

        <h3 className="text-[1.15rem] font-bold leading-[1.3] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 font-serif">
          {article.title}
        </h3>

        {/* AI Insight Badge / Summary */}
        {article.summary && (
          <div 
            onClick={(e) => { e.stopPropagation(); setShowSummary(!showSummary); }}
            className={`transition-all duration-500 rounded-2xl ${showSummary ? 'bg-blue-600/5 dark:bg-blue-600/10 p-4 border border-blue-600/10' : 'hover:bg-blue-600/5'}`}
          >
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black text-[9px] uppercase tracking-[0.2em] cursor-pointer">
              <Sparkles size={14} fill="currentColor" />
              <span>AI Summary</span>
            </div>
            {showSummary && (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground animate-in fade-in slide-in-from-top-2 duration-300">
                {article.summary}
              </p>
            )}
          </div>
        )}

        {!showSummary && (
          <p className="text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed">
            {article.description}
          </p>
        )}

        {/* Footer Meta */}
        <div className="flex items-center justify-between mt-2 pt-5 border-t border-border/40">
          <div className="flex items-center gap-3">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsAskModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all text-[9px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95"
            >
              <Brain size={12} fill="currentColor" />
              Ask AI
            </button>
            <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border ${sentimentColors[article.sentiment] || sentimentColors.neutral}`}>
              {article.sentiment}
            </span>
          </div>
          <div className="p-2 rounded-full hover:bg-muted transition-colors">
            <ExternalLink size={14} className="text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Ask AI Modal - Rendered via Portal for Global Feel */}
      {isAskModalOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300"
          onClick={(e) => { e.stopPropagation(); setIsAskModalOpen(false); }}
        >
          <div 
            className="w-full max-w-xl bg-card/90 backdrop-blur-xl border border-white/20 rounded-[2.5rem] shadow-[0_0_50px_rgba(37,99,235,0.2)] flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-8 border-b border-border/50 flex items-center justify-between bg-blue-600/10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/30 text-white">
                  <Brain size={28} fill="currentColor" />
                </div>
                <div>
                  <h3 className="text-2xl font-black font-serif leading-none tracking-tight">Intelligence Hub</h3>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 mt-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    AI-Powered Analysis
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsAskModalOpen(false)}
                className="p-3 hover:bg-muted rounded-full transition-all hover:rotate-90"
              >
                <X size={24} />
              </button>
            </div>

            {/* Chat Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 min-h-[350px] max-h-[60vh] no-scrollbar">
              <div className="flex gap-5">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-600 shrink-0 border border-blue-600/20">
                  <Zap size={24} fill="currentColor" />
                </div>
                <div className="p-6 rounded-[2rem] bg-muted/50 border border-border/50 text-sm leading-relaxed max-w-[85%] font-medium">
                  I've processed the insights for <span className="text-blue-600 font-bold italic">"{article.title}"</span>. How can I help you understand this better?
                </div>
              </div>

              {answer && (
                <div className="flex gap-5 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-xl shadow-blue-600/30">
                    <Sparkles size={24} fill="currentColor" />
                  </div>
                  <div className="p-6 rounded-[2rem] bg-blue-600/5 border border-blue-600/20 text-sm leading-relaxed max-w-[85%] font-medium text-foreground/90">
                    {answer}
                  </div>
                </div>
              )}

              {asking && (
                <div className="flex gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shrink-0 animate-bounce">
                    <Sparkles size={24} />
                  </div>
                  <div className="p-6 rounded-[2rem] bg-muted/30 border border-dashed border-border text-sm italic text-muted-foreground">
                    Synthesizing knowledge...
                  </div>
                </div>
              )}
            </div>

            {/* Input & Presets */}
            <div className="p-8 border-t border-border/50 bg-muted/10">
              <div className="flex flex-wrap gap-2 mb-8">
                {["Explain simply", "Political context?", "Key takeaways", "Economic impact"].map(preset => (
                  <button 
                    key={preset}
                    onClick={() => handleAskAI(undefined as any, preset)}
                    className="px-5 py-2.5 rounded-2xl border border-border bg-card text-[11px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm active:scale-95"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <form onSubmit={handleAskAI} className="relative group">
                <input 
                  type="text" 
                  placeholder="Query AI Intelligence..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full bg-card border border-border rounded-[1.5rem] py-5 pl-8 pr-16 text-sm focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all shadow-inner font-medium"
                />
                <button 
                  type="submit"
                  disabled={asking || !question.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-blue-600 text-white rounded-2xl hover:scale-110 active:scale-90 disabled:opacity-50 transition-all shadow-xl shadow-blue-600/40"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>


  )
}