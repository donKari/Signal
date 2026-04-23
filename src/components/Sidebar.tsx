'use client'
import Link from 'next/link'
import type { User } from '@/lib/auth'

interface SidebarProps {
  user: User
  activeNav: 'dashboard' | 'alerts' | 'assets' | 'settings'
  onLogout: () => void
  activeAlertsCount?: number
}

export default function Sidebar({ user, activeNav, onLogout, activeAlertsCount = 0 }: SidebarProps) {
  const navItems = [
    { key: 'dashboard', icon: '⬡', label: 'Dashboard', href: '/dashboard' },
    { key: 'alerts', icon: '◎', label: 'Alertes', href: '/dashboard/alerts', badge: activeAlertsCount || null },
    { key: 'assets', icon: '◈', label: 'Actifs', href: '/dashboard/assets' },
    { key: 'settings', icon: '◌', label: 'Paramètres', href: '/dashboard/settings' },
  ] as const

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-surface border-r border-white/[0.05] flex flex-col z-20">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.05]">
        <div className="relative flex-shrink-0">
          <div className="w-7 h-7 bg-amber-500 flex items-center justify-center" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
            <span className="font-mono font-bold text-black text-[10px]">P</span>
          </div>
          <div className="absolute -right-0.5 -top-0.5 w-1.5 h-1.5 rounded-full bg-up" style={{ animation: 'pulse-dot 2.5s ease-in-out infinite' }} />
        </div>
        <div>
          <div className="font-display font-extrabold text-lg tracking-tight text-text">Pulse</div>
          <div className="font-mono text-[9px] text-muted tracking-widest uppercase">Markets</div>
        </div>
      </div>

      {/* User card */}
      <div className="px-4 py-3 border-b border-white/[0.05]">
        <div className="bg-surface2 px-3 py-2.5 rounded-sm">
          <div className="font-display font-semibold text-[13px] text-text truncate">{user.name}</div>
          <div className="font-mono text-[10px] text-muted truncate mt-0.5">{user.email}</div>
          <div className="flex items-center gap-1.5 mt-2">
            <div className={`w-1.5 h-1.5 rounded-full ${user.plan === 'free' ? 'bg-muted' : 'bg-amber-500'}`} />
            <span className={`font-mono text-[9px] tracking-widest uppercase ${user.plan === 'free' ? 'text-muted' : 'text-amber-400'}`}>
              Plan {user.plan}
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4">
        <div className="font-mono text-[9px] text-muted tracking-[0.2em] uppercase px-2 mb-3">Navigation</div>
        {navItems.map(item => {
          const isActive = activeNav === item.key
          return (
            <Link key={item.key} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 mb-0.5 rounded-sm font-semibold text-sm transition-all ${
                isActive
                  ? 'bg-amber-500/10 text-amber-400 border-l-2 border-amber-500 pl-[10px]'
                  : 'text-muted hover:text-text hover:bg-surface2'
              }`}>
              <span className={`font-mono text-[15px] leading-none ${isActive ? 'text-amber-500' : ''}`}>{item.icon}</span>
              <span className="flex-1 tracking-wide">{item.label}</span>
              {(item as any).badge ? (
                <span className="bg-amber-500 text-black font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {(item as any).badge}
                </span>
              ) : null}
            </Link>
          )
        })}
      </nav>

      {/* Free plan quota */}
      {user.plan === 'free' && (
        <div className="mx-3 mb-3 bg-surface2 border border-white/[0.05] p-3 rounded-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="font-mono text-[9px] text-muted tracking-widest uppercase">Alertes</span>
            <span className="font-mono text-[10px] text-text2">{activeAlertsCount}/3</span>
          </div>
          <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden mb-2">
            <div className="h-full bg-amber-500 transition-all rounded-full" style={{ width: `${Math.min((activeAlertsCount / 3) * 100, 100)}%` }} />
          </div>
          <Link href="/pricing" className="font-mono text-[10px] text-amber-400 hover:text-amber-300 transition-colors tracking-wide block">
            Passer à Pro →
          </Link>
        </div>
      )}

      {/* Logout */}
      <div className="px-3 pb-4 border-t border-white/[0.05] pt-3">
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 font-semibold text-sm text-muted hover:text-down transition-colors tracking-wide rounded-sm hover:bg-down/5">
          <span className="font-mono">→</span>
          <span>Déconnexion</span>
        </button>
      </div>

      <style jsx global>{`
        @keyframes pulse-dot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(0.5); } }
      `}</style>
    </aside>
  )
}
