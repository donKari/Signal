'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getSession, logout } from '@/lib/auth'
import type { User } from '@/lib/auth'
import { useAssetsStore } from '@/lib/assets'

const PLAN_COLORS = {
  free: 'text-muted border-muted/30',
  pro: 'text-accent border-accent/30',
  expert: 'text-accent2 border-accent2/30',
}

const PLAN_MAX_ALERTS = { free: 3, pro: Infinity, expert: Infinity }

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [showWelcome, setShowWelcome] = useState(false)
  const { assets, fetchPrices: initAssets } = useAssetsStore()
  const watchedCount = assets.filter(a => a.isWatched).length

  useEffect(() => {
    const session = getSession()
    if (!session) {
      router.replace('/login')
      return
    }
    setUser(session)
    initAssets()
    if (searchParams.get('welcome') === '1') {
      setShowWelcome(true)
      setTimeout(() => setShowWelcome(false), 5000)
    }
  }, [router, searchParams, initAssets])

  function handleLogout() {
    logout()
    router.push('/login')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-6 h-6 border border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const planMax = PLAN_MAX_ALERTS[user.plan]
  const alertsUsed = user.alertsCount || 0

  return (
    <div className="min-h-screen bg-bg">
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,229,160,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,160,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Welcome toast */}
      {showWelcome && (
        <div className="fixed top-6 right-6 z-50 bg-accent text-bg font-display font-bold text-sm tracking-wider uppercase px-5 py-3 flex items-center gap-3 shadow-[0_20px_40px_rgba(0,229,160,0.3)] animate-slide-up">
          <span>🎉</span>
          Bienvenue sur Signal, {user.name.split(' ')[0]} !
        </div>
      )}

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-surface border-r border-white/[0.07] flex flex-col z-20">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-white/[0.07]">
          <div
            className="w-2 h-2 rounded-full bg-accent"
            style={{ animation: 'pulse 2s ease-in-out infinite' }}
          />
          <span className="font-display font-extrabold text-lg tracking-[0.15em] uppercase text-accent">
            Signal
          </span>
        </div>

        {/* User card */}
        <div className="px-4 py-4 border-b border-white/[0.07]">
          <div className="bg-surface2 px-4 py-3">
            <div className="font-display font-bold text-sm text-text truncate">{user.name}</div>
            <div className="font-mono text-[11px] text-muted truncate mt-0.5">{user.email}</div>
            <div className={`font-mono text-[10px] tracking-[0.15em] uppercase mt-2 border px-2 py-0.5 w-fit ${PLAN_COLORS[user.plan]}`}>
              Plan {user.plan}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4">
          <div className="font-mono text-[10px] text-muted tracking-[0.15em] uppercase px-3 mb-2">Navigation</div>
          {[
            { icon: '📊', label: 'Dashboard', href: '/dashboard', active: true },
            { icon: '🔔', label: 'Mes alertes', href: '/dashboard/alerts', active: false, soon: false },
            { icon: '📈', label: 'Mes actifs',  href: '/dashboard/assets', active: false, soon: false },
            { icon: '⚙️', label: 'Paramètres', href: '/dashboard/settings', active: false, soon: false },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 mb-1 font-display font-semibold text-sm tracking-wide transition-all group ${
                item.active
                  ? 'bg-accent/10 text-accent border-l-2 border-accent pl-[10px]'
                  : 'text-muted hover:text-text hover:bg-surface2'
              } ${item.soon ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {item.soon && (
                <span className="ml-auto font-mono text-[9px] tracking-widest text-muted border border-muted/30 px-1.5 py-0.5">
                  BIENTÔT
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Alerts quota */}
        {user.plan === 'free' && (
          <div className="mx-3 mb-3 bg-surface2 border border-white/[0.07] p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono text-[11px] text-muted tracking-wider uppercase">Alertes</span>
              <span className="font-mono text-[11px] text-text">{alertsUsed}/{planMax}</span>
            </div>
            <div className="h-1 bg-white/[0.07]">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${Math.min((alertsUsed / 3) * 100, 100)}%` }}
              />
            </div>
            <Link
              href="/pricing"
              className="mt-3 block text-center font-mono text-[11px] text-accent hover:text-[#00ffc2] tracking-wider transition-colors"
            >
              Passer à Pro →
            </Link>
          </div>
        )}

        {/* Logout */}
        <div className="px-3 pb-4 border-t border-white/[0.07] pt-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 font-display font-semibold text-sm text-muted hover:text-warn transition-colors tracking-wide"
          >
            <span>→</span>
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 relative z-10">
        {/* Topbar */}
        <div className="flex items-center justify-between px-10 py-5 border-b border-white/[0.07] bg-surface/50 backdrop-blur-sm sticky top-0 z-10">
          <div>
            <div className="font-mono text-[11px] text-muted tracking-[0.15em] uppercase mb-0.5">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <h1 className="font-display font-bold text-xl tracking-tight">
              Bonjour, <span className="text-accent">{user.name.split(' ')[0]}</span> 👋
            </h1>
          </div>
          <button className="font-display font-bold text-[13px] tracking-[0.1em] uppercase text-bg bg-accent px-5 py-2.5 hover:bg-[#00ffc2] transition-all clip-btn">
            + Nouvelle alerte
          </button>
        </div>

        {/* Dashboard content */}
        <div className="p-10">
          {/* Stats row */}
          <div className="grid grid-cols-4 gap-px bg-white/[0.07] mb-px">
            {[
              { label: 'Alertes actives', value: alertsUsed, unit: planMax === Infinity ? '∞' : `/ ${planMax}`, color: 'text-accent' },
              { label: 'Actifs surveillés', value: watchedCount, unit: 'actifs', color: 'text-accent2' },
              { label: 'Signaux ce mois', value: 0, unit: 'signaux', color: 'text-text' },
              { label: 'Précision signaux', value: '—', unit: '', color: 'text-muted' },
            ].map((s) => (
              <div key={s.label} className="bg-surface px-7 py-6">
                <div className="font-mono text-[11px] text-muted tracking-[0.12em] uppercase mb-3">{s.label}</div>
                <div className={`font-display font-extrabold text-4xl tracking-tight ${s.color}`}>
                  {s.value}
                  <span className="font-mono text-sm font-normal text-muted ml-1">{s.unit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Empty state */}
          <div className="grid grid-cols-2 gap-px bg-white/[0.07] mt-px">
            {/* My alerts */}
            <div className="bg-surface p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="font-mono text-[11px] text-muted tracking-[0.15em] uppercase mb-1">Mes alertes</div>
                  <h2 className="font-display font-bold text-xl tracking-tight">Aucune alerte</h2>
                </div>
              </div>
              <div className="border border-dashed border-white/[0.07] flex flex-col items-center justify-center py-14 gap-4">
                <div className="text-4xl opacity-30">🔔</div>
                <p className="font-mono text-[13px] text-muted text-center leading-relaxed max-w-xs">
                  Vous n'avez pas encore d'alertes.<br />
                  Créez votre première alerte pour surveiller un actif.
                </p>
                <button className="font-display font-bold text-[12px] tracking-[0.1em] uppercase text-bg bg-accent px-5 py-2.5 hover:bg-[#00ffc2] transition-all mt-2 clip-btn">
                  + Créer une alerte
                </button>
              </div>
            </div>

            {/* Market overview */}
            <div className="bg-surface p-8">
              <div className="font-mono text-[11px] text-muted tracking-[0.15em] uppercase mb-1">Marchés</div>
              <h2 className="font-display font-bold text-xl tracking-tight mb-6">Vue d'ensemble</h2>
              <div className="flex flex-col gap-2">
                {[
                  { sym: 'BTC/USD', name: 'Bitcoin', price: '67 420', change: '+2.1%', up: true },
                  { sym: 'ETH/USD', name: 'Ethereum', price: '3 841', change: '+1.7%', up: true },
                  { sym: 'AAPL', name: 'Apple', price: '189.45', change: '+1.2%', up: true },
                  { sym: 'NVDA', name: 'NVIDIA', price: '875.20', change: '+3.8%', up: true },
                  { sym: 'TSLA', name: 'Tesla', price: '248.60', change: '-0.9%', up: false },
                ].map((m) => (
                  <div key={m.sym} className="flex items-center justify-between py-2.5 border-b border-white/[0.04]">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted/40" />
                      <div>
                        <span className="font-display font-bold text-[13px] tracking-tight">{m.sym}</span>
                        <span className="font-mono text-[11px] text-muted ml-2">{m.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-[13px] text-text">${m.price}</span>
                      <span className={`font-mono text-[12px] w-14 text-right ${m.up ? 'text-accent' : 'text-warn'}`}>
                        {m.change}
                      </span>
                      <button className="font-mono text-[10px] tracking-widest text-muted border border-white/[0.07] px-2 py-1 hover:border-accent hover:text-accent transition-all">
                        + ALERTE
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="font-mono text-[11px] text-muted mt-4 text-right">
                * Prix simulés — Yahoo Finance dans la prochaine version
              </p>
            </div>
          </div>

          {/* Next steps */}
          <div className="bg-surface border-t-2 border-accent mt-px p-8">
            <div className="font-mono text-[11px] text-accent tracking-[0.15em] uppercase mb-4">🚀 Prochaines étapes</div>
            <div className="grid grid-cols-3 gap-6">
              {[
                { num: '01', title: 'Ajoutez un actif', desc: 'Cherchez une action ou une crypto à surveiller.', cta: 'Parcourir les actifs →', done: false },
                { num: '02', title: 'Créez une alerte', desc: 'Définissez vos conditions : prix, RSI, breakout...', cta: 'Créer une alerte →', done: false },
                { num: '03', title: 'Recevez vos signaux', desc: 'Configurez vos canaux d\'alerte préférés.', cta: 'Configurer →', done: false },
              ].map((step) => (
                <div key={step.num} className="flex flex-col gap-3">
                  <div className="font-mono text-[11px] text-muted tracking-widest">{step.num}</div>
                  <h3 className="font-display font-bold text-base uppercase tracking-tight">{step.title}</h3>
                  <p className="font-mono text-[12px] text-muted leading-relaxed">{step.desc}</p>
                  <button className="font-mono text-[12px] text-accent hover:text-[#00ffc2] transition-colors text-left tracking-wide">
                    {step.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
      `}</style>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg flex items-center justify-center">
          <div className="w-6 h-6 border border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}
