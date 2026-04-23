'use client'
import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSession, logout } from '@/lib/auth'
import type { User } from '@/lib/auth'
import { useAssetsStore, formatPrice, type Asset } from '@/lib/assets'
import {
  useAlertsStore, conditionLabel, conditionIcon, isTriggered,
  type Alert, type AlertCondition, type CreateAlertInput,
} from '@/lib/alerts'
import Sidebar from '@/components/Sidebar'

// ─── Create Modal ─────────────────────────────────────────────────
function CreateAlertModal({ user, assets, onClose, onCreated }: {
  user: User; assets: Asset[]; onClose: () => void; onCreated: (alert: Alert) => void
}) {
  const { createAlert } = useAlertsStore()
  const available = assets.filter(a => a.price !== null)
  const watched = available.filter(a => a.isWatched)
  const [assetId, setAssetId] = useState(watched[0]?.id ?? available[0]?.id ?? '')
  const [condition, setCondition] = useState<AlertCondition>('above')
  const [targetValue, setTargetValue] = useState('')
  const [contactValue, setContactValue] = useState(user.email)
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const selectedAsset = available.find(a => a.id === assetId)
  const isPercent = condition === 'change_up' || condition === 'change_down'

  useEffect(() => { setTargetValue(''); setErrors({}) }, [assetId, condition])

  function validate() {
    const e: Record<string, string> = {}
    if (!assetId) e.assetId = 'Choisissez un actif'
    const val = parseFloat(targetValue)
    if (isNaN(val) || val <= 0) e.targetValue = isPercent ? 'Entrez un % valide' : 'Entrez un prix valide'
    if (!contactValue) e.contactValue = 'Email requis'
    else if (!/\S+@\S+\.\S+/.test(contactValue)) e.contactValue = 'Email invalide'
    return e
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSubmitted(true)
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    if (!selectedAsset) return
    const input: CreateAlertInput = {
      userId: user.id, assetId: selectedAsset.id, assetSymbol: selectedAsset.symbol,
      assetName: selectedAsset.name, assetType: selectedAsset.type, condition,
      targetValue: parseFloat(targetValue), channel: 'email',
      contactValue: contactValue.toLowerCase().trim(), note, currentPrice: selectedAsset.price,
    }
    onCreated(createAlert(input))
  }

  const conditions: AlertCondition[] = ['above', 'below', 'change_up', 'change_down']

  const quickValues = selectedAsset?.price && !isPercent
    ? [{ mult: 0.90, label: '−10%' }, { mult: 0.95, label: '−5%' }, { mult: 1.05, label: '+5%' }, { mult: 1.10, label: '+10%' }]
    : isPercent ? [{ mult: 2, label: '2%' }, { mult: 5, label: '5%' }, { mult: 10, label: '10%' }, { mult: 20, label: '20%' }]
    : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-surface border border-white/[0.08] w-full max-w-lg animate-slide-up max-h-[92vh] overflow-y-auto rounded-sm shadow-[0_40px_100px_rgba(0,0,0,0.6)]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06] sticky top-0 bg-surface z-10">
          <div>
            <div className="font-mono text-[9px] text-amber-500 tracking-[0.2em] uppercase mb-0.5">Nouvelle alerte</div>
            <h2 className="font-display font-bold text-lg">Créer une alerte de prix</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-muted hover:text-text hover:bg-surface2 transition-all rounded-sm font-mono text-lg">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* Asset */}
          <div>
            <label className="pulse-label">Actif à surveiller</label>
            {available.length === 0 ? (
              <div className="flex items-center gap-3 bg-surface2 border border-white/[0.06] px-4 py-3 rounded-sm">
                <div className="w-3 h-3 border border-amber-500 border-t-transparent rounded-full animate-spin" />
                <span className="font-mono text-[12px] text-muted">Chargement des actifs…</span>
              </div>
            ) : (
              <select value={assetId} onChange={e => setAssetId(e.target.value)} className="pulse-input rounded-sm">
                {watched.length > 0 && (
                  <optgroup label="★ Mes actifs suivis">
                    {watched.map(a => <option key={a.id} value={a.id}>{a.symbol} — {a.name} · {formatPrice(a.price)}</option>)}
                  </optgroup>
                )}
                <optgroup label="Cryptomonnaies">
                  {available.filter(a => a.type === 'crypto' && !a.isWatched).map(a => (
                    <option key={a.id} value={a.id}>{a.symbol} — {a.name} · {formatPrice(a.price)}</option>
                  ))}
                </optgroup>
                <optgroup label="Actions & ETF">
                  {available.filter(a => a.type === 'stock' && !a.isWatched).map(a => (
                    <option key={a.id} value={a.id}>{a.symbol} — {a.name} · {formatPrice(a.price)}</option>
                  ))}
                </optgroup>
              </select>
            )}
            {errors.assetId && <p className="pulse-error">{errors.assetId}</p>}
            {selectedAsset?.price !== null && selectedAsset && (
              <div className="flex items-center gap-2 mt-2">
                <span className="font-mono text-[10px] text-muted">Prix actuel :</span>
                <span className="font-mono text-[11px] text-amber-400 font-bold">{formatPrice(selectedAsset.price)}</span>
                {selectedAsset.change24h !== null && (
                  <span className={`font-mono text-[10px] ${selectedAsset.change24h >= 0 ? 'text-up' : 'text-down'}`}>
                    {selectedAsset.change24h >= 0 ? '▲' : '▼'} {Math.abs(selectedAsset.change24h).toFixed(2)}%
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Condition */}
          <div>
            <label className="pulse-label">Condition de déclenchement</label>
            <div className="grid grid-cols-2 gap-2">
              {conditions.map(c => {
                const isUp = c === 'above' || c === 'change_up'
                const isActive = condition === c
                return (
                  <button key={c} type="button" onClick={() => setCondition(c)}
                    className={`flex items-center gap-2.5 px-4 py-3 border font-mono text-[11px] tracking-wide transition-all text-left rounded-sm ${
                      isActive ? (isUp ? 'border-up/50 text-up bg-up/8' : 'border-down/50 text-down bg-down/8') : 'border-white/[0.06] text-muted hover:border-white/20 hover:text-text2'
                    }`}>
                    <span className="text-base">{conditionIcon(c)}</span>
                    <span>{conditionLabel(c)}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Value */}
          <div>
            <label className="pulse-label">{isPercent ? 'Variation en %' : 'Prix cible (USD)'}</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-muted text-sm">{isPercent ? '%' : '$'}</span>
              <input type="number" step="any" min="0" autoFocus
                placeholder={isPercent ? 'ex : 5' : selectedAsset?.price ? (selectedAsset.price * 1.05).toFixed(selectedAsset.price < 1 ? 6 : 2) : '0.00'}
                value={targetValue} onChange={e => { setTargetValue(e.target.value); if (submitted) setErrors(v => ({ ...v, targetValue: '' })) }}
                className={`pulse-input pl-8 rounded-sm ${errors.targetValue ? 'border-down/50' : ''}`} />
            </div>
            {errors.targetValue && <p className="pulse-error">{errors.targetValue}</p>}
            {quickValues.length > 0 && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {quickValues.map(s => {
                  const val = isPercent ? String(s.mult) : (selectedAsset!.price! * s.mult).toFixed(selectedAsset!.price! < 1 ? 6 : 2)
                  return (
                    <button key={s.label} type="button" onClick={() => setTargetValue(val)}
                      className={`font-mono text-[10px] border px-2 py-1 transition-all rounded-sm ${
                        targetValue === val ? 'border-amber-500/60 text-amber-400 bg-amber-500/8' : 'border-white/[0.06] text-muted hover:border-amber-500/40 hover:text-amber-400'
                      }`}>
                      {isPercent ? s.label : `${s.label} · $${val}`}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="pulse-label">Email de notification</label>
            <input type="email" value={contactValue}
              onChange={e => { setContactValue(e.target.value); if (submitted) setErrors(v => ({ ...v, contactValue: '' })) }}
              className={`pulse-input rounded-sm ${errors.contactValue ? 'border-down/50' : ''}`} placeholder="vous@example.com" />
            {errors.contactValue && <p className="pulse-error">{errors.contactValue}</p>}
          </div>

          {/* Note */}
          <div>
            <label className="pulse-label">Note personnelle (optionnel)</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)}
              className="pulse-input rounded-sm" placeholder="ex : Seuil de prise de profit" maxLength={80} />
          </div>

          {/* Preview */}
          {selectedAsset && targetValue && !isNaN(parseFloat(targetValue)) && (
            <div className={`flex items-center gap-3 px-4 py-3 border rounded-sm ${
              condition === 'above' || condition === 'change_up' ? 'border-up/20 bg-up/5' : 'border-down/20 bg-down/5'
            }`}>
              <span className="text-xl">{conditionIcon(condition)}</span>
              <span className="font-mono text-[12px] text-text2">
                Alerte quand <span className="text-text font-bold">{selectedAsset.symbol}</span>{' '}
                {conditionLabel(condition).toLowerCase()}{' '}
                <span className={`font-bold ${condition === 'above' || condition === 'change_up' ? 'text-up' : 'text-down'}`}>
                  {isPercent ? `${targetValue}%` : `$${targetValue}`}
                </span>
              </span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="pulse-btn-ghost flex-none w-auto px-6 rounded-sm">Annuler</button>
            <button type="submit" className="pulse-btn-primary flex-1 rounded-sm" disabled={available.length === 0}>Créer l'alerte →</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Alert Card ───────────────────────────────────────────────────
function AlertCard({ alert, currentPrice, onDelete, onPause, onResume, onSelect, isExpanded }: {
  alert: Alert; currentPrice: number | null
  onDelete: () => void; onPause: () => void; onResume: () => void
  onSelect: () => void; isExpanded: boolean
}) {
  const up = alert.condition === 'above' || alert.condition === 'change_up'
  const triggered = currentPrice !== null && isTriggered(alert, currentPrice)
  const distancePct = currentPrice && !alert.condition.startsWith('change')
    ? ((alert.targetValue - currentPrice) / currentPrice) * 100 : null
  const progressPct = distancePct !== null ? Math.min(100, Math.max(0, 100 - Math.abs(distancePct) * 4)) : null

  return (
    <div className={`bg-surface border transition-all rounded-sm ${
      alert.status === 'triggered' ? 'border-up/30 bg-up/[0.03]'
      : alert.status === 'paused' ? 'border-white/[0.04] opacity-60'
      : triggered ? 'border-amber-500/30 bg-amber-500/[0.03]'
      : 'border-white/[0.06] hover:border-white/[0.12]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.05] cursor-pointer" onClick={onSelect}>
        <div className="flex items-center gap-2.5">
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            alert.status === 'triggered' ? 'bg-up animate-pulse' : alert.status === 'paused' ? 'bg-muted' : triggered ? 'bg-amber-400 animate-pulse' : 'bg-amber-500/50'
          }`} />
          <span className="font-display font-bold text-sm">{alert.assetSymbol}</span>
          <span className="font-mono text-[11px] text-muted">{alert.assetName}</span>
          <span className={`font-mono text-[9px] border px-1.5 py-0.5 rounded-sm ${
            alert.assetType === 'crypto' ? 'text-amber-400/70 border-amber-500/20' : 'text-text2/60 border-white/[0.08]'
          }`}>{alert.assetType === 'crypto' ? 'CRYPTO' : 'ACTION'}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`font-mono text-[9px] tracking-widest uppercase ${
            alert.status === 'triggered' ? 'text-up' : alert.status === 'paused' ? 'text-muted' : triggered ? 'text-amber-400' : 'text-muted/60'
          }`}>
            {alert.status === 'triggered' ? '✓ Déclenchée' : alert.status === 'paused' ? '⏸ Pause' : triggered ? '⚡ Seuil' : '● Actif'}
          </span>
          <span className="font-mono text-muted/40 text-xs">{isExpanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className={`flex items-center gap-2 font-display font-bold text-base ${up ? 'text-up' : 'text-down'}`}>
            <span>{conditionIcon(alert.condition)}</span>
            <span>{conditionLabel(alert.condition)}</span>
            <span className="font-mono font-normal text-sm text-text">
              {alert.condition.startsWith('change') ? `${alert.targetValue}%` : formatPrice(alert.targetValue)}
            </span>
          </div>
          {alert.note && <div className="font-mono text-[11px] text-muted mt-1 italic">"{alert.note}"</div>}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="font-mono text-[10px] text-muted">✉ {alert.contactValue}</span>
            <span className="font-mono text-[10px] text-muted/40">
              {new Date(alert.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
            </span>
          </div>
        </div>
        <div className="text-right">
          {currentPrice !== null ? (
            <>
              <div className="font-mono text-sm font-bold">{formatPrice(currentPrice)}</div>
              {distancePct !== null && (
                <div className={`font-mono text-[11px] mt-0.5 ${Math.abs(distancePct) < 3 ? 'text-amber-400' : 'text-muted'}`}>
                  {distancePct >= 0 ? '+' : ''}{distancePct.toFixed(2)}% de la cible
                </div>
              )}
            </>
          ) : <div className="w-16 h-3 bg-surface2 animate-pulse rounded" />}
        </div>
      </div>

      {/* Progress */}
      {progressPct !== null && alert.status === 'active' && (
        <div className="px-5 pb-3.5">
          <div className="flex justify-between mb-1">
            <span className="font-mono text-[9px] text-muted">Progression vers la cible</span>
            <span className="font-mono text-[9px] text-muted">{progressPct.toFixed(0)}%</span>
          </div>
          <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-500 rounded-full ${up ? 'bg-up' : 'bg-down'}`} style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      {/* Actions */}
      {isExpanded && (
        <div className="px-5 pb-4 pt-3 border-t border-white/[0.05] flex items-center gap-2 flex-wrap bg-surface2/30">
          <span className="font-mono text-[9px] text-muted tracking-widest uppercase mr-auto">Actions</span>
          {alert.status === 'active' && (
            <button onClick={onPause} className="font-mono text-[10px] text-muted hover:text-amber-400 border border-white/[0.06] px-3 py-1.5 hover:border-amber-500/40 transition-all rounded-sm">
              ⏸ Mettre en pause
            </button>
          )}
          {(alert.status === 'paused' || alert.status === 'triggered') && (
            <button onClick={onResume} className="font-mono text-[10px] text-muted hover:text-up border border-white/[0.06] px-3 py-1.5 hover:border-up/40 transition-all rounded-sm">
              {alert.status === 'triggered' ? '↺ Réactiver' : '▶ Reprendre'}
            </button>
          )}
          <button onClick={onDelete} className="font-mono text-[10px] text-muted hover:text-down border border-white/[0.06] px-3 py-1.5 hover:border-down/40 transition-all rounded-sm">
            ✕ Supprimer
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────
type FilterStatus = 'all' | 'active' | 'triggered' | 'paused'
type FilterType = 'all' | 'crypto' | 'stock'
type SortKey = 'date_desc' | 'date_asc' | 'distance' | 'symbol'

const PLAN_MAX: Record<string, number> = { free: 3, pro: Infinity, expert: Infinity }

export default function AlertsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [typeFilter, setTypeFilter] = useState<FilterType>('all')
  const [sortKey, setSortKey] = useState<SortKey>('date_desc')
  const [search, setSearch] = useState('')

  const { assets, fetchPrices, getPriceFor } = useAssetsStore()
  const { alerts, init: initAlerts, deleteAlert, pauseAlert, resumeAlert, triggerAlert } = useAlertsStore()

  const checkAlerts = useCallback(async () => {
    for (const alert of alerts.filter(a => a.status === 'active')) {
      const price = getPriceFor(alert.assetId)
      if (price === null) continue
      if (isTriggered(alert, price)) {
        try {
          triggerAlert(alert.id)
          await fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ alert, currentPrice: price }) })
        } catch {}
      }
    }
  }, [alerts, getPriceFor, triggerAlert])

  useEffect(() => {
    const session = getSession()
    if (!session) { router.replace('/login'); return }
    setUser(session); initAlerts(); fetchPrices()
    const id = setInterval(() => { fetchPrices(); checkAlerts() }, 60_000)
    return () => clearInterval(id)
  }, [router, initAlerts, fetchPrices])

  useEffect(() => { checkAlerts() }, [assets])

  function showToast(msg: string) { setToastMsg(msg); setTimeout(() => setToastMsg(''), 4000) }

  const userAlerts = useMemo(() => alerts.filter(a => a.userId === user?.id), [alerts, user?.id])
  const activeAlerts = useMemo(() => userAlerts.filter(a => a.status === 'active'), [userAlerts])
  const maxAlerts = user ? PLAN_MAX[user.plan] : 3
  const canCreate = activeAlerts.length < maxAlerts

  const filteredAlerts = useMemo(() => {
    let list = userAlerts
    if (statusFilter !== 'all') list = list.filter(a => a.status === statusFilter)
    if (typeFilter !== 'all') list = list.filter(a => a.assetType === typeFilter)
    if (search.trim()) { const q = search.toLowerCase(); list = list.filter(a => a.assetSymbol.toLowerCase().includes(q) || a.assetName.toLowerCase().includes(q)) }
    return [...list].sort((a, b) => {
      if (sortKey === 'date_asc') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sortKey === 'date_desc') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sortKey === 'symbol') return a.assetSymbol.localeCompare(b.assetSymbol)
      if (sortKey === 'distance') {
        const pA = getPriceFor(a.assetId), pB = getPriceFor(b.assetId)
        if (!pA || !pB) return 0
        return Math.abs((a.targetValue - pA) / pA) - Math.abs((b.targetValue - pB) / pB)
      }
      return 0
    })
  }, [userAlerts, statusFilter, typeFilter, search, sortKey, getPriceFor])

  if (!user) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar user={user} activeNav="alerts" activeAlertsCount={activeAlerts.length}
        onLogout={() => { logout(); router.push('/login') }} />

      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-amber-500 text-black font-bold text-sm tracking-wide uppercase px-5 py-3 flex items-center gap-3 shadow-[0_20px_60px_rgba(245,158,11,0.4)] animate-slide-up rounded-sm">
          <span>✓</span> {toastMsg}
        </div>
      )}

      <main className="ml-[220px] relative z-10">
        <div className="flex items-center justify-between px-8 py-4 border-b border-white/[0.05] bg-surface/60 backdrop-blur-sm sticky top-0 z-10">
          <div>
            <div className="font-mono text-[10px] text-muted tracking-widest uppercase mb-0.5">Surveillance</div>
            <h1 className="font-display font-bold text-xl flex items-center gap-3">
              Mes alertes
              {activeAlerts.length > 0 && (
                <span className="font-mono text-[10px] text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  {activeAlerts.length}{maxAlerts !== Infinity ? `/${maxAlerts}` : ''} actives
                </span>
              )}
            </h1>
          </div>
          <button onClick={() => canCreate ? setShowCreate(true) : showToast('Limite atteinte — passez à Pro')}
            className={`font-bold text-[12px] tracking-widest uppercase px-5 py-2.5 transition-all rounded-sm ${
              canCreate ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-[0_8px_24px_rgba(245,158,11,0.2)]' : 'text-muted border border-white/[0.06] cursor-not-allowed'
            }`}>
            + Nouvelle alerte
          </button>
        </div>

        <div className="p-6">
          {/* Quota */}
          {user.plan === 'free' && (
            <div className="mb-5 flex items-center justify-between bg-surface border border-white/[0.06] px-5 py-3.5 rounded-sm">
              <div className="flex items-center gap-4">
                <div>
                  <div className="font-mono text-[9px] text-muted tracking-widest uppercase mb-1.5">Quota Free</div>
                  <div className="w-32 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 transition-all rounded-full" style={{ width: `${Math.min((activeAlerts.length / 3) * 100, 100)}%` }} />
                  </div>
                </div>
                <span className="font-mono text-sm text-text">{activeAlerts.length} / 3 alertes actives</span>
              </div>
              <Link href="/pricing" className="font-mono text-[11px] text-amber-400 hover:text-amber-300 transition-colors">
                Passer à Pro — illimité →
              </Link>
            </div>
          )}

          {/* Stats row */}
          {userAlerts.length > 0 && (
            <div className="grid grid-cols-5 gap-px bg-white/[0.04] mb-5 rounded-sm overflow-hidden">
              {[
                { label: 'Total', value: userAlerts.length },
                { label: 'Actives', value: userAlerts.filter(a => a.status === 'active').length, color: 'text-amber-400' },
                { label: 'Déclenchées', value: userAlerts.filter(a => a.status === 'triggered').length, color: userAlerts.filter(a => a.status === 'triggered').length > 0 ? 'text-up' : '' },
                { label: 'En pause', value: userAlerts.filter(a => a.status === 'paused').length },
                { label: 'Crypto', value: userAlerts.filter(a => a.assetType === 'crypto').length },
              ].map(s => (
                <div key={s.label} className="bg-surface px-5 py-3.5 text-center">
                  <div className={`font-display font-bold text-2xl ${s.color || 'text-text'}`}>{s.value}</div>
                  <div className="font-mono text-[9px] text-muted tracking-widest uppercase mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Filters */}
          {userAlerts.length > 0 && (
            <div className="bg-surface border border-white/[0.06] mb-4 rounded-sm">
              <div className="flex items-stretch border-b border-white/[0.05] overflow-x-auto">
                <div className="font-mono text-[9px] text-muted tracking-widest uppercase px-4 py-3 border-r border-white/[0.05] whitespace-nowrap flex items-center">Statut</div>
                {([['all', 'Toutes'], ['active', '● Actives'], ['triggered', '✓ OK'], ['paused', '⏸ Pause']] as [FilterStatus, string][]).map(([v, l]) => (
                  <button key={v} onClick={() => setStatusFilter(v)}
                    className={`font-mono text-[10px] px-4 py-3 border-r border-white/[0.05] whitespace-nowrap transition-all ${statusFilter === v ? 'text-amber-400 bg-amber-500/8' : 'text-muted hover:text-text2'}`}>
                    {l}
                  </button>
                ))}
                <div className="font-mono text-[9px] text-muted tracking-widest uppercase px-4 py-3 border-r border-white/[0.05] whitespace-nowrap flex items-center ml-2">Type</div>
                {([['all', 'Tout'], ['crypto', '⬡ Crypto'], ['stock', '◈ Actions']] as [FilterType, string][]).map(([v, l]) => (
                  <button key={v} onClick={() => setTypeFilter(v)}
                    className={`font-mono text-[10px] px-4 py-3 border-r border-white/[0.05] whitespace-nowrap transition-all ${typeFilter === v ? 'text-amber-400 bg-amber-500/8' : 'text-muted hover:text-text2'}`}>
                    {l}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <input type="text" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)}
                  className="flex-1 bg-surface2 border border-white/[0.06] text-text font-mono text-[12px] px-3 py-2 outline-none focus:border-amber-500/40 rounded-sm placeholder:text-muted" />
                <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}
                  className="bg-surface2 border border-white/[0.06] text-text font-mono text-[11px] px-3 py-2 outline-none focus:border-amber-500/40 rounded-sm">
                  <option value="date_desc">Plus récentes</option>
                  <option value="date_asc">Plus anciennes</option>
                  <option value="distance">Proximité cible</option>
                  <option value="symbol">Symbole A→Z</option>
                </select>
                <span className="font-mono text-[10px] text-muted whitespace-nowrap">{filteredAlerts.length} résultat{filteredAlerts.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          )}

          {userAlerts.length === 0 ? (
            <div className="border border-dashed border-white/[0.06] flex flex-col items-center justify-center py-24 gap-5 rounded-sm">
              <div className="text-5xl opacity-15">◎</div>
              <div className="text-center">
                <h3 className="font-display font-bold text-lg mb-2">Aucune alerte</h3>
                <p className="font-mono text-[13px] text-muted max-w-xs text-center leading-relaxed">
                  Créez votre première alerte pour être notifié dès qu'un actif atteint votre cible.
                </p>
              </div>
              <button onClick={() => setShowCreate(true)} className="pulse-btn-primary w-auto px-8 mt-2 rounded-sm">+ Créer une alerte</button>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="border border-dashed border-white/[0.06] flex flex-col items-center justify-center py-16 gap-4 rounded-sm">
              <p className="font-mono text-[13px] text-muted">Aucune alerte ne correspond aux filtres.</p>
              <button onClick={() => { setStatusFilter('all'); setTypeFilter('all'); setSearch('') }}
                className="font-mono text-[11px] text-amber-400 hover:text-amber-300 transition-colors">Réinitialiser les filtres</button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredAlerts.map(alert => (
                <AlertCard key={alert.id} alert={alert} currentPrice={getPriceFor(alert.assetId)}
                  isExpanded={expandedId === alert.id}
                  onSelect={() => setExpandedId(expandedId === alert.id ? null : alert.id)}
                  onDelete={() => { deleteAlert(alert.id); showToast('Alerte supprimée') }}
                  onPause={() => { pauseAlert(alert.id); showToast('Alerte mise en pause') }}
                  onResume={() => { resumeAlert(alert.id); showToast('Alerte relancée') }}
                />
              ))}
            </div>
          )}

          {userAlerts.length > 0 && (
            <p className="font-mono text-[10px] text-muted/40 mt-8 text-center">
              Vérification automatique toutes les 60 secondes · Notifications via email
            </p>
          )}
        </div>
      </main>

      {showCreate && (
        <CreateAlertModal user={user} assets={assets} onClose={() => setShowCreate(false)}
          onCreated={alert => { setShowCreate(false); showToast(`Alerte ${alert.assetSymbol} créée !`) }} />
      )}

      <style jsx global>{`
        @keyframes slide-up { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .animate-slide-up{animation:slide-up .25s ease-out}
        select option{background:#0b0f14;color:#f1f5f9}
      `}</style>
    </div>
  )
}
