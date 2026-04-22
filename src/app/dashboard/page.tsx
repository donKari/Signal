'use client'
import { useEffect, useState, Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, CartesianGrid,
} from 'recharts'
import { getSession, logout } from '@/lib/auth'
import type { User } from '@/lib/auth'
import { useAssetsStore, formatPrice, formatChange, formatVolume, type Asset } from '@/lib/assets'
import { useAlertsStore } from '@/lib/alerts'

// ─── Simulated OHLC chart data seeded from current price ─────────
function generateChartData(asset: Asset, points = 48) {
  if (!asset.price) return []
  const price = asset.price
  const change = asset.change24h ?? 0
  const startPrice = price / (1 + change / 100)

  const data = []
  let current = startPrice
  const now = Date.now()
  const interval = (24 * 60 * 60 * 1000) / points // 30min intervals

  for (let i = 0; i <= points; i++) {
    const t = now - (points - i) * interval
    const noise = (Math.random() - 0.48) * (price * 0.012)
    const trend = ((price - startPrice) / points) * i
    current = startPrice + trend + noise
    current = Math.max(current, price * 0.7)
    data.push({
      time: new Date(t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      price: Math.round(current * 100) / 100,
      volume: Math.round(asset.volume24h ? (asset.volume24h / points) * (0.5 + Math.random()) : 0),
    })
  }
  return data
}

// ─── Custom tooltip ───────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface2 border border-white/[0.1] px-3 py-2">
      <div className="font-mono text-[10px] text-muted mb-1">{label}</div>
      <div className="font-mono text-sm text-text font-bold">{formatPrice(payload[0]?.value)}</div>
    </div>
  )
}

// ─── Stat chip ────────────────────────────────────────────────────
function StatChip({ label, value, sub, color = 'text-text' }: {
  label: string; value: string; sub?: string; color?: string
}) {
  return (
    <div className="bg-surface2 border border-white/[0.05] px-4 py-3 flex-1 min-w-0">
      <div className="font-mono text-[9px] text-muted tracking-[0.15em] uppercase mb-1.5">{label}</div>
      <div className={`font-mono text-sm font-bold truncate ${color}`}>{value}</div>
      {sub && <div className="font-mono text-[10px] text-muted mt-0.5">{sub}</div>}
    </div>
  )
}

