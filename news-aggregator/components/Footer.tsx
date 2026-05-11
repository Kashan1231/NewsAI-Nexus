'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, Mail, Send } from 'lucide-react'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setMsg('')
    try {
      const res = await fetch(`${BACKEND}/api/auth/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (data.success) {
        setMsg(data.message || 'Subscribed successfully!')
        setEmail('')
        setTimeout(() => setMsg(''), 6000)
      } else {
        setMsg(data.error || 'Something went wrong')
      }
    } catch {
      setMsg('Something went wrong — please try again.')
    }
    setLoading(false)
  }

  return (
    <footer suppressHydrationWarning className="bg-slate-950 text-slate-400 mt-12">
      {/* Newsletter Section */}
      <div className="max-w-7xl mx-auto px-6 py-16 border-b border-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-2 text-blue-500 font-bold mb-4 uppercase tracking-widest text-xs">
              <Sparkles size={14} fill="currentColor" />
              <span>Stay Ahead</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-serif">
              Insights directly to your inbox.
            </h2>
            <p className="text-slate-500 max-w-md leading-relaxed">
              Join 10,000+ readers getting daily AI-analyzed news intelligence without the noise.
            </p>
          </div>

          <div className="relative">
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="email"
                  placeholder="Enter your professional email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? '...' : <Send size={18} />}
                <span className="hidden sm:inline">Subscribe</span>
              </button>
            </form>
            {msg && (
              <div className={`absolute -bottom-10 left-0 right-0 flex items-center gap-2 text-sm font-medium px-1 animate-in fade-in slide-in-from-top-1 duration-300 ${
                msg.toLowerCase().includes('already') ? 'text-amber-400' :
                msg.toLowerCase().includes('welcome') || msg.toLowerCase().includes('success') ? 'text-green-400' : 'text-red-400'
              }`}>
                <span>{msg.toLowerCase().includes('already') ? '📬' : msg.toLowerCase().includes('welcome') || msg.toLowerCase().includes('success') ? '✅' : '⚠️'}</span>
                <span>{msg}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        <div className="space-y-6">
          <Link href="/" className="flex items-center gap-2 no-underline group">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold transition-transform group-hover:scale-110">
              <Sparkles size={18} fill="currentColor" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              NewsAI
            </span>
          </Link>
          <p className="text-sm leading-relaxed text-slate-500">
            Pioneering the future of news intelligence. We use state-of-the-art AI to detect bias, analyze sentiment, and personalize your information diet.
          </p>
          <div className="flex gap-4 text-xs font-bold uppercase tracking-widest">
            <Link href="#" className="hover:text-blue-400 transition-all no-underline text-inherit">Twitter</Link>
            <Link href="#" className="hover:text-blue-400 transition-all no-underline text-inherit">LinkedIn</Link>
            <Link href="#" className="hover:text-blue-400 transition-all no-underline text-inherit">GitHub</Link>
          </div>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Intelligence</h4>
          <ul className="space-y-4 text-sm">
            {['Technology', 'Business', 'Politics', 'Science', 'Health'].map(item => (
              <li key={item}>
                <Link href={`/?category=${item.toLowerCase()}`} className="hover:text-blue-400 transition-colors no-underline text-inherit">
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Platform</h4>
          <ul className="space-y-4 text-sm">
            {[
              { label: 'Personalized Feed', href: '/?category=for-you' },
              { label: 'Reading History', href: '/history' },
              { label: 'Saved Insights', href: '/saved' },
              { label: 'User Dashboard', href: '/profile' },
            ].map(item => (
              <li key={item.label}>
                <Link href={item.href} className="hover:text-blue-400 transition-colors no-underline text-inherit">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Resources</h4>
          <ul className="space-y-4 text-sm">
            {['AI Methodology', 'Bias Detection', 'Sentiment API', 'Privacy Policy', 'Terms of Service'].map(item => (
              <li key={item}>
                <Link href="#" className="hover:text-blue-400 transition-colors no-underline text-inherit">
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-6 py-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium uppercase tracking-widest text-slate-600">
        <p>© 2026 NewsAI Intelligence Systems. All rights reserved.</p>
        <div className="flex gap-8">
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Systems Operational</span>
          <span>Powered by Groq & Llama 3</span>
        </div>
      </div>
    </footer>
  )
}