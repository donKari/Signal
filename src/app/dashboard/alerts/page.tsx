'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSession, logout } from '@/lib/auth'
import type { User } from '@/lib/auth'
import { useAssetsStore, formatPrice, type Asset } from '@/lib/assets'
import {
  useAlertsStore,
  conditionLabel,
  conditionIcon,
  isTriggered,
  type Alert,
  type AlertCondition,
  type CreateAlertInput,
} from '@/lib/alerts'

// ─── Sidebar ─────────────────────────────────────────────────────
function Sidebar({ user, onLogout }: { user: User; onLogout: () => void }) {
  const { alerts } = useAlertsStore()
  const activeCount = alerts.filter(a => a.status === 'active' && a.userId === user.id).length
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
            user.plan === 'free' ? 'text-muted border-muted/30' : 'text-accent border-accent/30'
          }`}>Plan {user.plan}</div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4">
        <div className="font-mono text-[10px] text-muted tracking-[0.15em] uppercase px-3 mb-2">Navigation</div>
        {[
          { icon: '📊', label: 'Dashboard',   href: '/dashboard' },
          { icon: '🔔', label: 'Mes alertes', href: '/dashboard/alerts', active: true, badge: activeCount || null },
          { icon: '📈', label: 'Mes actifs',  href: '/dashboard/assets' },
          { icon: '⚙️', label: 'Paramètres',  href: '/dashboard/settings' },
        ].map(item => (
          <Link key={item.label} href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 mb-1 font-display font-semibold text-sm tracking-wide transition-all ${
              (item as any).active ? 'bg-accent/10 text-accent border-l-2 border-accent pl-[10px]' : 'text-muted hover:text-text hover:bg-surface2'
            }`}>
            <span>{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {(item as any).badge ? (
              <span className="bg-accent text-bg font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-sm">{(item as any).badge}</span>
            ) : null}
          </Link>
        ))}
      </nav>
      <div className="px-3 pb-4 border-t border-white/[0.07] pt-3">
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 font-display font-semibold text-sm text-muted hover:text-warn transition-colors tracking-wide">
          <span>→</span><span>Déconnexion</span>
        </button>
      </div>
    </aside>
  )
}

