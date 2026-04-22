'use client'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg relative flex flex-col">
      {/* Grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,229,160,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,160,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%)',
        }}
      />

      {/* Glow */}
      <div
        className="fixed pointer-events-none"
        style={{
          width: 500,
          height: 500,
          background: 'radial-gradient(ellipse, rgba(0,229,160,0.06) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-12 py-5 border-b border-white/[0.07]">
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className="w-2 h-2 rounded-full bg-accent"
            style={{ animation: 'pulse 2s ease-in-out infinite' }}
          />
          <span className="font-display font-extrabold text-lg tracking-[0.15em] uppercase text-accent">
            Signal
          </span>
        </Link>
        <div className="font-mono text-[11px] tracking-[0.12em] uppercase text-muted">
          Marchés en temps réel
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-16">
        {children}
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center py-6 font-mono text-[11px] text-muted tracking-wider border-t border-white/[0.07]">
        © 2025 Signal · Tous droits réservés ·{' '}
        <Link href="#" className="hover:text-text transition-colors">CGU</Link>
        {' · '}
        <Link href="#" className="hover:text-text transition-colors">Confidentialité</Link>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
      `}</style>
    </div>
  )
}
