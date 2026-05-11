'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { setToken, setUser, apiPost } from '@/lib/api'
import { Sparkles, Mail, Lock, User, ArrowRight, Eye, EyeOff, ShieldCheck, Zap } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  function validate() {
    if (isSignup && !fullName.trim()) { setError('Full name is required'); return false }
    if (!email.trim()) { setError('Email is required'); return false }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email'); return false }
    if (!password) { setError('Password is required'); return false }
    if (isSignup && password.length < 8) { setError('Password must be at least 8 characters'); return false }
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!validate()) return
    setLoading(true)

    try {
      if (isSignup) {
        const data = await apiPost('/api/auth/signup', {
          email: email.trim().toLowerCase(),
          password,
          fullName: fullName.trim()
        })
        if (!data.success) throw new Error(data.error)
        
        const loginData = await apiPost('/api/auth/login', {
          email: email.trim().toLowerCase(),
          password
        })
        if (!loginData.success) throw new Error(loginData.error)
        
        setToken(loginData.token)
        setUser(loginData.user)
        router.push('/')
      } else {
        const data = await apiPost('/api/auth/login', {
          email: email.trim().toLowerCase(),
          password
        })
        if (!data.success) throw new Error(data.error)
        
        setToken(data.token)
        setUser(data.user)
        router.push('/')
      }
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row overflow-hidden">
      {/* Left side - Visuals */}
      <div className="hidden md:flex flex-1 relative bg-slate-950 items-center justify-center p-12 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#2563eb11,transparent)] opacity-50" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full" />
        
        <div className="relative z-10 max-w-md">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-8 shadow-2xl shadow-blue-500/20">
            <Sparkles size={32} fill="currentColor" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-6 font-serif leading-tight">
            The future of news intelligence is here.
          </h2>
          <div className="space-y-6">
            {[
              { icon: <ShieldCheck className="text-blue-500" />, text: 'Bias-free AI analysis' },
              { icon: <Zap className="text-amber-500" />, text: 'Real-time global updates' },
              { icon: <Sparkles className="text-indigo-500" />, text: 'Personalized intelligence feed' }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 text-slate-400 font-medium">
                <div className="p-2 bg-white/5 rounded-lg">{item.icon}</div>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="absolute bottom-8 left-12 text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">
          NewsAI Intelligence Systems © 2026
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative">
        <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="text-center md:text-left">
            <Link href="/" className="inline-flex md:hidden items-center gap-2 mb-8 group">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold transition-transform group-hover:scale-110">
                <Sparkles size={18} fill="currentColor" />
              </div>
              <span className="text-xl font-bold tracking-tight">NewsAI</span>
            </Link>
            <h1 className="text-3xl font-black tracking-tight mb-2 font-serif">
              {isSignup ? 'Begin your journey' : 'Welcome back'}
            </h1>
            <p className="text-muted-foreground">
              {isSignup ? 'Create an account to access personalized insights.' : 'Enter your credentials to access your intelligence dashboard.'}
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium animate-in shake-1">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-muted/50 border border-border rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-muted/50 border border-border rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Password</label>
                {!isSignup && (
                  <Link href="/forgot-password" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
                    Forgot?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-muted/50 border border-border rounded-xl py-3 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Sign In'}

              {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button 
                onClick={() => { setIsSignup(!isSignup); setError('') }}
                className="text-blue-600 font-bold hover:underline ml-1"
              >
                {isSignup ? 'Sign in' : 'Create account'}
              </button>
            </p>
          </div>
        </div>
        
        {/* Decorative elements for mobile */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[60px] rounded-full md:hidden" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 blur-[60px] rounded-full md:hidden" />
      </div>
    </div>
  )
}