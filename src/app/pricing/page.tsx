'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import type { User } from '@/lib/auth'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '0',
    period: '',
    description: 'Pour débuter la surveillance de marchés',
    color: 'text-muted',
    borderColor: 'border-white/[0.07]',
    accentBg: '',
    features: [
      { label: '3 alertes de prix actives', ok: true },
      { label: 'Crypto & actions US', ok: true },
      { label: 'Notifications email', ok: true },
      { label: 'Refresh toutes les 5 min', ok: true },
      { label: 'Alertes illimitées', ok: false },
      { label: 'Refresh 1 minute', ok: false },
      { label: 'Notifications SMS', ok: false },
      { label: 'Historique complet', ok: false },
      { label: 'API webhook', ok: false },
    ],
    cta: 'Plan actuel',
    ctaStyle: 'border border-white/[0.07] text-muted cursor-default',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '9',
    period: '/ mois',
    description: 'Pour les traders et investisseurs actifs',
    color: 'text-accent',
    borderColor: 'border-accent/40',
    accentBg: 'bg-accent/5',
    badge: '⭐ Populaire',
    features: [
      { label: 'Alertes illimitées', ok: true },
      { label: 'Crypto & actions US', ok: true },
      { label: 'Notifications email', ok: true },
      { label: 'Refresh toutes les 60 sec', ok: true },
      { label: 'Notifications SMS', ok: true },
      { label: 'Historique 30 jours', ok: true },
      { label: 'Filtres & tri avancés', ok: true },
      { label: 'API webhook', ok: false },
      { label: 'Support prioritaire', ok: false },
    ],
    cta: 'Passer à Pro',
    ctaStyle: 'bg-accent text-bg hover:bg-[#00ffc2] clip-btn',
  },
  {
    id: 'expert',
    name: 'Expert',
    price: '29',
    period: '/ mois',
    description: 'Pour les professionnels et fonds',
    color: 'text-[#a78bfa]',
    borderColor: 'border-[#a78bfa]/30',
    accentBg: 'bg-[#a78bfa]/5',
    features: [
      { label: 'Tout ce qui est dans Pro', ok: true },
      { label: 'Refresh temps réel', ok: true },
      { label: 'Notifications email + SMS', ok: true },
      { label: 'API webhook personnalisable', ok: true },
      { label: 'Alertes multi-conditions', ok: true },
      { label: 'Historique illimité', ok: true },
      { label: 'Accès API privée Signal', ok: true },
      { label: 'Support prioritaire 24h', ok: true },
      { label: 'Onboarding personnalisé', ok: true },
    ],
    cta: 'Passer à Expert',
    ctaStyle: 'bg-[#a78bfa] text-bg hover:bg-[#c4b5fd] clip-btn',
  },
]