// ─── Create alert modal ───────────────────────────────────────────
function CreateAlertModal({
  user, assets, onClose, onCreated,
}: {
  user: User; assets: Asset[]; onClose: () => void; onCreated: (alert: Alert) => void
}) {
  const { createAlert } = useAlertsStore()
  const availableAssets = assets.filter(a => a.price !== null)
  const watchedAssets = availableAssets.filter(a => a.isWatched)

  const defaultAssetId = watchedAssets[0]?.id ?? availableAssets[0]?.id ?? ''

  const [assetId, setAssetId] = useState(defaultAssetId)
  const [condition, setCondition] = useState<AlertCondition>('above')
  const [targetValue, setTargetValue] = useState('')
  const [contactValue, setContactValue] = useState(user.email)
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const selectedAsset = availableAssets.find(a => a.id === assetId)
  const isPercent = condition === 'change_up' || condition === 'change_down'

  // When asset changes, reset targetValue and pre-fill with current price suggestion
  useEffect(() => {
    setTargetValue('')
    setErrors({})
  }, [assetId, condition])

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
    e.preventDefault()
    setSubmitted(true)
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    if (!selectedAsset) return

    const input: CreateAlertInput = {
      userId: user.id,
      assetId: selectedAsset.id,
      assetSymbol: selectedAsset.symbol,
      assetName: selectedAsset.name,
      assetType: selectedAsset.type,
      condition,
      targetValue: parseFloat(targetValue),
      channel: 'email',
      contactValue: contactValue.toLowerCase().trim(),
      note,
      currentPrice: selectedAsset.price,
    }
    const alert = createAlert(input)
    onCreated(alert)
  }

  const suggestions = selectedAsset?.price && !isPercent
    ? [
        { mult: 0.90, label: '−10%' },
        { mult: 0.95, label: '−5%' },
        { mult: 1.05, label: '+5%' },
        { mult: 1.10, label: '+10%' },
      ]
    : isPercent
    ? [
        { mult: 2, label: '2%' },
        { mult: 5, label: '5%' },
        { mult: 10, label: '10%' },
        { mult: 20, label: '20%' },
      ]
    : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm" />
      <div
        className="relative bg-surface border border-white/[0.07] w-full max-w-lg animate-slide-up max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.07] sticky top-0 bg-surface z-10">
          <div>
            <div className="font-mono text-[10px] text-accent tracking-[0.15em] uppercase mb-0.5">Nouvelle alerte</div>
            <h2 className="font-display font-bold text-lg tracking-tight">Créer une alerte de prix</h2>
          </div>
          <button onClick={onClose} className="font-mono text-[18px] text-muted hover:text-text px-2 transition-colors">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">

          {/* Asset selector */}
          <div>
            <label className="signal-label">Actif à surveiller</label>
            {availableAssets.length === 0 ? (
              <div className="flex items-center gap-3 bg-surface2 border border-white/[0.07] px-4 py-3">
                <div className="w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin" />
                <span className="font-mono text-[12px] text-muted">Chargement des actifs…</span>
              </div>
            ) : (
              <select
                value={assetId}
                onChange={e => setAssetId(e.target.value)}
                className="signal-input"
              >
                {watchedAssets.length > 0 && (
                  <optgroup label="★ Mes actifs suivis">
                    {watchedAssets.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.symbol} — {a.name} · {formatPrice(a.price)}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Tous les actifs">
                  {availableAssets.filter(a => !a.isWatched).map(a => (
                    <option key={a.id} value={a.id}>
                      {a.symbol} — {a.name} · {formatPrice(a.price)}
                    </option>
                  ))}
                </optgroup>
              </select>
            )}
            {errors.assetId && <p className="signal-error">{errors.assetId}</p>}
            {selectedAsset?.price !== null && selectedAsset && (
              <div className="flex items-center gap-2 mt-2">
                <span className="font-mono text-[11px] text-muted">Prix actuel :</span>
                <span className="font-mono text-[11px] text-accent font-bold">{formatPrice(selectedAsset.price)}</span>
                {selectedAsset.change24h !== null && (
                  <span className={`font-mono text-[10px] ${selectedAsset.change24h >= 0 ? 'text-accent' : 'text-warn'}`}>
                    {selectedAsset.change24h >= 0 ? '▲' : '▼'} {Math.abs(selectedAsset.change24h).toFixed(2)}%
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Condition */}
          <div>
            <label className="signal-label">Condition de déclenchement</label>
            <div className="grid grid-cols-2 gap-2">
              {(['above', 'below', 'change_up', 'change_down'] as AlertCondition[]).map(c => {
                const isUp = c === 'above' || c === 'change_up'
                const isActive = condition === c
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCondition(c)}
                    className={`flex items-center gap-2 px-4 py-3 border font-mono text-[12px] tracking-wide transition-all text-left ${
                      isActive
                        ? isUp
                          ? 'border-accent text-accent bg-accent/10'
                          : 'border-warn text-warn bg-warn/10'
                        : 'border-white/[0.07] text-muted hover:border-white/20 hover:text-text'
                    }`}
                  >
                    <span className="text-base">{conditionIcon(c)}</span>
                    <span>{conditionLabel(c)}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Target value */}
          <div>
            <label className="signal-label">
              {isPercent ? 'Variation en %' : 'Prix cible (USD)'}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-muted text-sm select-none">
                {isPercent ? '%' : '$'}
              </span>
              <input
                type="number"
                step="any"
                min="0"
                placeholder={
                  isPercent
                    ? 'ex : 5'
                    : selectedAsset?.price
                    ? (selectedAsset.price * 1.05).toFixed(selectedAsset.price < 1 ? 6 : 2)
                    : '0.00'
                }
                value={targetValue}
                onChange={e => {
                  setTargetValue(e.target.value)
                  if (submitted) setErrors(v => ({ ...v, targetValue: '' }))
                }}
                className={`signal-input pl-8 ${errors.targetValue ? 'border-warn/60' : ''}`}
                autoFocus
              />
            </div>
            {errors.targetValue && <p className="signal-error">{errors.targetValue}</p>}

            {/* Quick suggestions */}
            {suggestions.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {suggestions.map(s => {
                  const val = isPercent
                    ? String(s.mult)
                    : (selectedAsset!.price! * s.mult).toFixed(selectedAsset!.price! < 1 ? 6 : 2)
                  return (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => setTargetValue(val)}
                      className={`font-mono text-[10px] border px-2.5 py-1 transition-all ${
                        targetValue === val
                          ? 'border-accent text-accent bg-accent/10'
                          : 'border-white/[0.07] text-muted hover:border-accent/50 hover:text-accent'
                      }`}
                    >
                      {isPercent ? s.label : `${s.label} · $${val}`}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="signal-label">Adresse email de notification</label>
            <input
              type="email"
              value={contactValue}
              onChange={e => {
                setContactValue(e.target.value)
                if (submitted) setErrors(v => ({ ...v, contactValue: '' }))
              }}
              className={`signal-input ${errors.contactValue ? 'border-warn/60' : ''}`}
              placeholder="vous@example.com"
            />
            {errors.contactValue && <p className="signal-error">{errors.contactValue}</p>}
          </div>

          {/* Note */}
          <div>
            <label className="signal-label">Note personnelle (optionnel)</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="signal-input"
              placeholder="ex : Seuil de prise de profit"
              maxLength={80}
            />
          </div>

          {/* Preview */}
          {selectedAsset && targetValue && !isNaN(parseFloat(targetValue)) && (
            <div className="bg-surface2 border border-white/[0.07] px-4 py-3 flex items-center gap-3">
              <span className={`text-lg ${condition === 'above' || condition === 'change_up' ? 'text-accent' : 'text-warn'}`}>
                {conditionIcon(condition)}
              </span>
              <span className="font-mono text-[12px] text-muted">
                Alerte quand <span className="text-text font-bold">{selectedAsset.symbol}</span>{' '}
                {conditionLabel(condition).toLowerCase()}{' '}
                <span className="text-accent font-bold">
                  {isPercent ? `${targetValue}%` : `$${targetValue}`}
                </span>
              </span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="signal-btn-ghost flex-none w-auto px-6">
              Annuler
            </button>
            <button type="submit" className="signal-btn-primary flex-1" disabled={availableAssets.length === 0}>
              Créer l'alerte →
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Alert card ───────────────────────────────────────────────────
function AlertCard({
  alert, currentPrice, onDelete, onPause, onResume,
}: {
  alert: Alert; currentPrice: number | null; onDelete: () => void; onPause: () => void; onResume: () => void
}) {
  const up = alert.condition === 'above' || alert.condition === 'change_up'
  const triggered = currentPrice !== null && isTriggered(alert, currentPrice)

  const distancePct = currentPrice && !alert.condition.startsWith('change')
    ? ((alert.targetValue - currentPrice) / currentPrice) * 100
    : null

  const progressPct = distancePct !== null
    ? Math.min(100, Math.max(0, 100 - Math.abs(distancePct) * 4))
    : null

  return (
    <div className={`bg-surface border transition-all ${
      alert.status === 'triggered' ? 'border-accent/40 bg-accent/5'
      : alert.status === 'paused'   ? 'border-white/[0.04] opacity-60'
      : triggered                    ? 'border-warn/40 bg-warn/5'
      : 'border-white/[0.07] hover:border-white/[0.12]'
    }`}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.07]">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${
            alert.status === 'triggered' ? 'bg-accent animate-pulse'
            : alert.status === 'paused' ? 'bg-muted'
            : triggered ? 'bg-warn animate-pulse'
            : 'bg-accent/60'
          }`} />
          <span className="font-display font-bold text-sm tracking-tight">{alert.assetSymbol}</span>
          <span className="font-mono text-[11px] text-muted">{alert.assetName}</span>
          <span className="font-mono text-[9px] text-muted/60 border border-muted/20 px-1.5 py-0.5">
            {alert.assetType === 'crypto' ? 'CRYPTO' : 'ACTION'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {alert.status === 'active' && (
            <button onClick={onPause} className="font-mono text-[10px] text-muted hover:text-warn border border-white/[0.07] px-2 py-1 hover:border-warn/40 transition-all">
              Pause
            </button>
          )}
          {alert.status === 'paused' && (
            <button onClick={onResume} className="font-mono text-[10px] text-muted hover:text-accent border border-white/[0.07] px-2 py-1 hover:border-accent/40 transition-all">
              Reprendre
            </button>
          )}
          <button onClick={onDelete} className="font-mono text-[10px] text-muted hover:text-warn border border-white/[0.07] px-2 py-1 hover:border-warn/40 transition-all">
            ✕
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className={`flex items-center gap-2 font-display font-bold text-base ${up ? 'text-accent' : 'text-warn'}`}>
            <span>{conditionIcon(alert.condition)}</span>
            <span>{conditionLabel(alert.condition)}</span>
            <span className="font-mono font-normal text-sm">
              {alert.condition.startsWith('change') ? `${alert.targetValue}%` : formatPrice(alert.targetValue)}
            </span>
          </div>
          {alert.note && <div className="font-mono text-[11px] text-muted mt-1 italic">"{alert.note}"</div>}
          <div className="flex items-center gap-3 mt-2">
            <span className="font-mono text-[10px] text-muted">✉ {alert.contactValue}</span>
            <span className="font-mono text-[10px] text-muted/40">
              {new Date(alert.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
            </span>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          {currentPrice !== null ? (
            <>
              <div className="font-mono text-sm text-text">{formatPrice(currentPrice)}</div>
              {distancePct !== null && (
                <div className={`font-mono text-[11px] mt-0.5 ${Math.abs(distancePct) < 3 ? 'text-warn' : 'text-muted'}`}>
                  {distancePct >= 0 ? '+' : ''}{distancePct.toFixed(2)}% de la cible
                </div>
              )}
            </>
          ) : (
            <div className="w-16 h-3 bg-surface2 animate-pulse rounded" />
          )}
          {alert.status === 'triggered' && (
            <div className="font-mono text-[10px] text-accent mt-1">✓ Déclenchée</div>
          )}
          {triggered && alert.status === 'active' && (
            <div className="font-mono text-[10px] text-warn mt-1 animate-pulse">⚡ Seuil atteint</div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {progressPct !== null && alert.status === 'active' && (
        <div className="px-5 pb-4">
          <div className="h-px bg-white/[0.05] relative overflow-hidden rounded-full">
            <div
              className={`absolute h-full left-0 transition-all duration-500 ${up ? 'bg-accent' : 'bg-warn'}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="font-mono text-[9px] text-muted">Prix actuel</span>
            <span className="font-mono text-[9px] text-muted">Cible</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────
const PLAN_MAX: Record<string, number> = { free: 3, pro: Infinity, expert: Infinity }

export default function AlertsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { assets, fetchPrices, getPriceFor } = useAssetsStore()
  const { alerts, init: initAlerts, deleteAlert, pauseAlert, resumeAlert, triggerAlert } = useAlertsStore()

  const checkAlerts = useCallback(async () => {
    const activeAlerts = alerts.filter(a => a.status === 'active')
    for (const alert of activeAlerts) {
      const price = getPriceFor(alert.assetId)
      if (price === null) continue
      if (isTriggered(alert, price)) {
        try {
          triggerAlert(alert.id)
          await fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alert, currentPrice: price }),
          })
        } catch (err) {
          console.error('[checkAlerts] notify failed:', err)
        }
      }
    }
  }, [alerts, getPriceFor, triggerAlert])

  useEffect(() => {
    const session = getSession()
    if (!session) { router.replace('/login'); return }
    setUser(session)
    initAlerts()
    fetchPrices()
    refreshRef.current = setInterval(() => {
      fetchPrices()
      checkAlerts()
    }, 60_000)
    return () => { if (refreshRef.current) clearInterval(refreshRef.current) }
  }, [router, initAlerts, fetchPrices])

  useEffect(() => { checkAlerts() }, [assets])

  function handleLogout() { logout(); router.push('/login') }

  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 4000)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-6 h-6 border border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const userAlerts = alerts.filter(a => a.userId === user.id)
  const activeAlerts = userAlerts.filter(a => a.status === 'active')
  const maxAlerts = PLAN_MAX[user.plan]
  const canCreate = activeAlerts.length < maxAlerts

  return (
    <div className="min-h-screen bg-bg">
      <div className="fixed inset-0 pointer-events-none opacity-30" style={{
        backgroundImage: 'linear-gradient(rgba(0,229,160,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,160,0.03) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      <Sidebar user={user} onLogout={handleLogout} />

      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-accent text-bg font-display font-bold text-sm tracking-wider uppercase px-5 py-3 flex items-center gap-3 shadow-[0_20px_40px_rgba(0,229,160,0.3)] animate-slide-up">
          <span>✓</span>{toastMsg}
        </div>
      )}

      <main className="ml-64 relative z-10">
        <div className="flex items-center justify-between px-10 py-5 border-b border-white/[0.07] bg-surface/50 backdrop-blur-sm sticky top-0 z-10">
          <div>
            <div className="font-mono text-[11px] text-muted tracking-[0.15em] uppercase mb-0.5">Surveillance</div>
            <h1 className="font-display font-bold text-xl tracking-tight flex items-center gap-3">
              Mes alertes
              {activeAlerts.length > 0 && (
                <span className="font-mono text-[11px] text-accent border border-accent/30 px-2 py-0.5">
                  {activeAlerts.length}{maxAlerts !== Infinity ? `/${maxAlerts}` : ''} actives
                </span>
              )}
            </h1>
          </div>
          <button
            onClick={() => canCreate ? setShowCreate(true) : showToast('Limite atteinte — passez à Pro')}
            className={`font-display font-bold text-[13px] tracking-[0.1em] uppercase px-5 py-2.5 transition-all clip-btn ${
              canCreate ? 'text-bg bg-accent hover:bg-[#00ffc2]' : 'text-muted border border-white/[0.07] cursor-not-allowed'
            }`}
          >
            + Nouvelle alerte
          </button>
        </div>

        <div className="p-10">
          {user.plan === 'free' && (
            <div className="mb-6 flex items-center justify-between bg-surface border border-white/[0.07] px-5 py-4">
              <div className="flex items-center gap-4">
                <div>
                  <div className="font-mono text-[10px] text-muted tracking-widest uppercase mb-1">Quota</div>
                  <div className="w-40 h-1.5 bg-white/[0.07] rounded-full overflow-hidden">
                    <div className="h-full bg-accent transition-all rounded-full" style={{ width: `${Math.min((activeAlerts.length / 3) * 100, 100)}%` }} />
                  </div>
                </div>
                <span className="font-mono text-sm text-text">{activeAlerts.length} / 3 alertes</span>
              </div>
              <Link href="/pricing" className="font-mono text-[11px] text-accent hover:text-[#00ffc2] tracking-wider transition-colors">
                Passer à Pro — illimité →
              </Link>
            </div>
          )}

          {assets.length === 0 && (
            <div className="mb-6 flex items-center gap-3 bg-surface border border-white/[0.07] px-4 py-3">
              <div className="w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <span className="font-mono text-[12px] text-muted">Chargement des prix en temps réel…</span>
            </div>
          )}

          {userAlerts.length === 0 ? (
            <div className="border border-dashed border-white/[0.07] flex flex-col items-center justify-center py-24 gap-5">
              <div className="text-5xl opacity-20">🔔</div>
              <div className="text-center">
                <h3 className="font-display font-bold text-lg mb-2">Aucune alerte</h3>
                <p className="font-mono text-[13px] text-muted max-w-xs text-center leading-relaxed">
                  Créez votre première alerte pour être notifié dès qu'un actif atteint votre cible.
                </p>
              </div>
              <button onClick={() => setShowCreate(true)} className="signal-btn-primary w-auto px-8 mt-2">
                + Créer une alerte
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {userAlerts
                .sort((a, b) => {
                  const order = { triggered: 0, active: 1, paused: 2 }
                  return order[a.status] - order[b.status]
                })
                .map(alert => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    currentPrice={getPriceFor(alert.assetId)}
                    onDelete={() => { deleteAlert(alert.id); showToast('Alerte supprimée') }}
                    onPause={() => { pauseAlert(alert.id); showToast('Alerte mise en pause') }}
                    onResume={() => { resumeAlert(alert.id); showToast('Alerte relancée') }}
                  />
                ))}
            </div>
          )}

          {userAlerts.length > 0 && (
            <p className="font-mono text-[11px] text-muted/50 mt-6 text-center">
              Vérification automatique toutes les 60 secondes · Notifications via Resend
            </p>
          )}
        </div>
      </main>

      {showCreate && (
        <CreateAlertModal
          user={user}
          assets={assets}
          onClose={() => setShowCreate(false)}
          onCreated={alert => {
            setShowCreate(false)
            showToast(`Alerte ${alert.assetSymbol} créée !`)
          }}
        />
      )}

      <style jsx global>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }
        @keyframes slide-up { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .animate-slide-up{animation:slide-up .2s ease-out}
        .signal-label{display:block;font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#5a6a7a;margin-bottom:8px}
        .signal-input{width:100%;background:#0e1419;border:1px solid rgba(255,255,255,.07);color:#e8edf2;font-family:'IBM Plex Mono',monospace;font-size:14px;padding:12px 16px;outline:none;transition:border-color .2s}
        .signal-input:focus{border-color:#00e5a0}
        .signal-error{font-family:'IBM Plex Mono',monospace;font-size:11px;color:#ff6b35;margin-top:6px}
        .signal-btn-primary{display:block;width:100%;background:#00e5a0;color:#080c10;font-family:inherit;font-weight:700;font-size:12px;letter-spacing:.1em;text-transform:uppercase;padding:14px 28px;border:none;cursor:pointer;transition:background .2s;clip-path:polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%)}
        .signal-btn-primary:hover{background:#00ffc2}
        .signal-btn-primary:disabled{opacity:.4;cursor:not-allowed}
        .signal-btn-ghost{display:block;width:100%;background:transparent;border:1px solid rgba(255,255,255,.07);color:#5a6a7a;font-family:inherit;font-weight:600;font-size:12px;letter-spacing:.1em;text-transform:uppercase;padding:14px 28px;cursor:pointer;transition:all .2s;clip-path:polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%)}
        .signal-btn-ghost:hover{border-color:#00e5a0;color:#00e5a0}
        select.signal-input option{background:#0e1419}
        .clip-btn{clip-path:polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%)}
      `}</style>
    </div>
  )
}
