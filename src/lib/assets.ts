'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSession, logout } from '@/lib/auth'
import type { User } from '@/lib/auth'
import {
  useAssetsStore,
  formatPrice,
  formatChange,
  formatVolume,
  type Asset,
  type AssetCategory,
} from '@/lib/assets'

// ─── Sidebar (shared layout — extract to component later) ────────
function Sidebar({ user, onLogout }: { user: User; onLogout: () => void }) {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-surface border-r border-white/[0.07] flex flex-col z-20">
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-white/[0.07]">
        <div className="w-2 h-2 rounded-full bg-accent" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
        <span className="font-display font-extrabold text-lg tracking-[0.15em] uppercase text-accent">Signal</span>
      </div>

      <div className="px-4 py-4 border-b border-white/[0.07]">
        <div className="bg-surface2 px-4 py-3">
          <div className="font-display font-bold text-sm text-text truncate">{user.name}</div>
          <div className="font-mono text-[11px] text-muted truncate mt-0.5">{user.email}</div>
          <div className={`font-mono text-[10px] tracking-[0.15em] uppercase mt-2 border px-2 py-0.5 w-fit ${
            user.plan === 'free' ? 'text-muted border-muted/30' : user.plan === 'pro' ? 'text-accent border-accent/30' : 'text-accent2 border-accent2/30'
          }`}>Plan {user.plan}</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4">
        <div className="font-mono text-[10px] text-muted tracking-[0.15em] uppercase px-3 mb-2">Navigation</div>
        {[
          { icon: '📊', label: 'Dashboard',   href: '/dashboard' },
          { icon: '🔔', label: 'Mes alertes', href: '/dashboard/alerts' },
          { icon: '📈', label: 'Mes actifs',  href: '/dashboard/assets', active: true },
          { icon: '⚙️', label: 'Paramètres',  href: '/dashboard/settings' },
        ].map(item => (
          <Link key={item.label} href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 mb-1 font-display font-semibold text-sm tracking-wide transition-all ${
              item.active
                ? 'bg-accent/10 text-accent border-l-2 border-accent pl-[10px]'
                : 'text-muted hover:text-text hover:bg-surface2'
            }`}>
            <span>{item.icon}</span><span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="px-3 pb-4 border-t border-white/[0.07] pt-3">
        <button onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 font-display font-semibold text-sm text-muted hover:text-warn transition-colors tracking-wide">
          <span>→</span><span>Déconnexion</span>
        </button>
      </div>
    </aside>
  )
}

// ─── Mini sparkline (pure CSS bars) ─────────────────────────────
function Sparkline({ change }: { change: number | null }) {
  if (change === null) return <div className="w-16 h-8" />
  const up = change >= 0
  // Generate 8 fake bars seeded by the change value
  const bars = Array.from({ length: 8 }, (_, i) => {
    const h = 20 + Math.abs(Math.sin(i * 2.3 + change * 0.4)) * 60
    return h
  })
  return (
    <div className="flex items-end gap-0.5 w-16 h-8">
      {bars.map((h, i) => (
        <div
          key={i}
          className={`flex-1 rounded-sm transition-all ${up ? 'bg-accent/60' : 'bg-warn/60'}`}
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  )
}

// ─── Asset row ───────────────────────────────────────────────────
function AssetRow({
  asset,
  rank,
  onToggleWatch,
  onSelect,
}: {
  asset: Asset
  rank: number
  onToggleWatch: (id: string) => void
  onSelect: (asset: Asset) => void
}) {
  const up = (asset.change24h ?? 0) >= 0
  return (
    <div
      className="group grid items-center border-b border-white/[0.04] hover:bg-surface2/50 transition-all cursor-pointer"
      style={{ gridTemplateColumns: '2rem 2.5rem 1fr 7rem 7rem 5rem 5rem 2.5rem' }}
      onClick={() => onSelect(asset)}
    >
      {/* Rank */}
      <div className="px-4 py-4 font-mono text-[11px] text-muted/40">{rank}</div>

      {/* Icon */}
      <div className="py-4">
        {asset.image ? (
          <img src={asset.image} alt={asset.symbol} className="w-7 h-7 rounded-full" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-surface2 border border-white/[0.07] flex items-center justify-center font-mono text-[9px] text-muted">
            {asset.symbol.slice(0, 2)}
          </div>
        )}
      </div>

      {/* Name */}
      <div className="py-4 pr-4">
        <div className="font-display font-bold text-sm tracking-tight text-text group-hover:text-accent transition-colors">
          {asset.symbol}
        </div>
        <div className="font-mono text-[11px] text-muted mt-0.5">{asset.name}</div>
      </div>

      {/* Price */}
      <div className="py-4 font-mono text-sm text-text text-right pr-4">
        {asset.price !== null ? (
          formatPrice(asset.price, asset.symbol)
        ) : (
          <span className="inline-block w-16 h-3 bg-surface2 animate-pulse rounded" />
        )}
      </div>

      {/* 24h change */}
      <div className={`py-4 font-mono text-sm text-right pr-4 ${up ? 'text-accent' : 'text-warn'}`}>
        {asset.change24h !== null ? (
          <span className="flex items-center justify-end gap-1">
            <span className="text-[10px]">{up ? '▲' : '▼'}</span>
            {formatChange(asset.change24h)}
          </span>
        ) : (
          <span className="inline-block w-12 h-3 bg-surface2 animate-pulse rounded" />
        )}
      </div>

      {/* Sparkline */}
      <div className="py-4 flex justify-center">
        <Sparkline change={asset.change24h} />
      </div>

      {/* Market cap */}
      <div className="py-4 font-mono text-[12px] text-muted text-right pr-4">
        {formatVolume(asset.marketCap)}
      </div>

      {/* Watch button */}
      <div className="py-4 px-3 flex justify-center" onClick={e => { e.stopPropagation(); onToggleWatch(asset.id) }}>
        <button
          className={`w-7 h-7 border flex items-center justify-center text-[13px] transition-all hover:scale-110 ${
            asset.isWatched
              ? 'border-accent/40 text-accent bg-accent/10'
              : 'border-white/[0.07] text-muted hover:border-accent/40 hover:text-accent'
          }`}
          title={asset.isWatched ? 'Retirer de la liste' : 'Surveiller'}
        >
          {asset.isWatched ? '★' : '☆'}
        </button>
      </div>
    </div>
  )
}

// ─── Asset detail panel ──────────────────────────────────────────
function AssetDetail({ asset, onClose, onToggleWatch }: {
  asset: Asset
  onClose: () => void
  onToggleWatch: (id: string) => void
}) {
  const up = (asset.change24h ?? 0) >= 0
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm" />
      <div
        className="relative bg-surface border border-white/[0.07] w-full max-w-lg animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.07]">
          <div className="flex items-center gap-3">
            {asset.image ? (
              <img src={asset.image} alt={asset.symbol} className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-surface2 border border-white/[0.07] flex items-center justify-center font-mono text-[11px] text-muted">
                {asset.symbol.slice(0, 2)}
              </div>
            )}
            <div>
              <div className="font-display font-extrabold text-xl tracking-tight">{asset.symbol}</div>
              <div className="font-mono text-[12px] text-muted">{asset.name}</div>
            </div>
          </div>
          <button onClick={onClose} className="font-mono text-[18px] text-muted hover:text-text transition-colors px-2">×</button>
        </div>

        {/* Price block */}
        <div className="px-6 py-6 border-b border-white/[0.07]">
          <div className="font-display font-extrabold text-4xl tracking-tight">
            {formatPrice(asset.price, asset.symbol)}
          </div>
          <div className={`flex items-center gap-2 mt-2 font-mono text-sm ${up ? 'text-accent' : 'text-warn'}`}>
            <span>{up ? '▲' : '▼'}</span>
            <span>{formatChange(asset.change24h)} (24h)</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-px bg-white/[0.07] mx-6 my-5">
          {[
            { label: 'Plus haut 24h', value: formatPrice(asset.high24h, asset.symbol) },
            { label: 'Plus bas 24h',  value: formatPrice(asset.low24h,  asset.symbol) },
            { label: 'Volume 24h',    value: formatVolume(asset.volume24h) },
            { label: 'Capitalisation',value: formatVolume(asset.marketCap) },
          ].map(s => (
            <div key={s.label} className="bg-surface2 px-4 py-3">
              <div className="font-mono text-[10px] text-muted tracking-[0.12em] uppercase mb-1">{s.label}</div>
              <div className="font-mono text-sm text-text">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Type badge */}
        <div className="px-6 pb-2">
          <span className="font-mono text-[10px] tracking-widest uppercase border px-2 py-1 text-muted border-muted/30">
            {asset.type === 'crypto' ? '⬡ Crypto' : '◈ ' + (asset.category === 'indices' ? 'Indice' : asset.category === 'commodities' ? 'Commodité' : 'Action')}
          </span>
          {asset.type === 'stock' && (
            <span className="ml-2 font-mono text-[10px] tracking-widest uppercase border px-2 py-1 text-muted/50 border-muted/20">
              ★ Prix simulé
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 py-5 border-t border-white/[0.07]">
          <button
            onClick={() => onToggleWatch(asset.id)}
            className={`flex-1 py-3 font-display font-bold text-[12px] tracking-[0.1em] uppercase transition-all clip-btn ${
              asset.isWatched
                ? 'bg-accent/10 text-accent border border-accent/30 hover:bg-warn/10 hover:text-warn hover:border-warn/30'
                : 'bg-accent text-bg hover:bg-[#00ffc2]'
            }`}
          >
            {asset.isWatched ? '★ Surveillé — Retirer' : '☆ Surveiller cet actif'}
          </button>
          <Link
            href="/dashboard/alerts"
            className="flex-1 py-3 font-display font-bold text-[12px] tracking-[0.1em] uppercase text-center border border-white/[0.07] text-muted hover:border-accent hover:text-accent transition-all clip-btn"
          >
            🔔 Créer une alerte
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────
const CATEGORIES: { id: 'all' | 'watched' | AssetCategory; label: string; icon: string }[] = [
  { id: 'all',         label: 'Tous',        icon: '◈' },
  { id: 'watched',     label: 'Suivis',      icon: '★' },
  { id: 'crypto',      label: 'Crypto',      icon: '⬡' },
  { id: 'tech',        label: 'Tech',        icon: '◻' },
  { id: 'indices',     label: 'Indices',     icon: '▲' },
  { id: 'commodities', label: 'Matières',    icon: '◇' },
]

export default function AssetsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const { assets, isLoading, lastFetch, error, searchQuery, activeCategory,
          init, fetchPrices, toggleWatch, setSearch, setCategory, getFiltered } = useAssetsStore()

  useEffect(() => {
    const session = getSession()
    if (!session) { router.replace('/login'); return }
    setUser(session)
    init()
    // Auto-refresh every 60s
    refreshTimer.current = setInterval(() => fetchPrices(), 60_000)
    return () => { if (refreshTimer.current) clearInterval(refreshTimer.current) }
  }, [router, init, fetchPrices])

  function handleLogout() { logout(); router.push('/login') }

  // Keep detail panel in sync with store updates
  useEffect(() => {
    if (selectedAsset) {
      const updated = assets.find(a => a.id === selectedAsset.id)
      if (updated) setSelectedAsset(updated)
    }
  }, [assets])

  if (!user) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-6 h-6 border border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const filtered = getFiltered()
  const watchedCount = assets.filter(a => a.isWatched).length

  return (
    <div className="min-h-screen bg-bg">
      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none opacity-30" style={{
        backgroundImage: 'linear-gradient(rgba(0,229,160,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,160,0.03) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      <Sidebar user={user} onLogout={handleLogout} />

      <main className="ml-64 relative z-10">
        {/* Topbar */}
        <div className="flex items-center justify-between px-10 py-5 border-b border-white/[0.07] bg-surface/50 backdrop-blur-sm sticky top-0 z-10">
          <div>
            <div className="font-mono text-[11px] text-muted tracking-[0.15em] uppercase mb-0.5">Marchés</div>
            <h1 className="font-display font-bold text-xl tracking-tight flex items-center gap-3">
              Actifs surveillés
              {watchedCount > 0 && (
                <span className="font-mono text-[11px] text-accent border border-accent/30 px-2 py-0.5">
                  {watchedCount} suivi{watchedCount > 1 ? 's' : ''}
                </span>
              )}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Last update */}
            {lastFetch && (
              <div className="font-mono text-[11px] text-muted">
                MAJ {new Date(lastFetch).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
            <button
              onClick={() => fetchPrices()}
              disabled={isLoading}
              className={`font-mono text-[11px] tracking-wider uppercase border px-3 py-2 transition-all ${
                isLoading ? 'border-white/[0.07] text-muted/40 cursor-not-allowed' : 'border-white/[0.07] text-muted hover:border-accent hover:text-accent'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border border-muted border-t-transparent rounded-full animate-spin inline-block" />
                  Sync...
                </span>
              ) : '↻ Actualiser'}
            </button>
          </div>
        </div>

        <div className="p-10">
          {/* Error banner */}
          {error && (
            <div className="mb-6 flex items-center gap-3 bg-warn/5 border border-warn/20 px-4 py-3">
              <span className="text-warn">⚠</span>
              <span className="font-mono text-[12px] text-warn/80">{error}</span>
            </div>
          )}

          {/* Search + filter bar */}
          <div className="flex items-center gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[13px] text-muted">⌕</span>
              <input
                type="text"
                placeholder="Rechercher un actif..."
                value={searchQuery}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-surface border border-white/[0.07] text-text font-mono text-sm pl-8 pr-4 py-2.5 placeholder-muted focus:outline-none focus:border-accent transition-colors"
              />
              {searchQuery && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text font-mono text-sm">×</button>
              )}
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 font-mono text-[11px] tracking-wider uppercase border transition-all ${
                    activeCategory === cat.id
                      ? 'border-accent text-accent bg-accent/10'
                      : 'border-white/[0.07] text-muted hover:border-accent/40 hover:text-text'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  {cat.id === 'watched' && watchedCount > 0 && (
                    <span className="ml-1 bg-accent text-bg font-bold text-[9px] px-1 py-0.5 rounded-sm">{watchedCount}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-surface border border-white/[0.07]">
            {/* Table header */}
            <div
              className="grid border-b border-white/[0.07] bg-surface2/50"
              style={{ gridTemplateColumns: '2rem 2.5rem 1fr 7rem 7rem 5rem 5rem 2.5rem' }}
            >
              {['#', '', 'Actif', 'Prix', 'Var. 24h', 'Tendance', 'Cap.', ''].map((h, i) => (
                <div key={i} className={`px-4 py-3 font-mono text-[10px] text-muted tracking-[0.12em] uppercase ${i >= 3 && i <= 6 ? 'text-right' : ''}`}>
                  {h}
                </div>
              ))}
            </div>

            {/* Rows */}
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="text-4xl opacity-20">
                  {activeCategory === 'watched' ? '★' : '◈'}
                </div>
                <p className="font-mono text-[13px] text-muted text-center">
                  {activeCategory === 'watched'
                    ? "Vous ne surveillez aucun actif pour l'instant.\nCliquez sur ☆ pour en ajouter."
                    : 'Aucun résultat pour cette recherche.'}
                </p>
                {activeCategory === 'watched' && (
                  <button
                    onClick={() => setCategory('all')}
                    className="font-mono text-[11px] text-accent hover:text-[#00ffc2] tracking-wider transition-colors"
                  >
                    Voir tous les actifs →
                  </button>
                )}
              </div>
            ) : (
              filtered.map((asset, i) => (
                <AssetRow
                  key={asset.id}
                  asset={asset}
                  rank={i + 1}
                  onToggleWatch={toggleWatch}
                  onSelect={setSelectedAsset}
                />
              ))
            )}
          </div>

          {/* Footer note */}
          <div className="flex items-center justify-between mt-4">
            <p className="font-mono text-[11px] text-muted">
              {filtered.length} actif{filtered.length > 1 ? 's' : ''} · Crypto via CoinGecko · Actions simulées
            </p>
            <p className="font-mono text-[11px] text-muted/50">
              Actualisation automatique toutes les 60s
            </p>
          </div>
        </div>
      </main>

      {/* Detail panel */}
      {selectedAsset && (
        <AssetDetail
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onToggleWatch={(id) => { toggleWatch(id) }}
        />
      )}

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.25s ease-out; }
      `}</style>
    </div>
  )
}
