'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import type { User } from '@/lib/auth'

const PLANS = [
  {
    id: 'free', name: 'Free', price: '0', period: '',
    description: 'Pour débuter la surveillance de marchés',
    color: 'text-text2', accentBg: '', badge: null,
    borderTop: 'border-t-white/10',
    features: [
      { label: '3 alertes de prix actives', ok: true },
      { label: 'Crypto & actions US', ok: true },
      { label: 'Notifications email', ok: true },
      { label: 'Refresh toutes les 5 min', ok: true },
      { label: 'Alertes illimitées', ok: false },
      { label: 'Refresh 60 secondes', ok: false },
      { label: 'Notifications SMS', ok: false },
      { label: 'Historique complet', ok: false },
      { label: 'API webhook', ok: false },
    ],
    cta: 'Commencer gratuitement',
    ctaPrimary: false,
  },
  {
    id: 'pro', name: 'Pro', price: '9', period: '/ mois',
    description: 'Pour les traders et investisseurs actifs',
    color: 'text-amber-400', accentBg: 'bg-amber-500/[0.03]', badge: '⭐ Populaire',
    borderTop: 'border-t-amber-500',
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
    ctaPrimary: true,
  },
  {
    id: 'expert', name: 'Expert', price: '29', period: '/ mois',
    description: 'Pour les professionnels et fonds',
    color: 'text-blue-400', accentBg: 'bg-blue-500/[0.03]', badge: null,
    borderTop: 'border-t-blue-500',
    features: [
      { label: 'Tout ce qui est dans Pro', ok: true },
      { label: 'Refresh temps réel', ok: true },
      { label: 'Notifications email + SMS', ok: true },
      { label: 'API webhook personnalisable', ok: true },
      { label: 'Alertes multi-conditions', ok: true },
      { label: 'Historique illimité', ok: true },
      { label: 'Accès API privée Pulse', ok: true },
      { label: 'Support prioritaire 24h', ok: true },
      { label: 'Onboarding personnalisé', ok: true },
    ],
    cta: 'Passer à Expert',
    ctaPrimary: false,
    ctaAlt: true,
  },
]