// ─── Asset chart panel ────────────────────────────────────────────
function AssetChart({ asset }: { asset: Asset }) {
  const up = (asset.change24h ?? 0) >= 0
  const color = up ? '#00e5a0' : '#ff6b35'
  const chartData = useMemo(() => generateChartData(asset), [asset.id, asset.price])

  const high = asset.high24h ?? Math.max(...chartData.map(d => d.price))
  const low = asset.low24h ?? Math.min(...chartData.map(d => d.price))

  // Fake fundamental indicators (stocks only; crypto shows market data)
  const isStock = asset.type === 'stock'
  const fakePER = isStock ? (15 + Math.abs(asset.symbol.charCodeAt(0) % 20)).toFixed(1) : null
  const fakeBeta = isStock ? (0.7 + Math.abs(asset.symbol.charCodeAt(1) % 13) / 10).toFixed(2) : null
  const fakeDiv = isStock && ['AAPL', 'MSFT', 'AMZN'].includes(asset.symbol)
    ? (0.4 + Math.random() * 1.2).toFixed(2) : null

  return (
    <div className="flex flex-col gap-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          {asset.image
            ? <img src={asset.image} alt={asset.symbol} className="w-9 h-9 rounded-full" />
            : <div className="w-9 h-9 rounded-full bg-surface2 border border-white/[0.07] flex items-center justify-center font-mono text-[10px] text-muted">{asset.symbol.slice(0, 2)}</div>
          }
          <div>
            <div className="font-display font-extrabold text-2xl tracking-tight">{asset.symbol}</div>
            <div className="font-mono text-[11px] text-muted">{asset.name}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono font-bold text-2xl text-text">{formatPrice(asset.price)}</div>
          <div className={`font-mono text-sm flex items-center justify-end gap-1 mt-0.5 ${up ? 'text-accent' : 'text-warn'}`}>
            <span>{up ? '▲' : '▼'}</span>
            <span>{formatChange(asset.change24h)} (24h)</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-44 w-full -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${asset.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis dataKey="time" tick={{ fontFamily: 'IBM Plex Mono', fontSize: 9, fill: '#5a6a7a' }} tickLine={false} axisLine={false} interval={Math.floor(chartData.length / 4)} />
            <YAxis
              tick={{ fontFamily: 'IBM Plex Mono', fontSize: 9, fill: '#5a6a7a' }}
              tickLine={false} axisLine={false} width={60}
              tickFormatter={v => formatPrice(v).replace('$', '$').slice(0, 8)}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<ChartTooltip />} />
            <ReferenceLine y={asset.price ?? 0} stroke={color} strokeDasharray="4 4" strokeOpacity={0.3} />
            <Area
              type="monotone" dataKey="price"
              stroke={color} strokeWidth={1.5}
              fill={`url(#grad-${asset.id})`}
              dot={false} activeDot={{ r: 3, fill: color, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Indicators */}
      <div className="flex gap-2 mt-3 flex-wrap">
        <StatChip label="Haut 24h" value={formatPrice(high)} color="text-accent" />
        <StatChip label="Bas 24h" value={formatPrice(low)} color="text-warn" />
        <StatChip label="Volume" value={formatVolume(asset.volume24h)} />
        <StatChip label="Cap." value={formatVolume(asset.marketCap)} />
        {fakePER && <StatChip label="P/E Ratio" value={fakePER} sub="estimé" />}
        {fakeBeta && <StatChip label="Beta" value={fakeBeta} sub="vs S&P 500" />}
        {fakeDiv && <StatChip label="Dividende" value={`${fakeDiv}%`} sub="rendement" color="text-accent" />}
      </div>
    </div>
  )
}

// ─── Mini market row ──────────────────────────────────────────────
function MarketRow({ asset, onSelect, isSelected }: { asset: Asset; onSelect: () => void; isSelected: boolean }) {
  const up = (asset.change24h ?? 0) >= 0
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center justify-between py-2.5 px-3 border-b border-white/[0.04] transition-all text-left ${
        isSelected ? 'bg-accent/5 border-l-2 border-l-accent' : 'hover:bg-surface2/50'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {asset.image
          ? <img src={asset.image} alt="" className="w-5 h-5 rounded-full flex-shrink-0" />
          : <div className="w-5 h-5 rounded-full bg-surface2 flex-shrink-0 flex items-center justify-center font-mono text-[8px] text-muted">{asset.symbol.slice(0,2)}</div>
        }
        <div className="min-w-0">
          <div className="font-display font-bold text-[12px] tracking-tight truncate">{asset.symbol}</div>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-2">
        <div className="font-mono text-[12px] text-text">{formatPrice(asset.price)}</div>
        <div className={`font-mono text-[10px] ${up ? 'text-accent' : 'text-warn'}`}>
          {up ? '▲' : '▼'} {Math.abs(asset.change24h ?? 0).toFixed(2)}%
        </div>
      </div>
    </button>
  )
}