export default function PricingPage() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const session = getSession()
    if (session) setUser(session)
  }, [])

  function handleUpgrade(planId: string) {
    // MVP: update plan in localStorage
    if (!user) return
    const users = JSON.parse(localStorage.getItem('signal_users') || '{}')
    const existing = users[user.email]
    if (existing) {
      existing.plan = planId
      localStorage.setItem('signal_users', JSON.stringify(users))
    }
    const updated = { ...user, plan: planId as User['plan'] }
    sessionStorage.setItem('signal_session', JSON.stringify(updated))
    setUser(updated)
    // In production: redirect to Stripe checkout
    alert(`Plan ${planId} activé ! (MVP : en production, vous seriez redirigé vers Stripe)`)
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="fixed inset-0 pointer-events-none opacity-30" style={{
        backgroundImage: 'linear-gradient(rgba(0,229,160,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,160,0.03) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* Header */}
      <header className="border-b border-white/[0.07] bg-surface/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-8 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-accent" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
            <span className="font-display font-extrabold text-lg tracking-[0.15em] uppercase text-accent">Signal</span>
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="font-mono text-[11px] text-muted">Connecté en tant que {user.name}</span>
                <Link href="/dashboard" className="font-mono text-[11px] text-accent hover:text-[#00ffc2] transition-colors">
                  ← Retour au dashboard
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="font-mono text-[12px] text-muted hover:text-text transition-colors">Connexion</Link>
                <Link href="/register" className="font-display font-bold text-[12px] tracking-wider uppercase text-bg bg-accent px-4 py-2 hover:bg-[#00ffc2] transition-all clip-btn">
                  Commencer
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-16 relative z-10">
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="font-mono text-[11px] text-accent tracking-[0.3em] uppercase mb-4">Tarifs</div>
          <h1 className="font-display font-extrabold text-4xl tracking-tight mb-4">
            Choisissez votre plan
          </h1>
          <p className="font-mono text-[14px] text-muted max-w-lg mx-auto leading-relaxed">
            Des alertes de prix en temps réel pour crypto et actions. Commencez gratuitement, passez à Pro quand vous en avez besoin.
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-3 gap-px bg-white/[0.05] mb-12">
          {PLANS.map(plan => {
            const isCurrent = user?.plan === plan.id
            return (
              <div key={plan.id} className={`relative flex flex-col p-8 ${plan.accentBg} border-x first:border-l-0 last:border-r-0 border-white/[0.05]`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-bg font-mono text-[10px] font-bold tracking-widest uppercase px-3 py-1">
                    {plan.badge}
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-surface2 border border-accent/30 text-accent font-mono text-[10px] tracking-widest uppercase px-3 py-1">
                    Plan actuel
                  </div>
                )}

                <div className="mb-6">
                  <div className={`font-mono text-[11px] tracking-[0.2em] uppercase mb-2 ${plan.color}`}>{plan.name}</div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="font-display font-extrabold text-4xl text-text">${plan.price}</span>
                    <span className="font-mono text-[12px] text-muted">{plan.period}</span>
                  </div>
                  <p className="font-mono text-[12px] text-muted leading-relaxed">{plan.description}</p>
                </div>

                <div className={`h-px mb-6 ${plan.id === 'free' ? 'bg-white/[0.05]' : plan.id === 'pro' ? 'bg-accent/20' : 'bg-[#a78bfa]/20'}`} />

                <ul className="flex flex-col gap-2.5 flex-1 mb-8">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <span className={`flex-shrink-0 font-mono text-[12px] ${f.ok ? plan.color : 'text-muted/30'}`}>
                        {f.ok ? '✓' : '—'}
                      </span>
                      <span className={`font-mono text-[12px] ${f.ok ? 'text-text' : 'text-muted/40'}`}>{f.label}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="font-display font-bold text-[12px] tracking-[0.1em] uppercase text-center py-3 border border-accent/30 text-accent">
                    Plan actuel ✓
                  </div>
                ) : user ? (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    className={`font-display font-bold text-[12px] tracking-[0.1em] uppercase py-3 text-center transition-all w-full ${plan.ctaStyle}`}
                  >
                    {plan.cta}
                  </button>
                ) : (
                  <Link href="/register"
                    className={`block font-display font-bold text-[12px] tracking-[0.1em] uppercase py-3 text-center transition-all ${plan.ctaStyle}`}>
                    {plan.id === 'free' ? 'Commencer gratuitement' : plan.cta}
                  </Link>
                )}
              </div>
            )
          })}
        </div>

        {/* FAQ */}
        <div className="border-t border-white/[0.07] pt-12">
          <h2 className="font-display font-bold text-xl tracking-tight text-center mb-8">Questions fréquentes</h2>
          <div className="grid grid-cols-2 gap-6">
            {[
              {
                q: 'Comment fonctionnent les alertes ?',
                a: "Signal vérifie les prix en temps réel et vous envoie une notification email (ou SMS en Pro/Expert) dès qu'un actif atteint votre seuil.",
              },
              {
                q: 'Puis-je changer de plan à tout moment ?',
                a: "Oui, vous pouvez upgrader ou downgrader à tout moment. Les changements prennent effet immédiatement.",
              },
              {
                q: 'Quelles cryptos et actions sont disponibles ?',
                a: "Bitcoin, Ethereum, Solana et 7 autres cryptos majeurs. Pour les actions : AAPL, NVDA, MSFT, GOOGL, TSLA, AMZN, META, SPY, QQQ, GLD.",
              },
              {
                q: 'Est-ce que le plan Free est vraiment gratuit ?',
                a: "Oui, 100% gratuit, sans carte bancaire. Vous bénéficiez de 3 alertes actives simultanément.",
              },
            ].map((faq, i) => (
              <div key={i} className="bg-surface border border-white/[0.07] p-5">
                <div className="font-display font-bold text-[14px] mb-2">{faq.q}</div>
                <div className="font-mono text-[12px] text-muted leading-relaxed">{faq.a}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA bottom */}
        <div className="text-center mt-12">
          <p className="font-mono text-[12px] text-muted mb-4">Des questions ? Contactez-nous.</p>
          <a href="mailto:support@signal.app" className="font-mono text-[11px] text-accent hover:text-[#00ffc2] transition-colors tracking-wider">
            support@signal.app →
          </a>
        </div>
      </main>

      <style jsx global>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }
        .clip-btn{clip-path:polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%)}
      `}</style>
    </div>
  )
}