export default function PricingPage() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const session = getSession()
    if (session) setUser(session)
  }, [])

  function handleUpgrade(planId: string) {
    if (!user) return
    const users = JSON.parse(localStorage.getItem('signal_users') || '{}')
    const existing = users[user.email]
    if (existing) { existing.plan = planId; localStorage.setItem('signal_users', JSON.stringify(users)) }
    const updated = { ...user, plan: planId as User['plan'] }
    sessionStorage.setItem('signal_session', JSON.stringify(updated))
    setUser(updated)
    alert(`Plan ${planId} activé ! (MVP : en production, redirection vers Stripe)`)
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Ambient */}
      <div className="fixed pointer-events-none" style={{ width: 700, height: 400, background: 'radial-gradient(ellipse, rgba(245,158,11,0.04) 0%, transparent 70%)', top: 0, left: '50%', transform: 'translateX(-50%)' }} />

      {/* Header */}
      <header className="border-b border-white/[0.05] bg-surface/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-8 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-6 h-6 bg-amber-500 flex items-center justify-center" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                <span className="font-mono font-bold text-black text-[9px]">P</span>
              </div>
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-text">Pulse</span>
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="font-mono text-[11px] text-muted">{user.name}</span>
                <Link href="/dashboard" className="font-mono text-[11px] text-amber-400 hover:text-amber-300 transition-colors">← Dashboard</Link>
              </>
            ) : (
              <>
                <Link href="/login" className="font-mono text-[12px] text-muted hover:text-text2 transition-colors">Connexion</Link>
                <Link href="/register" className="bg-amber-500 text-black font-bold text-[12px] tracking-widest uppercase px-4 py-2 hover:bg-amber-400 transition-all rounded-sm">
                  Commencer
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-16 relative z-10">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 border border-amber-500/20 bg-amber-500/5 px-4 py-1.5 rounded-full mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-mono text-[10px] text-amber-400 tracking-[0.2em] uppercase">Tarifs</span>
          </div>
          <h1 className="font-display font-bold text-5xl tracking-tight mb-5">
            Choisissez votre<br />
            <span className="font-serif italic font-normal text-amber-400">plan Pulse</span>
          </h1>
          <p className="font-mono text-[14px] text-muted max-w-lg mx-auto leading-relaxed">
            Alertes de prix en temps réel pour crypto et actions.<br />
            Commencez gratuitement, upgradez quand vous voulez.
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-3 gap-4 mb-14">
          {PLANS.map(plan => {
            const isCurrent = user?.plan === plan.id
            return (
              <div key={plan.id} className={`relative flex flex-col border border-t-2 ${plan.borderTop} border-white/[0.07] ${plan.accentBg} p-7 rounded-sm`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black font-mono text-[9px] font-bold tracking-widest uppercase px-3 py-1 rounded-full whitespace-nowrap">
                    {plan.badge}
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-surface border border-amber-500/30 text-amber-400 font-mono text-[9px] tracking-widest uppercase px-3 py-1 rounded-full whitespace-nowrap">
                    Plan actuel ✓
                  </div>
                )}

                <div className="mb-6">
                  <div className={`font-mono text-[10px] tracking-[0.2em] uppercase mb-3 ${plan.color}`}>{plan.name}</div>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="font-display font-bold text-5xl text-text">{plan.price}€</span>
                    <span className="font-mono text-[12px] text-muted">{plan.period}</span>
                  </div>
                  <p className="font-mono text-[12px] text-muted leading-relaxed">{plan.description}</p>
                </div>

                <div className="h-px bg-white/[0.06] mb-6" />

                <ul className="flex flex-col gap-3 flex-1 mb-7">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <span className={`flex-shrink-0 font-mono text-[11px] w-4 ${f.ok ? plan.color : 'text-muted/25'}`}>
                        {f.ok ? '✓' : '—'}
                      </span>
                      <span className={`font-mono text-[12px] leading-snug ${f.ok ? 'text-text2' : 'text-muted/35'}`}>{f.label}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="font-bold text-[12px] tracking-widest uppercase text-center py-3 border border-amber-500/25 text-amber-400 rounded-sm">
                    Plan actuel ✓
                  </div>
                ) : user ? (
                  <button onClick={() => handleUpgrade(plan.id)}
                    className={`font-bold text-[12px] tracking-widest uppercase py-3 text-center transition-all w-full rounded-sm ${
                      plan.ctaPrimary ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-[0_8px_24px_rgba(245,158,11,0.2)]'
                      : plan.ctaAlt ? 'bg-blue-500 text-white hover:bg-blue-400'
                      : 'border border-white/[0.08] text-text2 hover:border-white/20 hover:text-text'
                    }`}>
                    {plan.cta}
                  </button>
                ) : (
                  <Link href="/register"
                    className={`block font-bold text-[12px] tracking-widest uppercase py-3 text-center transition-all rounded-sm ${
                      plan.ctaPrimary ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-[0_8px_24px_rgba(245,158,11,0.2)]'
                      : plan.ctaAlt ? 'bg-blue-500 text-white hover:bg-blue-400'
                      : 'border border-white/[0.08] text-text2 hover:border-white/20 hover:text-text'
                    }`}>
                    {plan.id === 'free' ? 'Commencer gratuitement' : plan.cta}
                  </Link>
                )}
              </div>
            )
          })}
        </div>

        {/* Comparison note */}
        <div className="text-center mb-14">
          <p className="font-mono text-[11px] text-muted/60">Tous les prix sont en euros HT · Paiement sécurisé via Stripe · Annulation à tout moment</p>
        </div>

        {/* FAQ */}
        <div className="border-t border-white/[0.06] pt-12">
          <h2 className="font-display font-bold text-2xl tracking-tight text-center mb-8">Questions fréquentes</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { q: 'Comment fonctionnent les alertes ?', a: "Pulse vérifie les prix en temps réel et vous envoie une notification email (ou SMS en Pro/Expert) dès qu'un actif atteint votre seuil défini." },
              { q: 'Puis-je changer de plan à tout moment ?', a: "Oui, upgrade ou downgrade immédiatement. La facturation est au prorata en cas de changement en cours de mois." },
              { q: 'Quels actifs sont disponibles ?', a: "Bitcoin, Ethereum, Solana et 7 autres cryptos majeurs. Actions : AAPL, NVDA, MSFT, GOOGL, TSLA, AMZN, META, SPY, QQQ, GLD." },
              { q: 'Le plan Free est-il vraiment gratuit ?', a: "Oui, 100% gratuit, sans carte bancaire requise. Vous bénéficiez de 3 alertes actives en permanence." },
            ].map((faq, i) => (
              <div key={i} className="bg-surface border border-white/[0.06] p-5 rounded-sm hover:border-white/10 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="font-mono text-amber-500/60 mt-0.5 text-sm flex-shrink-0">Q.</span>
                  <div>
                    <div className="font-display font-semibold text-[14px] mb-2">{faq.q}</div>
                    <div className="font-mono text-[12px] text-muted leading-relaxed">{faq.a}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-14 py-10 border-t border-white/[0.06]">
          <p className="font-mono text-[12px] text-muted mb-2">Une question ? Notre équipe répond en moins de 24h.</p>
          <a href="mailto:support@pulse.finance" className="font-mono text-[12px] text-amber-400 hover:text-amber-300 transition-colors">
            support@pulse.finance →
          </a>
        </div>
      </main>
    </div>
  )
}