// ─── Dashboard content ────────────────────────────────────────────
function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [showWelcome, setShowWelcome] = useState(false)
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null)
  const [chartTab, setChartTab] = useState<'crypto' | 'stocks'>('crypto')

  const { assets, fetchPrices } = useAssetsStore()
  const { alerts, init: initAlerts } = useAlertsStore()

  useEffect(() => {
    const session = getSession()
    if (!session) { router.replace('/login'); return }
    setUser(session)
    initAlerts()
    fetchPrices()
    if (searchParams.get('welcome') === '1') {
      setShowWelcome(true)
      setTimeout(() => setShowWelcome(false), 5000)
    }
  }, [router, searchParams, fetchPrices, initAlerts])

  // Auto-select first asset once loaded
  useEffect(() => {
    if (!selectedAssetId && assets.length > 0) {
      const first = assets.find(a => a.type === 'crypto' && a.price !== null)
        ?? assets.find(a => a.price !== null)
      if (first) setSelectedAssetId(first.id)
    }
  }, [assets, selectedAssetId])

  function handleLogout() { logout(); router.push('/login') }

  if (!user) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="w-6 h-6 border border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const watchedCount = assets.filter(a => a.isWatched).length
  const userAlerts = alerts.filter(a => a.userId === user.id)
  const activeAlerts = userAlerts.filter(a => a.status === 'active')
  const triggeredAlerts = userAlerts.filter(a => a.status === 'triggered')

  const cryptoAssets = assets.filter(a => a.type === 'crypto' && a.price !== null)
  const stockAssets = assets.filter(a => a.type === 'stock' && a.price !== null)
  const tabAssets = chartTab === 'crypto' ? cryptoAssets : stockAssets
  const selectedAsset = assets.find(a => a.id === selectedAssetId) ?? tabAssets[0] ?? null

  // Top movers
  const sortedByChange = [...assets]
    .filter(a => a.change24h !== null && a.price !== null)
    .sort((a, b) => Math.abs(b.change24h!) - Math.abs(a.change24h!))
    .slice(0, 5)

  return (
    <div className="min-h-screen bg-bg">
      <div className="fixed inset-0 pointer-events-none opacity-30" style={{
        backgroundImage: 'linear-gradient(rgba(0,229,160,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,160,0.03) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {showWelcome && (
        <div className="fixed top-6 right-6 z-50 bg-accent text-bg font-display font-bold text-sm tracking-wider uppercase px-5 py-3 flex items-center gap-3 shadow-[0_20px_40px_rgba(0,229,160,0.3)] animate-slide-up">
          <span>🎉</span> Bienvenue sur Signal, {user.name.split(' ')[0]} !
        </div>
      )}

      {/* Sidebar */}
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
              user.plan === 'free' ? 'text-muted border-muted/30' : 'text-accent border-accent/30'
            }`}>Plan {user.plan}</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4">
          <div className="font-mono text-[10px] text-muted tracking-[0.15em] uppercase px-3 mb-2">Navigation</div>
          {[
            { icon: '📊', label: 'Dashboard',   href: '/dashboard', active: true },
            { icon: '🔔', label: 'Mes alertes', href: '/dashboard/alerts', badge: activeAlerts.length || null },
            { icon: '📈', label: 'Mes actifs',  href: '/dashboard/assets' },
            { icon: '⚙️', label: 'Paramètres',  href: '/dashboard/settings' },
          ].map(item => (
            <Link key={item.label} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 mb-1 font-display font-semibold text-sm tracking-wide transition-all ${
                item.active ? 'bg-accent/10 text-accent border-l-2 border-accent pl-[10px]' : 'text-muted hover:text-text hover:bg-surface2'
              }`}>
              <span>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {(item as any).badge ? (
                <span className="bg-accent text-bg font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-sm">{(item as any).badge}</span>
              ) : null}
            </Link>
          ))}
        </nav>
        {user.plan === 'free' && (
          <div className="mx-3 mb-3 bg-surface2 border border-white/[0.07] p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono text-[11px] text-muted tracking-wider uppercase">Alertes</span>
              <span className="font-mono text-[11px] text-text">{activeAlerts.length}/3</span>
            </div>
            <div className="h-1 bg-white/[0.07] rounded-full overflow-hidden">
              <div className="h-full bg-accent transition-all rounded-full" style={{ width: `${Math.min((activeAlerts.length / 3) * 100, 100)}%` }} />
            </div>
            <Link href="/pricing" className="mt-3 block text-center font-mono text-[11px] text-accent hover:text-[#00ffc2] tracking-wider transition-colors">
              Passer à Pro →
            </Link>
          </div>
        )}
        <div className="px-3 pb-4 border-t border-white/[0.07] pt-3">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 font-display font-semibold text-sm text-muted hover:text-warn transition-colors tracking-wide">
            <span>→</span><span>Déconnexion</span>
          </button>
        </div>
      </aside>

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
          <Link href="/dashboard/alerts" className="font-display font-bold text-[13px] tracking-[0.1em] uppercase text-bg bg-accent px-5 py-2.5 hover:bg-[#00ffc2] transition-all clip-btn">
            + Nouvelle alerte
          </Link>
        </div>

        <div className="p-8">
          {/* KPI row */}
          <div className="grid grid-cols-4 gap-px bg-white/[0.05] mb-6">
            {[
              { label: 'Alertes actives', value: String(activeAlerts.length), sub: user.plan === 'free' ? `/ 3 max` : 'illimitées', color: 'text-accent' },
              { label: 'Déclenchées', value: String(triggeredAlerts.length), sub: 'ce mois', color: triggeredAlerts.length > 0 ? 'text-warn' : 'text-text' },
              { label: 'Actifs suivis', value: String(watchedCount), sub: 'favoris', color: 'text-accent' },
              { label: 'Actifs chargés', value: String(assets.filter(a => a.price !== null).length), sub: 'prix temps réel', color: 'text-muted' },
            ].map(s => (
              <div key={s.label} className="bg-surface px-7 py-5">
                <div className="font-mono text-[10px] text-muted tracking-[0.12em] uppercase mb-2">{s.label}</div>
                <div className={`font-display font-extrabold text-3xl tracking-tight ${s.color}`}>
                  {s.value}
                  <span className="font-mono text-xs font-normal text-muted ml-1.5">{s.sub}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Main grid: chart + market list */}
          <div className="grid grid-cols-[1fr_260px] gap-px bg-white/[0.05] mb-6">

            {/* Chart panel */}
            <div className="bg-surface p-6">
              {/* Tab selector */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-1">
                  {(['crypto', 'stocks'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => {
                        setChartTab(tab)
                        const first = (tab === 'crypto' ? cryptoAssets : stockAssets)[0]
                        if (first) setSelectedAssetId(first.id)
                      }}
                      className={`font-mono text-[11px] tracking-wider uppercase px-3 py-1.5 border transition-all ${
                        chartTab === tab
                          ? 'border-accent text-accent bg-accent/10'
                          : 'border-white/[0.07] text-muted hover:text-text'
                      }`}
                    >
                      {tab === 'crypto' ? '⬡ Crypto' : '◈ Actions'}
                    </button>
                  ))}
                </div>
                <div className="font-mono text-[10px] text-muted">
                  {assets.length === 0 ? (
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 border border-accent border-t-transparent rounded-full animate-spin inline-block" />
                      Chargement…
                    </span>
                  ) : 'Données en temps réel'}
                </div>
              </div>

              {selectedAsset ? (
                <AssetChart asset={selectedAsset} />
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <div className="w-6 h-6 border border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Asset list */}
            <div className="bg-surface flex flex-col">
              <div className="px-4 py-4 border-b border-white/[0.07]">
                <div className="font-mono text-[10px] text-muted tracking-[0.15em] uppercase">
                  {chartTab === 'crypto' ? 'Cryptos' : 'Actions'}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {tabAssets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-2">
                    <div className="w-4 h-4 border border-muted border-t-transparent rounded-full animate-spin" />
                    <span className="font-mono text-[11px] text-muted">Chargement…</span>
                  </div>
                ) : tabAssets.map(asset => (
                  <MarketRow
                    key={asset.id}
                    asset={asset}
                    isSelected={selectedAssetId === asset.id}
                    onSelect={() => setSelectedAssetId(asset.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Bottom row: top movers + recent alerts */}
          <div className="grid grid-cols-2 gap-px bg-white/[0.05]">

            {/* Top movers */}
            <div className="bg-surface p-6">
              <div className="font-mono text-[10px] text-muted tracking-[0.15em] uppercase mb-1">Marchés</div>
              <h2 className="font-display font-bold text-lg tracking-tight mb-5">Mouvements du jour</h2>
              <div className="flex flex-col gap-1">
                {sortedByChange.map(asset => {
                  const up = (asset.change24h ?? 0) >= 0
                  return (
                    <div key={asset.id} className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                      <div className="flex items-center gap-2.5">
                        {asset.image
                          ? <img src={asset.image} alt="" className="w-6 h-6 rounded-full" />
                          : <div className="w-6 h-6 rounded-full bg-surface2 flex items-center justify-center font-mono text-[9px] text-muted">{asset.symbol.slice(0,2)}</div>
                        }
                        <div>
                          <span className="font-display font-bold text-[13px] tracking-tight">{asset.symbol}</span>
                          <span className="font-mono text-[10px] text-muted ml-2">{asset.name.slice(0, 12)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-[12px] text-text">{formatPrice(asset.price)}</span>
                        <span className={`font-mono text-[12px] w-16 text-right ${up ? 'text-accent' : 'text-warn'}`}>
                          {up ? '▲' : '▼'} {Math.abs(asset.change24h ?? 0).toFixed(2)}%
                        </span>
                        <Link
                          href="/dashboard/alerts"
                          className="font-mono text-[10px] tracking-widest text-muted border border-white/[0.07] px-2 py-1 hover:border-accent hover:text-accent transition-all"
                        >
                          + ALERTE
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Recent alerts */}
            <div className="bg-surface p-6">
              <div className="font-mono text-[10px] text-muted tracking-[0.15em] uppercase mb-1">Surveillance</div>
              <h2 className="font-display font-bold text-lg tracking-tight mb-5 flex items-center justify-between">
                Mes alertes récentes
                <Link href="/dashboard/alerts" className="font-mono text-[11px] text-accent hover:text-[#00ffc2] transition-colors">
                  Voir tout →
                </Link>
              </h2>

              {userAlerts.length === 0 ? (
                <div className="border border-dashed border-white/[0.07] flex flex-col items-center justify-center py-12 gap-3">
                  <div className="text-3xl opacity-20">🔔</div>
                  <p className="font-mono text-[12px] text-muted text-center">Aucune alerte créée.</p>
                  <Link href="/dashboard/alerts" className="font-mono text-[11px] text-accent hover:text-[#00ffc2] transition-colors">
                    Créer une alerte →
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {userAlerts.slice(0, 5).map(alert => {
                    const up = alert.condition === 'above' || alert.condition === 'change_up'
                    return (
                      <div key={alert.id} className={`flex items-center justify-between px-4 py-3 border ${
                        alert.status === 'triggered' ? 'border-accent/30 bg-accent/5'
                        : alert.status === 'paused' ? 'border-white/[0.04] opacity-50'
                        : 'border-white/[0.07]'
                      }`}>
                        <div className="flex items-center gap-2.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            alert.status === 'triggered' ? 'bg-accent animate-pulse'
                            : alert.status === 'paused' ? 'bg-muted'
                            : 'bg-accent/60'
                          }`} />
                          <span className="font-display font-bold text-sm">{alert.assetSymbol}</span>
                          <span className={`font-mono text-[11px] ${up ? 'text-accent' : 'text-warn'}`}>
                            {up ? '▲' : '▼'} {alert.condition.startsWith('change') ? `${alert.targetValue}%` : formatPrice(alert.targetValue)}
                          </span>
                        </div>
                        <span className={`font-mono text-[10px] tracking-widest uppercase ${
                          alert.status === 'triggered' ? 'text-accent'
                          : alert.status === 'paused' ? 'text-muted'
                          : 'text-muted/60'
                        }`}>
                          {alert.status === 'triggered' ? '✓ OK' : alert.status === 'paused' ? 'Pause' : 'Actif'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }
        @keyframes slide-up { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .animate-slide-up{animation:slide-up .2s ease-out}
        .clip-btn{clip-path:polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%)}
      `}</style>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-6 h-6 border border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
