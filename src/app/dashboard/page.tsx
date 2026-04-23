'use client'
import { useEffect, useState, Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { getSession, logout } from '@/lib/auth'
import type { User } from '@/lib/auth'
import { useAssetsStore, formatPrice, formatChange, formatVolume, type Asset } from '@/lib/assets'
import { useAlertsStore } from '@/lib/alerts'
import Sidebar from '@/components/Sidebar'

function generateChartData(asset: Asset, points = 48) {
  if (!asset.price) return []
  const price = asset.price
  const change = asset.change24h ?? 0
  const startPrice = price / (1 + change / 100)
  const data = []
  const now = Date.now()
  const interval = (24 * 60 * 60 * 1000) / points
  let current = startPrice
  for (let i = 0; i <= points; i++) {
    const t = now - (points - i) * interval
    const noise = (Math.random() - 0.48) * (price * 0.010)
    const trend = ((price - startPrice) / points) * i
    current = startPrice + trend + noise
    current = Math.max(current, price * 0.7)
    data.push({
      time: new Date(t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      price: Math.round(current * 100) / 100,
    })
  }
  return data
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface3 border border-white/10 px-3 py-2 rounded-sm shadow-xl">
      <div className="font-mono text-[10px] text-muted mb-1">{label}</div>
      <div className="font-mono text-sm text-text font-bold">{formatPrice(payload[0]?.value)}</div>
    </div>
  )
}

function AssetPanel({ asset }: { asset: Asset }) {
  const up = (asset.change24h ?? 0) >= 0
  const color = up ? '#10b981' : '#ef4444'
  const chartData = useMemo(() => generateChartData(asset), [asset.id, asset.price])
  const high = asset.high24h ?? Math.max(...chartData.map(d => d.price))
  const low = asset.low24h ?? Math.min(...chartData.map(d => d.price))

  return (
    <div className="flex flex-col gap-0">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          {asset.image
            ? <img src={asset.image} alt={asset.symbol} className="w-10 h-10 rounded-full ring-2 ring-white/10" />
            : <div className="w-10 h-10 rounded-full bg-surface3 flex items-center justify-center font-mono text-[11px] text-muted">{asset.symbol.slice(0,2)}</div>
          }
          <div>
            <div className="font-display font-bold text-2xl tracking-tight">{asset.symbol}</div>
            <div className="font-mono text-[11px] text-muted">{asset.name}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono font-bold text-2xl">{formatPrice(asset.price)}</div>
          <div className={`font-mono text-sm flex items-center justify-end gap-1 mt-0.5 ${up ? 'text-up' : 'text-down'}`}>
            <span>{up ? '▲' : '▼'}</span>
            <span>{formatChange(asset.change24h)} (24h)</span>
          </div>
        </div>
      </div>

      <div className="h-48 w-full -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`g-${asset.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis dataKey="time" tick={{ fontFamily: 'Geist Mono', fontSize: 9, fill: '#475569' }} tickLine={false} axisLine={false} interval={Math.floor(chartData.length / 4)} />
            <YAxis tick={{ fontFamily: 'Geist Mono', fontSize: 9, fill: '#475569' }} tickLine={false} axisLine={false} width={60}
              tickFormatter={v => formatPrice(v).slice(0, 9)} domain={['auto', 'auto']} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="price" stroke={color} strokeWidth={1.5} fill={`url(#g-${asset.id})`} dot={false} activeDot={{ r: 3, fill: color, strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-4 gap-px bg-white/[0.04] mt-3">
        {[
          { label: 'Haut 24h', value: formatPrice(high), color: 'text-up' },
          { label: 'Bas 24h', value: formatPrice(low), color: 'text-down' },
          { label: 'Volume', value: formatVolume(asset.volume24h) },
          { label: 'Mkt Cap', value: formatVolume(asset.marketCap) },
        ].map(s => (
          <div key={s.label} className="bg-surface2 px-3 py-2.5">
            <div className="font-mono text-[9px] text-muted tracking-widest uppercase mb-1">{s.label}</div>
            <div className={`font-mono text-[12px] font-bold ${s.color || 'text-text'}`}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AssetRow({ asset, onSelect, isSelected }: { asset: Asset; onSelect: () => void; isSelected: boolean }) {
  const up = (asset.change24h ?? 0) >= 0
  return (
    <button onClick={onSelect}
      className={`w-full flex items-center justify-between py-2.5 px-3 border-b border-white/[0.04] transition-all text-left ${
        isSelected ? 'bg-amber-500/5 border-l-2 border-l-amber-500' : 'hover:bg-surface2/60'
      }`}>
      <div className="flex items-center gap-2.5">
        {asset.image
          ? <img src={asset.image} alt="" className="w-5 h-5 rounded-full flex-shrink-0" />
          : <div className="w-5 h-5 rounded-full bg-surface3 flex-shrink-0 flex items-center justify-center font-mono text-[8px] text-muted">{asset.symbol.slice(0,2)}</div>
        }
        <span className="font-display font-semibold text-[12px] tracking-tight">{asset.symbol}</span>
      </div>
      <div className="text-right">
        <div className="font-mono text-[12px] text-text">{formatPrice(asset.price)}</div>
        <div className={`font-mono text-[10px] ${up ? 'text-up' : 'text-down'}`}>
          {up ? '▲' : '▼'} {Math.abs(asset.change24h ?? 0).toFixed(2)}%
        </div>
      </div>
    </button>
  )
}

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
    if (searchParams.get('welcome') === '1') { setShowWelcome(true); setTimeout(() => setShowWelcome(false), 5000) }
  }, [router, searchParams, fetchPrices, initAlerts])

  useEffect(() => {
    if (!selectedAssetId && assets.length > 0) {
      const first = assets.find(a => a.type === 'crypto' && a.price !== null) ?? assets.find(a => a.price !== null)
      if (first) setSelectedAssetId(first.id)
    }
  }, [assets, selectedAssetId])

  if (!user) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
    </div>
  )

  const userAlerts = alerts.filter(a => a.userId === user.id)
  const activeAlerts = userAlerts.filter(a => a.status === 'active')
  const triggeredAlerts = userAlerts.filter(a => a.status === 'triggered')
  const watchedCount = assets.filter(a => a.isWatched).length

  const cryptoAssets = assets.filter(a => a.type === 'crypto' && a.price !== null)
  const stockAssets = assets.filter(a => a.type === 'stock' && a.price !== null)
  const tabAssets = chartTab === 'crypto' ? cryptoAssets : stockAssets
  const selectedAsset = assets.find(a => a.id === selectedAssetId) ?? tabAssets[0] ?? null

  const topMovers = [...assets]
    .filter(a => a.change24h !== null && a.price !== null)
    .sort((a, b) => Math.abs(b.change24h!) - Math.abs(a.change24h!))
    .slice(0, 5)

  return (
    <div className="min-h-screen bg-bg">
      {/* Ambient */}
      <div className="fixed pointer-events-none" style={{ width: 800, height: 400, background: 'radial-gradient(ellipse, rgba(245,158,11,0.025) 0%, transparent 70%)', top: 0, right: 0 }} />

      {showWelcome && (
        <div className="fixed top-5 right-5 z-50 bg-amber-500 text-black font-bold text-sm tracking-wide uppercase px-5 py-3 flex items-center gap-3 shadow-[0_20px_60px_rgba(245,158,11,0.4)] animate-slide-up rounded-sm">
          <span>🎉</span> Bienvenue sur Pulse, {user.name.split(' ')[0]} !
        </div>
      )}

      <Sidebar user={user} activeNav="dashboard" activeAlertsCount={activeAlerts.length}
        onLogout={() => { logout(); router.push('/login') }} />

      <main className="ml-[220px] relative z-10">
        {/* Topbar */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-white/[0.05] bg-surface/60 backdrop-blur-sm sticky top-0 z-10">
          <div>
            <div className="font-mono text-[10px] text-muted tracking-[0.15em] uppercase mb-0.5">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <h1 className="font-display font-bold text-xl tracking-tight">
              Bonjour, <span className="text-amber-400">{user.name.split(' ')[0]}</span> 👋
            </h1>
          </div>
          <Link href="/dashboard/alerts" className="bg-amber-500 text-black font-bold text-[12px] tracking-widest uppercase px-5 py-2.5 hover:bg-amber-400 transition-all rounded-sm shadow-[0_8px_24px_rgba(245,158,11,0.2)]">
            + Nouvelle alerte
          </Link>
        </div>

        <div className="p-6">
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-px bg-white/[0.04] mb-5 rounded-sm overflow-hidden">
            {[
              { label: 'Alertes actives', value: String(activeAlerts.length), sub: user.plan === 'free' ? '/ 3 max' : 'illimitées', color: 'text-amber-400' },
              { label: 'Déclenchées', value: String(triggeredAlerts.length), sub: 'ce mois', color: triggeredAlerts.length > 0 ? 'text-down' : 'text-text2' },
              { label: 'Actifs suivis', value: String(watchedCount), sub: 'favoris', color: 'text-up' },
              { label: 'Actifs chargés', value: String(assets.filter(a => a.price !== null).length), sub: 'prix live', color: 'text-muted' },
            ].map(s => (
              <div key={s.label} className="bg-surface px-6 py-4">
                <div className="font-mono text-[9px] text-muted tracking-[0.15em] uppercase mb-2">{s.label}</div>
                <div className={`font-display font-bold text-3xl ${s.color}`}>
                  {s.value}
                  <span className="font-mono text-[11px] font-normal text-muted ml-2">{s.sub}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-[1fr_240px] gap-px bg-white/[0.04] mb-5 rounded-sm overflow-hidden">
            {/* Chart */}
            <div className="bg-surface p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-1.5">
                  {(['crypto', 'stocks'] as const).map(tab => (
                    <button key={tab} onClick={() => {
                      setChartTab(tab)
                      const first = (tab === 'crypto' ? cryptoAssets : stockAssets)[0]
                      if (first) setSelectedAssetId(first.id)
                    }}
                      className={`font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 border transition-all rounded-sm ${
                        chartTab === tab ? 'border-amber-500/60 text-amber-400 bg-amber-500/8' : 'border-white/[0.06] text-muted hover:text-text2'
                      }`}>
                      {tab === 'crypto' ? '⬡ Crypto' : '◈ Actions'}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  {assets.length === 0 ? (
                    <><span className="w-2 h-2 border border-amber-500 border-t-transparent rounded-full animate-spin inline-block" />
                    <span className="font-mono text-[10px] text-muted">Chargement…</span></>
                  ) : (
                    <><div className="w-1.5 h-1.5 rounded-full bg-up animate-pulse" />
                    <span className="font-mono text-[10px] text-muted">Live</span></>
                  )}
                </div>
              </div>
              {selectedAsset ? <AssetPanel asset={selectedAsset} /> : (
                <div className="h-48 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Asset list */}
            <div className="bg-surface flex flex-col">
              <div className="px-4 py-3 border-b border-white/[0.04]">
                <div className="font-mono text-[9px] text-muted tracking-widest uppercase">
                  {chartTab === 'crypto' ? '⬡ Cryptos' : '◈ Actions'}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {tabAssets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-2">
                    <div className="w-4 h-4 border border-muted border-t-transparent rounded-full animate-spin" />
                    <span className="font-mono text-[10px] text-muted">Chargement…</span>
                  </div>
                ) : tabAssets.map(asset => (
                  <AssetRow key={asset.id} asset={asset} isSelected={selectedAssetId === asset.id} onSelect={() => setSelectedAssetId(asset.id)} />
                ))}
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-2 gap-px bg-white/[0.04] rounded-sm overflow-hidden">
            {/* Movers */}
            <div className="bg-surface p-5">
              <div className="font-mono text-[9px] text-muted tracking-widest uppercase mb-1">Marchés</div>
              <h2 className="font-display font-bold text-lg mb-4">Mouvements du jour</h2>
              <div className="flex flex-col gap-0.5">
                {topMovers.map(asset => {
                  const up = (asset.change24h ?? 0) >= 0
                  return (
                    <div key={asset.id} className="flex items-center justify-between py-2.5 border-b border-white/[0.04]">
                      <div className="flex items-center gap-2.5">
                        {asset.image
                          ? <img src={asset.image} alt="" className="w-5 h-5 rounded-full" />
                          : <div className="w-5 h-5 rounded-full bg-surface3 flex items-center justify-center font-mono text-[8px] text-muted">{asset.symbol.slice(0,2)}</div>
                        }
                        <div>
                          <span className="font-display font-semibold text-[13px]">{asset.symbol}</span>
                          <span className="font-mono text-[10px] text-muted ml-2">{asset.name.slice(0, 10)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[12px]">{formatPrice(asset.price)}</span>
                        <span className={`font-mono text-[11px] w-14 text-right ${up ? 'text-up' : 'text-down'}`}>
                          {up ? '▲' : '▼'} {Math.abs(asset.change24h ?? 0).toFixed(2)}%
                        </span>
                        <Link href="/dashboard/alerts" className="font-mono text-[9px] tracking-widest text-muted border border-white/[0.06] px-2 py-1 hover:border-amber-500/50 hover:text-amber-400 transition-all rounded-sm">
                          + ALERTE
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Recent alerts */}
            <div className="bg-surface p-5">
              <div className="font-mono text-[9px] text-muted tracking-widest uppercase mb-1">Surveillance</div>
              <h2 className="font-display font-bold text-lg mb-4 flex items-center justify-between">
                Alertes récentes
                <Link href="/dashboard/alerts" className="font-mono text-[11px] text-amber-400 hover:text-amber-300">Voir tout →</Link>
              </h2>
              {userAlerts.length === 0 ? (
                <div className="border border-dashed border-white/[0.06] flex flex-col items-center justify-center py-10 gap-3 rounded-sm">
                  <div className="text-3xl opacity-20">◎</div>
                  <p className="font-mono text-[12px] text-muted text-center">Aucune alerte créée.</p>
                  <Link href="/dashboard/alerts" className="font-mono text-[11px] text-amber-400 hover:text-amber-300">Créer une alerte →</Link>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {userAlerts.slice(0, 5).map(alert => {
                    const up = alert.condition === 'above' || alert.condition === 'change_up'
                    return (
                      <div key={alert.id} className={`flex items-center justify-between px-3.5 py-2.5 border rounded-sm ${
                        alert.status === 'triggered' ? 'border-up/25 bg-up/5' : alert.status === 'paused' ? 'border-white/[0.04] opacity-50' : 'border-white/[0.06]'
                      }`}>
                        <div className="flex items-center gap-2.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${alert.status === 'triggered' ? 'bg-up animate-pulse' : alert.status === 'paused' ? 'bg-muted' : 'bg-amber-500/60'}`} />
                          <span className="font-display font-bold text-sm">{alert.assetSymbol}</span>
                          <span className={`font-mono text-[11px] ${up ? 'text-up' : 'text-down'}`}>
                            {up ? '▲' : '▼'} {alert.condition.startsWith('change') ? `${alert.targetValue}%` : formatPrice(alert.targetValue)}
                          </span>
                        </div>
                        <span className={`font-mono text-[9px] tracking-widest uppercase ${alert.status === 'triggered' ? 'text-up' : alert.status === 'paused' ? 'text-muted' : 'text-amber-400/60'}`}>
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
        @keyframes slide-up { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .animate-slide-up{animation:slide-up .25s ease-out}
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(.5)} }
      `}</style>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
