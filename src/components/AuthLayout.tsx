'use client'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg relative flex flex-col overflow-hidden">
      {/* Ambient glow top-right */}
      <div className="fixed pointer-events-none" style={{
        width: 600, height: 600,
        background: 'radial-gradient(ellipse, rgba(245,158,11,0.04) 0%, transparent 65%)',
        top: -150, right: -100,
      }} />
      {/* Ambient glow bottom-left */}
      <div className="fixed pointer-events-none" style={{
        width: 500, height: 500,
        background: 'radial-gradient(ellipse, rgba(59,130,246,0.04) 0%, transparent 65%)',
        bottom: -100, left: -100,
      }} />

      {/* Dot grid */}
      <div className="fixed inset-0 pointer-events-none opacity-40" style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 20%, transparent 100%)',
      }} />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-10 py-5 border-b border-white/[0.05]">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative">
            <div className="w-7 h-7 bg-amber-500 flex items-center justify-center" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
              <span className="font-mono font-bold text-black text-[10px]">P</span>
            </div>
            <div className="absolute -right-0.5 -top-0.5 w-2 h-2 rounded-full bg-up animate-pulse-dot" />
          </div>
          <span className="font-display font-extrabold text-xl tracking-tight text-text">Pulse</span>
        </Link>
        <div className="flex items-center gap-6">
          <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted">Marchés temps réel</span>
          <Link href="/login" className="font-mono text-[11px] text-text2 hover:text-amber-400 transition-colors tracking-wide">Connexion</Link>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-16">
        {children}
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center py-5 font-mono text-[10px] text-muted tracking-wider border-t border-white/[0.05]">
        © 2025 Pulse Financial Technologies ·{' '}
        <Link href="#" className="hover:text-text2 transition-colors">CGU</Link>
        {' · '}
        <Link href="#" className="hover:text-text2 transition-colors">Confidentialité</Link>
      </div>

      <style jsx global>{`
        @keyframes slide-up { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
        @keyframes pulse-dot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(0.5); } }
        .animate-pulse-dot { animation: pulse-dot 2.5s ease-in-out infinite; }
      `}</style>
    </div>
  )
}
