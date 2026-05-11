'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  User, 
  Bookmark, 
  History, 
  Settings, 
  LogOut, 
  Moon, 
  Sun,
  Menu,
  X,
  Sparkles,
  TrendingUp,
  Zap
} from 'lucide-react'
import { createPortal } from 'react-dom'

export default function Navbar() {
  const [search, setSearch] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isDark, setIsDark] = useState(false)
  const router = useRouter()

  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'

  useEffect(() => {
    // Theme initialization
    const theme = localStorage.getItem('theme')
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
      setIsDark(true)
    }

    // User initialization
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))

    const handleStorage = () => {
      const u = localStorage.getItem('user')
      setUser(u ? JSON.parse(u) : null)
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  // Scroll lock for mobile menu
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [menuOpen])

  // Autocomplete logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (search.trim().length > 1) {
        try {
          const res = await fetch(`${BACKEND}/api/search/autocomplete?q=${encodeURIComponent(search.trim())}`)
          const data = await res.json()
          setSuggestions(data.suggestions || [])
        } catch (e) {
          console.error('Autocomplete error:', e)
        }
      } else {
        setSuggestions([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  function toggleTheme() {
    const newDark = !isDark
    setIsDark(newDark)
    if (newDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setProfileOpen(false)
    router.push('/')
  }

  async function handleSearch(e?: React.FormEvent, term?: string) {
    if (e) e.preventDefault()
    const finalTerm = term || search.trim()
    if (finalTerm) {
      // Log search for personalization
      const token = localStorage.getItem('token')
      if (token) {
        fetch(`${BACKEND}/api/personalization/track`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ query: finalTerm })
        }).catch(() => null)
      }

      router.push(`/?search=${encodeURIComponent(finalTerm)}`)
      setSearch('')
      setShowSuggestions(false)
    }
  }

  return (
    <nav suppressHydrationWarning className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">

      {/* Left: Brand */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 hover:bg-muted rounded-lg transition-colors md:hidden text-foreground"

          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20">

              <Sparkles size={18} fill="currentColor" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground hidden sm:block">

              NewsAI
            </span>
          </Link>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/about" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors no-underline">

            About
          </Link>
          {['Technology', 'Business', 'Sports', 'Politics'].map(cat => (
            <Link 
              key={cat} 
              href={`/?category=${cat.toLowerCase()}`}
              className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors no-underline"

            >
              {cat}
            </Link>
          ))}
        </div>
      </div>

      {/* Center: Search */}
      <div className="hidden lg:flex items-center flex-1 max-w-md mx-8 relative group">
        <form 
          onSubmit={handleSearch} 
          className="w-full flex items-center"
        >
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-600 transition-colors" size={16} />

            <input
              type="text"
              placeholder="Search news with AI..."
              value={search}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-muted/50 border border-border rounded-full py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:bg-background focus:ring-2 focus:ring-blue-600/20 transition-all outline-none"

            />
          </div>
        </form>

        {/* Suggestions Dropdown */}
        {showSuggestions && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowSuggestions(false)} />
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Query-based Suggestions */}
              {suggestions.length > 0 ? (
                suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSearch(undefined, s)}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-muted flex items-center gap-3 transition-colors border-none bg-transparent cursor-pointer"
                  >
                    <Search size={14} className="text-muted-foreground" />
                    <span className="truncate">{s}</span>
                  </button>
                ))
              ) : (
                /* Trending Searches Fallback */
                <div className="p-4">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                    <TrendingUp size={12} className="text-blue-600" />
                    Trending Searches
                  </p>
                  <div className="flex flex-col gap-1">
                    {['Market Volatility', 'AI Breakthroughs', 'Quantum Computing', 'Global Summit'].map((t, i) => (
                      <button
                        key={i}
                        onClick={() => handleSearch(undefined, t)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-lg transition-colors border-none bg-transparent cursor-pointer flex items-center justify-between group"
                      >
                        <span className="group-hover:text-blue-600 transition-colors">{t}</span>
                        <Zap size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleTheme}
          className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground"
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="h-6 w-[1px] bg-border mx-2" />

        {user ? (
          <div className="relative">
            <button 
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1 pl-3 pr-1 rounded-full hover:bg-muted border border-border transition-all"
            >
              <span className="text-sm font-semibold hidden sm:block">
                {user.fullName?.split(' ')[0]}
              </span>
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <User size={18} />
              </div>
            </button>

            {/* Profile Dropdown */}
            {profileOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setProfileOpen(false)} 
                />
                <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-xl z-50 p-2 py-3">
                  <div className="px-3 pb-3 mb-2 border-b border-border">
                    <p className="text-sm font-bold truncate">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  
                  <Link 
                    href="/profile" 
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors no-underline text-foreground"
                  >
                    <User size={16} /> Profile Dashboard
                  </Link>
                  <Link 
                    href="/saved" 
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors no-underline text-foreground"
                  >
                    <Bookmark size={16} /> Saved Articles
                  </Link>
                  <Link 
                    href="/history" 
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors no-underline text-foreground"
                  >
                    <History size={16} /> Reading History
                  </Link>
                  
                  <div className="h-[1px] bg-border my-2" />
                  
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border-none bg-transparent cursor-pointer"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm font-semibold px-5 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all no-underline shadow-lg shadow-blue-500/25">
              Sign In
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Sidebar Overlay (Portaled to Body) */}
      {typeof document !== 'undefined' && menuOpen && createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9998] animate-in fade-in duration-300" 
            onClick={() => setMenuOpen(false)} 
          />
          
          {/* Sidebar */}
          <div className="fixed top-0 left-0 h-full w-[85%] max-w-xs bg-background border-r border-border z-[9999] shadow-[25px_0_50px_-12px_rgba(0,0,0,0.5)] animate-in slide-in-from-left duration-300 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                  <Sparkles size={16} fill="currentColor" />
                </div>
                <span className="font-bold text-lg tracking-tight">NewsAI</span>
              </div>
              <button 
                onClick={() => setMenuOpen(false)} 
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Search in Sidebar */}
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  type="text"
                  placeholder="Search stories..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-muted/50 border border-border rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-600/20 outline-none transition-all"
                />
              </form>

              {/* Navigation Links */}
              <div className="space-y-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-2">Platform</p>
                <Link 
                  href="/about"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted font-semibold transition-colors no-underline text-foreground"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                    <User size={18} />
                  </div>
                  About NewsAI
                </Link>
              </div>

              {/* Categories */}
              <div className="space-y-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-2">Categories</p>
                {[
                  { name: 'Technology', icon: <Zap size={18} /> },
                  { name: 'Business', icon: <TrendingUp size={18} /> },
                  { name: 'Sports', icon: <Sparkles size={18} /> },
                  { name: 'Politics', icon: <User size={18} /> },
                  { name: 'Science', icon: <Sparkles size={18} fill="currentColor" /> }
                ].map(cat => (
                  <Link 
                    key={cat.name} 
                    href={`/?category=${cat.name.toLowerCase()}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted font-semibold transition-colors no-underline text-foreground"
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                      {cat.icon}
                    </div>
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* User Section at Bottom */}
            {!user && (
              <div className="p-6 border-t border-border mt-auto bg-muted/10">
                <Link 
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-blue-600 text-white font-bold no-underline shadow-xl shadow-blue-600/30 active:scale-95 transition-transform"
                >
                  Sign In to NewsAI
                </Link>
              </div>
            )}
          </div>
        </>,
        document.body
      )}
    </nav>
  )
}