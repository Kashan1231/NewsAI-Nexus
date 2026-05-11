'use client'
import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { 
  Search, 
  Cpu, 
  Scale, 
  Bookmark, 
  Globe, 
  Zap, 
  Plus, 
  Sparkles,
  CheckCircle2
} from 'lucide-react'

const features = [
  {
    icon: <Search className="text-blue-500" size={32} />,
    title: 'Semantic Search',
    desc: 'Search by meaning, not just keywords. Our AI understands the context of your queries.'
  },
  {
    icon: <Cpu className="text-indigo-500" size={32} />,
    title: 'AI Analysis',
    desc: 'Every article is processed by Llama 3 to generate summaries and detect sentiment.'
  },
  {
    icon: <Scale className="text-purple-500" size={32} />,
    title: 'Bias Detection',
    desc: 'Identify political and social bias instantly with our transparent AI scoring system.'
  },
  {
    icon: <Bookmark className="text-pink-500" size={32} />,
    title: 'Personal Library',
    desc: 'Save your favorite insights and track your reading history with a personalized dashboard.'
  },
  {
    icon: <Globe className="text-cyan-500" size={32} />,
    title: 'Global Sources',
    desc: 'Aggregated news from top-tier global sources like The Guardian and NewsAPI.'
  },
  {
    icon: <Zap className="text-amber-500" size={32} />,
    title: 'Real-time Sync',
    desc: 'Our intelligence engine syncs fresh news every hour, keeping you ahead of the curve.'
  }
]

const faqs = [
  {
    q: 'How does AI search work?',
    a: 'We use vector embeddings to represent the semantic meaning of articles. When you search, our system finds the closest mathematical matches, ensuring relevance even if the exact keywords don\'t match.'
  },
  {
    q: 'What is Bias Detection?',
    a: 'Our AI model analyzes the language, framing, and tone of an article. It then provides a score (Low, Medium, High) to help you understand the potential perspective of the writer.'
  },
  {
    q: 'Is my reading history private?',
    a: 'Yes. Your reading history is used exclusively to personalize your "For You" feed and is never shared with third parties.'
  }
]

export default function AboutPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden border-b border-border">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest mb-8">
            <Sparkles size={14} fill="currentColor" />
            <span>The Future of Information</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 font-serif leading-none">
            News, <span className="gradient-text">reimagined.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
            NewsAI is an intelligence platform that bridges the gap between raw information and true understanding using state-of-the-art AI.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/" className="px-8 py-4 bg-foreground text-background rounded-full font-bold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-foreground/10 no-underline">
              Experience the Feed
            </Link>
            <Link href="/login" className="px-8 py-4 bg-muted hover:bg-border rounded-full font-bold transition-all no-underline text-foreground">
              Join the Intelligence
            </Link>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <span className="text-blue-600 font-bold text-xs uppercase tracking-widest">Our Mission</span>
              <h2 className="text-4xl md:text-5xl font-bold font-serif leading-tight">
                Deciphering the global narrative with AI.
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                In an era of information overload and deep bias, we provide the tools to filter through the noise. Our platform doesn't just show you the news; it provides the context you need to understand it.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              {[
                'Real-time Sentiment Tracking',
                'Transparent Bias Scoring',
                'Personalized Interest Modeling',
                'Semantic Knowledge Retrieval'
              ].map(item => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="text-blue-500" size={20} />
                  <span className="font-semibold text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {[
              { label: 'Articles Analyzed', value: '50,000+' },
              { label: 'AI Parameters', value: '70B+' },
              { label: 'Global Sources', value: '500+' },
              { label: 'Uptime', value: '99.9%' }
            ].map(stat => (
              <div key={stat.label} className="p-8 rounded-3xl bg-muted/30 border border-border text-center group hover:bg-muted transition-colors">
                <div className="text-3xl font-black mb-2 group-hover:scale-110 transition-transform">{stat.value}</div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold font-serif mb-4">Powerful capabilities.</h2>
            <p className="text-muted-foreground">Built on a foundation of next-generation technologies.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="bg-card border border-border rounded-3xl p-8 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group">
                <div className="mb-6 group-hover:scale-110 transition-transform inline-block p-4 bg-blue-600/5 rounded-2xl">
                  {f.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold font-serif mb-4">Common Questions</h2>
          <p className="text-muted-foreground">Everything you need to know about the NewsAI platform.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-border rounded-2xl overflow-hidden bg-card transition-all">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-muted/50 transition-colors"
              >
                <span className="font-bold text-lg">{faq.q}</span>
                <Plus className={`transition-transform duration-300 ${openFaq === i ? 'rotate-45' : ''}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-96 opacity-100 p-6 pt-0' : 'max-h-0 opacity-0'}`}>
                <p className="text-muted-foreground leading-relaxed">
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="bg-muted/50 border border-border rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-blue-600/5 pointer-events-none" />
          <h2 className="text-4xl md:text-6xl font-black font-serif mb-8 leading-tight">Ready to understand<br />the world?</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-12">
            Join the platform that turns data into knowledge. Get started with your personalized intelligence feed today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/login" className="px-10 py-4 bg-blue-600 text-white rounded-full font-black hover:scale-105 transition-all no-underline shadow-xl shadow-blue-500/20">
              Create Free Account
            </Link>
          </div>
        </div>
      </section>


      <Footer />
    </div>
  )
}