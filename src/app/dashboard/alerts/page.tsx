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

// ─── Sidebar ────────────────────────────────────────────────────
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
          { icon: '📊', label: 'Dashboard',  href: '/dashboard' },
          { icon: '🔔', label: 'Mes alertes', href: '/dashboard/alerts', active: true, badge: activeCount || null },
          { icon: '📈', label: 'Mes actifs',  href: '/dashboard/assets' },
          { icon: '⚙️', label: 'Paramètres',  href: '/dashboard/settings' },
        ].map(item => (
          <Link key={item.label} href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 mb-1 font-display font-semibold text-sm tracking-wide transition-all ${
              item.active ? 'bg-accent/10 text-accent border-l-2 border-accent pl-[10px]' : 'text-muted hover:text-text hover:bg-surface2'
            }`}>
            <span>{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.badge ? (
              <span className="bg-accent text-bg font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-sm">{item.badge}</span>
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

// ─── Create alert modal ──────────────────────────────────────────
function CreateAlertModal({
  user,
  assets,
  onClose,
  onCreated,
}: {
  user: User
  assets: Asset[]
  onClose: () => void
  onCreated: (alert: Alert) => void
}) {
  const { createAlert } = useAlertsStore()
  const watchedAssets = assets.filter(a => a.isWatched)
  const allAssets = assets.filter(a => a.price !== null)

  const [form, setForm] = useState<{
    assetId: string
    condition: AlertCondition
    targetValue: string
    channel: 'email'
    contactValue: string
    note: string
  }>({
    assetId: watchedAssets[0]?.id ?? allAssets[0]?.id ?? '',
    condition: 'above',
    targetValue: '',
    channel: 'email',
    contactValue: user.email,
    note: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const selectedAsset = allAssets.find(a => a.id === form.assetId)
  const isPercentCondition = form.condition === 'change_up' || form.condition === 'change_down'

  function validate() {
    const e: Record<string, string> = {}
    if (!form.assetId) e.assetId = 'Choisissez un actif'
    const val = parseFloat(form.targetValue)
    if (isNaN(val) || val <= 0) e.targetValue = 'Valeur invalide'
    if (!form.contactValue) e.contactValue = 'Email requis'
    else if (!/\S+@\S+\.\S+/.test(form.contactValue)) e.contactValue = 'Email invalide'
    return e
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    if (!selectedAsset) return

    const input: CreateAlertInput = {
      userId: user.id,
      assetId: selectedAsset.id,
      assetSymbol: selectedAsset.symbol,
      assetName: selectedAsset.name,
      assetType: selectedAsset.type,
      condition: form.condition,
      targetValue: parseFloat(form.targetValue),
      channel: form.channel,
      contactValue: form.contactValue.toLowerCase().trim(),
      note: form.note,
    }
    const alert = createAlert(input)
    onCreated(alert)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm" />
      <div
        className="relative bg-surface border border-white/[0.07] w-full max-w-lg animate-slide-up max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.07] sticky top-0 bg-surface z-10">
          <div>
            <div className="font-mono text-[10px] text-accent tracking-[0.15em] uppercase mb-0.5">Nouvelle alerte</div>
            <h2 className="font-display font-bold text-lg tracking-tight">Créer une alerte de prix</h2>
          </div>
          <button onClick={onClose} className="font-mono text-[18px] text-muted hover:text-text px-2">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* Asset selector */}
          <div>
            <label className="signal-label">Actif à surveiller</label>
            <select
              value={form.assetId}
              onChange={e => setForm(f => ({ ...f, assetId: e.target.value }))}
              className="signal-input"
            >
              {watchedAssets.length > 0 && (
                <optgroup label="★ Mes actifs suivis">
                  {watchedAssets.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.symbol} — {a.name} ({formatPrice(a.price, a.symbol)})
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Tous les actifs">
                {allAssets.filter(a => !a.isWatched).map(a => (
                  <option key={a.id} value={a.id}>
                    {a.symbol} — {a.name} ({formatPrice(a.price, a.symbol)})
                  </option>
                ))}
              </optgroup>
            </select>
            {errors.assetId && <p className="signal-error">{errors.assetId}</p>}
            {selectedAsset && (
              <p className="font-mono text-[11px] text-muted mt-1.5">
                Prix actuel : <span className="text-accent">{formatPrice(selectedAsset.price, selectedAsset.symbol)}</span>
              </p>
            )}
          </div>

          {/* Condition */}
          <div>
            <label className="signal-label">Condition</label>
            <div className="grid grid-cols-2 gap-2">
              {(['above', 'below', 'change_up', 'change_down'] as AlertCondition[]).map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, condition: c }))}
                  className={`flex items-center gap-2 px-4 py-3 border font-mono text-[12px] tracking-wide transition-all text-left ${
                    form.condition === c
                      ? c === 'above' || c === 'change_up'
                        ? 'border-accent text-accent bg-accent/10'
                        : 'border-warn text-warn bg-warn/10'
                      : 'border-white/[0.07] text-muted hover:border-white/20'
                  }`}
                >
                  <span>{conditionIcon(c)}</span>
                  <span>{conditionLabel(c)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Target value */}
          <div>
            <label className="signal-label">
              {isPercentCondition ? 'Variation (%)' : 'Prix cible (USD)'}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-muted text-sm">
                {isPercentCondition ? '%' : '$'}
              </span>
              <input
                type="number"
                step="any"
                min="0"
                placeholder={isPercentCondition ? 'ex: 5' : selectedAsset ? `ex: ${(selectedAsset.price ?? 0 * 1.05).toFixed(2)}` : '0.00'}
                value={form.targetValue}
                onChange={e => setForm(f => ({ ...f, targetValue: e.target.value }))}
                className={`signal-input pl-8 ${errors.targetValue ? 'border-warn/60' : ''}`}
              />
            </div>
            {errors.targetValue && <p className="signal-error">{errors.targetValue}</p>}
            {/* Smart suggestion */}
            {selectedAsset?.price && !isPercentCondition && (
              <div className="flex gap-2 mt-2">
                {[0.95, 1.05, 1.10].map(mult => {
                  const val = (selectedAsset.price! * mult).toFixed(2)
                  const label = mult < 1 ? `-${((1 - mult) * 100).toFixed(0)}%` : `+${((mult - 1) * 100).toFixed(0)}%`
                  return (
                    <button
                      key={mult}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, targetValue: val }))}
                      className="font-mono text-[10px] border border-white/[0.07] px-2 py-1 text-muted hover:border-accent hover:text-accent transition-all"
                    >
                      {label} · ${val}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Channel — email only for MVP */}
          <div>
            <label className="signal-label">Canal de notification</label>
            <div className="flex items-center gap-3 bg-surface2 border border-white/[0.07] px-4 py-3">
              <span className="text-accent text-lg">✉</span>
              <div>
                <div className="font-display font-semibold text-sm">Email</div>
                <div className="font-mono text-[11px] text-muted">Notification instantanée par email</div>
              </div>
              <div className="ml-auto w-2 h-2 rounded-full bg-accent" />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="signal-label">Adresse email</label>
            <input
              type="email"
              value={form.contactValue}
              onChange={e => setForm(f => ({ ...f, contactValue: e.target.value }))}
              className={`signal-input ${errors.contactValue ? 'border-warn/60' : ''}`}
              placeholder="vous@example.com"
            />
            {errors.contactValue && <p className="signal-error">{errors.contactValue}</p>}
          </div>

          {/* Note */}
          <div>
            <label className="signal-label">Note (optionnel)</label>
            <input
              type="text"
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              className="signal-input"
              placeholder="ex: Seuil de prise de profit"
              maxLength={80}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="signal-btn-ghost flex-none w-auto px-6">
              Annuler
            </button>
            <button type="submit" className="signal-btn-primary flex-1">
              Créer l'alerte →
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Alert card ──────────────────────────────────────────────────
function AlertCard({
  alert,
  currentPrice,
  onDelete,
  onPause,
  onResume,
}: {
  alert: Alert
  currentPrice: number | null
  onDelete: () => void
  onPause: () => void
  onResume: () => void
}) {
  const up = alert.condition === 'above' || alert.condition === 'change_up'
  const triggered = currentPrice !== null && isTriggered(alert, currentPrice)

  const distancePercent = currentPrice && alert.condition !== 'change_up' && alert.condition !== 'change_down'
    ? ((alert.targetValue - currentPrice) / currentPrice) * 100
    : null

  return (
    <div className={`bg-surface border transition-all ${
      alert.status === 'triggered'
        ? 'border-accent/40 bg-accent/5'
        : alert.status === 'paused'
        ? 'border-white/[0.04] opacity-50'
        : triggered
        ? 'border-accent/30'
        : 'border-white/[0.07]'
    }`}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.07]">
        <div className="flex items-center gap-2">
          {/* Status dot */}
          <div className={`w-1.5 h-1.5 rounded-full ${
            alert.status === 'triggered' ? 'bg-accent animate-pulse' :
            alert.status === 'paused' ? 'bg-muted' : 'bg-accent/60'
          }`} />
          <span className="font-display font-bold text-sm tracking-tight">{alert.assetSymbol}</span>
          <span className="font-mono text-[11px] text-muted">{alert.assetName}</span>
          {alert.assetType === 'crypto'
            ? <span className="font-mono text-[9px] text-muted/60 border border-muted/20 px-1.5 py-0.5">CRYPTO</span>
            : <span className="font-mono text-[9px] text-muted/60 border border-muted/20 px-1.5 py-0.5">ACTION</span>
          }
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
        {/* Condition */}
        <div className="flex-1">
          <div className={`flex items-center gap-2 font-display font-bold text-base ${up ? 'text-accent' : 'text-warn'}`}>
            <span>{conditionIcon(alert.condition)}</span>
            <span>{conditionLabel(alert.condition)}</span>
            <span className="font-mono font-normal text-sm">
              {alert.condition.startsWith('change') ? `${alert.targetValue}%` : formatPrice(alert.targetValue)}
            </span>
          </div>
          {alert.note && (
            <div className="font-mono text-[11px] text-muted mt-1">{alert.note}</div>
          )}
          <div className="flex items-center gap-3 mt-2">
            <span className="font-mono text-[10px] text-muted">✉ {alert.contactValue}</span>
          </div>
        </div>

        {/* Current price + distance */}
        <div className="text-right flex-shrink-0">
          {currentPrice !== null ? (
            <>
              <div className="font-mono text-sm text-text">{formatPrice(currentPrice)}</div>
              {distancePercent !== null && (
                <div className={`font-mono text-[11px] mt-0.5 ${Math.abs(distancePercent) < 3 ? 'text-warn' : 'text-muted'}`}>
                  {distancePercent >= 0 ? '+' : ''}{distancePercent.toFixed(2)}% à la cible
                </div>
              )}
            </>
          ) : (
            <div className="w-16 h-3 bg-surface2 animate-pulse rounded" />
          )}
          {alert.status === 'triggered' && (
            <div className="font-mono text-[10px] text-accent mt-1">✓ Déclenchée</div>
          )}
        </div>
      </div>

      {/* Progress bar to target (price alerts only) */}
      {currentPrice && distancePercent !== null && alert.status === 'active' && (
        <div className="px-5 pb-4">
          <div className="h-px bg-white/[0.05] relative overflow-hidden">
            <div
              className={`absolute h-full transition-all ${up ? 'bg-accent' : 'bg-warn'} left-0`}
              style={{ width: `${Math.min(100, Math.max(0, 100 - Math.abs(distancePercent) * 5))}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="font-mono text-[10px] text-muted">Prix actuel</span>
            <span className="font-mono text-[10px] text-muted">Cible</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────
const PLAN_MAX: Record<string, number> = { free: 3, pro: Infinity, expert: Infinity }

export default function AlertsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { assets, fetchPrices, getPriceFor } = useAssetsStore()
  const { alerts, init: initAlerts, deleteAlert, pauseAlert, resumeAlert } = useAlertsStore()

  // Check alerts client-side every 60s and send via API if triggered
  const checkAlerts = useCallback(async () => {
    const activeAlerts = alerts.filter(a => a.status === 'active')
    for (const alert of activeAlerts) {
      const price = getPriceFor(alert.assetId)
      if (price === null) continue
      if (isTriggered(alert, price)) {
        try {
          await fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alert, currentPrice: price }),
          })
          // Mark as triggered in store
          useAlertsStore.getState().pauseAlert(alert.id)  // pause to avoid re-trigger spam
        } catch (err) {
          console.error('[checkAlerts] notify failed:', err)
        }
      }
    }
  }, [alerts, getPriceFor])

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

  // Re-check alerts whenever assets update
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
        {/* Topbar */}
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
              canCreate
                ? 'text-bg bg-accent hover:bg-[#00ffc2]'
                : 'text-muted border border-white/[0.07] cursor-not-allowed'
            }`}
          >
            + Nouvelle alerte
          </button>
        </div>

        <div className="p-10">
          {/* Plan quota */}
          {user.plan === 'free' && (
            <div className="mb-6 flex items-center justify-between bg-surface border border-white/[0.07] px-5 py-4">
              <div className="flex items-center gap-4">
                <div>
                  <div className="font-mono text-[10px] text-muted tracking-widest uppercase mb-1">Quota alertes</div>
                  <div className="w-40 h-1 bg-white/[0.07]">
                    <div className="h-full bg-accent transition-all" style={{ width: `${Math.min((activeAlerts.length / 3) * 100, 100)}%` }} />
                  </div>
                </div>
                <span className="font-mono text-sm text-text">{activeAlerts.length} / 3</span>
              </div>
              <Link href="/pricing" className="font-mono text-[11px] text-accent hover:text-[#00ffc2] tracking-wider transition-colors">
                Passer à Pro — illimité →
              </Link>
            </div>
          )}

          {/* No assets loaded yet warning */}
          {assets.length === 0 && (
            <div className="mb-6 flex items-center gap-3 bg-surface border border-white/[0.07] px-4 py-3">
              <div className="w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <span className="font-mono text-[12px] text-muted">Chargement des prix en temps réel…</span>
            </div>
          )}

          {/* Empty state */}
          {userAlerts.length === 0 ? (
            <div className="border border-dashed border-white/[0.07] flex flex-col items-center justify-center py-24 gap-5">
              <div className="text-5xl opacity-20">🔔</div>
              <div className="text-center">
                <h3 className="font-display font-bold text-lg mb-2">Aucune alerte</h3>
                <p className="font-mono text-[13px] text-muted max-w-xs text-center leading-relaxed">
                  Créez votre première alerte pour être notifié dès qu'un actif atteint votre cible.
                </p>
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="signal-btn-primary w-auto px-8 mt-2"
              >
                + Créer une alerte
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Triggered first */}
              {userAlerts.filter(a => a.status === 'triggered').length > 0 && (
                <div className="font-mono text-[10px] text-accent tracking-[0.15em] uppercase mb-1">
                  ✓ Déclenchées
                </div>
              )}
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
                    onDelete={() => {
                      deleteAlert(alert.id)
                      showToast('Alerte supprimée')
                    }}
                    onPause={() => {
                      pauseAlert(alert.id)
                      showToast('Alerte mise en pause')
                    }}
                    onResume={() => {
                      resumeAlert(alert.id)
                      showToast('Alerte relancée')
                    }}
                  />
                ))}
            </div>
          )}

          {/* Footer hint */}
          {userAlerts.length > 0 && (
            <p className="font-mono text-[11px] text-muted/50 mt-6 text-center">
              Vérification automatique toutes les 60 secondes · Notifications via Resend
            </p>
          )}
        </div>
      </main>

      {/* Create modal */}
      {showCreate && (
        <CreateAlertModal
          user={user}
          assets={assets}
          onClose={() => setShowCreate(false)}
          onCreated={(alert) => {
            setShowCreate(false)
            showToast(`Alerte ${alert.assetSymbol} créée !`)
          }}
        />
      )}

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.2s ease-out; }
        .signal-label {
          display: block;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #5a6a7a;
          margin-bottom: 8px;
        }
        .signal-input {
          width: 100%;
          background: #0e1419;
          border: 1px solid rgba(255,255,255,0.07);
          color: #e8edf2;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 14px;
          padding: 12px 16px;
          outline: none;
          transition: border-color 0.2s;
        }
        .signal-input:focus { border-color: #00e5a0; }
        .signal-error {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: #ff6b35;
          margin-top: 6px;
        }
        .signal-btn-primary {
          display: block;
          width: 100%;
          background: #00e5a0;
          color: #080c10;
          font-family: inherit;
          font-weight: 700;
          font-size: 12px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 14px 28px;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
          clip-path: polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%);
        }
        .signal-btn-primary:hover { background: #00ffc2; }
        .signal-btn-ghost {
          display: block;
          width: 100%;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.07);
          color: #5a6a7a;
          font-family: inherit;
          font-weight: 600;
          font-size: 12px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 14px 28px;
          cursor: pointer;
          transition: all 0.2s;
          clip-path: polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%);
        }
        .signal-btn-ghost:hover { border-color: #00e5a0; color: #00e5a0; }
        select.signal-input option { background: #0e1419; }
        .clip-btn { clip-path: polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%); }
      `}</style>
    </div>
  )
}
