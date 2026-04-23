import Sidebar from '@/components/Sidebar'
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSession, logout } from '@/lib/auth'
import type { User } from '@/lib/auth'
import { useAlertsStore } from '@/lib/alerts'

) {
  const { alerts } = useAlertsStore()
  const activeCount = alerts.filter(a => a.status === 'active' && a.userId === user.id).length
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-surface border-r border-white/[0.06] flex flex-col z-20">
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-white/[0.06]">
        <div className="w-2 h-2 rounded-full bg-amber-500" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
        <span className="font-display font-extrabold text-lg tracking-[0.15em] uppercase text-amber-400">Pulse</span>
      </div>
      <div className="px-4 py-4 border-b border-white/[0.06]">
        <div className="bg-surface2 px-4 py-3">
          <div className="font-display font-bold text-sm text-text truncate">{user.name}</div>
          <div className="font-mono text-[11px] text-muted truncate mt-0.5">{user.email}</div>
          <div className={`font-mono text-[10px] tracking-[0.15em] uppercase mt-2 border px-2 py-0.5 w-fit ${
            user.plan === 'free' ? 'text-muted border-white/[0.08]' : 'text-amber-400 border-amber-500/30'
          }`}>Plan {user.plan}</div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4">
        <div className="font-mono text-[10px] text-muted tracking-[0.15em] uppercase px-3 mb-2">Navigation</div>
        {[
          { icon: '📊', label: 'Dashboard',   href: '/dashboard' },
          { icon: '🔔', label: 'Mes alertes', href: '/dashboard/alerts', badge: activeCount || null },
          { icon: '📈', label: 'Mes actifs',  href: '/dashboard/assets' },
          { icon: '⚙️', label: 'Paramètres',  href: '/dashboard/settings', active: true },
        ].map(item => (
          <Link key={item.label} href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 mb-1 font-display font-semibold text-sm tracking-wide transition-all ${
              (item as any).active ? 'bg-amber-500/8 text-amber-400 border-l-2 border-amber-500 pl-[10px]' : 'text-muted hover:text-text hover:bg-surface2'
            }`}>
            <span>{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {(item as any).badge ? (
              <span className="bg-amber-500 text-bg font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-sm">{(item as any).badge}</span>
            ) : null}
          </Link>
        ))}
      </nav>
      <div className="px-3 pb-4 border-t border-white/[0.06] pt-3">
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 font-display font-semibold text-sm text-muted hover:text-down transition-colors tracking-wide">
          <span>→</span><span>Déconnexion</span>
        </button>
      </div>
    </aside>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────
function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-white/[0.06] mb-4">
      <div className="px-6 py-4 border-b border-white/[0.06]">
        <div className="font-display font-bold text-base tracking-tight">{title}</div>
        {sub && <div className="font-mono text-[11px] text-muted mt-0.5">{sub}</div>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

// ─── Row de paramètre ─────────────────────────────────────────────
function SettingRow({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-white/[0.05] last:border-0">
      <div>
        <div className="font-mono text-[13px] text-text">{label}</div>
        {sub && <div className="font-mono text-[11px] text-muted mt-0.5">{sub}</div>}
      </div>
      <div className="flex-shrink-0 ml-6">{children}</div>
    </div>
  )
}

// ─── Toggle switch ────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-10 h-5 rounded-full transition-all ${value ? 'bg-amber-500' : 'bg-white/[0.1]'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${value ? 'left-5.5' : 'left-0.5'}`}
        style={{ left: value ? '22px' : '2px' }} />
    </button>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [toastMsg, setToastMsg] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  // Form state
  const [name,        setName]        = useState('')
  const [email,       setEmail]       = useState('')
  const [currentPwd,  setCurrentPwd]  = useState('')
  const [newPwd,      setNewPwd]      = useState('')
  const [confirmPwd,  setConfirmPwd]  = useState('')
  const [showPwds,    setShowPwds]    = useState(false)

  // Notification prefs (stored in localStorage)
  const [notifEmail,   setNotifEmail]   = useState(true)
  const [notifInstant, setNotifInstant] = useState(true)
  const [notifDigest,  setNotifDigest]  = useState(false)
  const [notifSound,   setNotifSound]   = useState(false)

  const { alerts, init: initAlerts } = useAlertsStore()

  useEffect(() => {
    const session = getSession()
    if (!session) { router.replace('/login'); return }
    setUser(session)
    setName(session.name)
    setEmail(session.email)
    initAlerts()

    // Load notif prefs
    try {
      const prefs = JSON.parse(localStorage.getItem('signal_notif_prefs') || '{}')
      if (prefs.email   !== undefined) setNotifEmail(prefs.email)
      if (prefs.instant !== undefined) setNotifInstant(prefs.instant)
      if (prefs.digest  !== undefined) setNotifDigest(prefs.digest)
      if (prefs.sound   !== undefined) setNotifSound(prefs.sound)
    } catch {}
  }, [router, initAlerts])

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToastMsg(msg); setToastType(type)
    setTimeout(() => setToastMsg(''), 4000)
  }

  function saveProfile() {
    if (!user) return
    if (!name.trim()) { showToast('Le nom ne peut pas être vide', 'error'); return }

    // Update session
    const users = JSON.parse(localStorage.getItem('signal_users') || '{}')
    const existing = users[user.email]
    if (existing) {
      existing.name = name.trim()
      localStorage.setItem('signal_users', JSON.stringify(users))
    }
    const updated = { ...user, name: name.trim() }
    sessionStorage.setItem('signal_session', JSON.stringify(updated))
    setUser(updated)
    showToast('Profil mis à jour')
  }

  function savePassword() {
    if (!user) return
    if (!currentPwd) { showToast('Entrez votre mot de passe actuel', 'error'); return }
    if (newPwd.length < 8) { showToast('Nouveau mot de passe trop court (8 caractères min.)', 'error'); return }
    if (newPwd !== confirmPwd) { showToast('Les mots de passe ne correspondent pas', 'error'); return }

    // Verify current password
    const users = JSON.parse(localStorage.getItem('signal_users') || '{}')
    const existing = users[user.email]
    function simpleHash(str: string) {
      let hash = 0
      for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); hash = (hash << 5) - hash + c; hash = hash & hash }
      return Math.abs(hash).toString(36) + str.length.toString(36)
    }
    if (!existing || existing.passwordHash !== simpleHash(currentPwd)) {
      showToast('Mot de passe actuel incorrect', 'error'); return
    }
    existing.passwordHash = simpleHash(newPwd)
    localStorage.setItem('signal_users', JSON.stringify(users))
    setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
    showToast('Mot de passe mis à jour')
  }

  function saveNotifPrefs() {
    localStorage.setItem('signal_notif_prefs', JSON.stringify({
      email: notifEmail, instant: notifInstant, digest: notifDigest, sound: notifSound,
    }))
    showToast('Préférences de notification sauvegardées')
  }

  function deleteAccount() {
    if (!confirm('Supprimer définitivement votre compte et toutes vos alertes ? Cette action est irréversible.')) return
    if (!user) return
    const users = JSON.parse(localStorage.getItem('signal_users') || '{}')
    delete users[user.email]
    localStorage.setItem('signal_users', JSON.stringify(users))
    localStorage.removeItem('signal_alerts')
    sessionStorage.removeItem('signal_session')
    router.replace('/login')
  }

  if (!user) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="w-6 h-6 border border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const userAlerts   = alerts.filter(a => a.userId === user.id)
  const activeAlerts = userAlerts.filter(a => a.status === 'active')
  const memberSince  = new Date(user.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

  const planFeatures = {
    free:   { label: 'Free',   color: 'text-muted border-white/[0.08]',      alerts: 3,         refresh: '5 min',   notif: 'Email' },
    pro:    { label: 'Pro',    color: 'text-amber-400 border-amber-500/30',     alerts: 'Illimité', refresh: '1 min',   notif: 'Email + SMS' },
    expert: { label: 'Expert', color: 'text-[#a78bfa] border-[#a78bfa]/30', alerts: 'Illimité', refresh: 'Temps réel', notif: 'Email + SMS + Webhook' },
  }
  const plan = planFeatures[user.plan]

  return (
    <div className="min-h-screen bg-bg">
      <div className="fixed inset-0 pointer-events-none opacity-30" style={{
        backgroundImage: 'linear-gradient(rgba(0,229,160,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,160,0.03) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      <Sidebar user={user} activeNav="settings" onLogout={() => { logout(); router.push('/login') }} />

      {toastMsg && (
        <div className={`fixed top-6 right-6 z-50 font-display font-bold text-sm tracking-wider uppercase px-5 py-3 flex items-center gap-3 animate-slide-up ${
          toastType === 'success' ? 'bg-amber-500 text-bg shadow-[0_20px_40px_rgba(0,229,160,0.3)]' : 'bg-down text-white shadow-[0_20px_40px_rgba(255,107,53,0.3)]'
        }`}>
          <span>{toastType === 'success' ? '✓' : '✕'}</span>{toastMsg}
        </div>
      )}

      <main className="ml-[220px] relative z-10">
        {/* Topbar */}
        <div className="flex items-center justify-between px-10 py-5 border-b border-white/[0.06] bg-surface/50 backdrop-blur-sm sticky top-0 z-10">
          <div>
            <div className="font-mono text-[11px] text-muted tracking-[0.15em] uppercase mb-0.5">Compte</div>
            <h1 className="font-display font-bold text-xl tracking-tight">Paramètres</h1>
          </div>
          <span className="font-mono text-[11px] text-muted">Membre depuis le {memberSince}</span>
        </div>

        <div className="p-8 max-w-3xl">

          {/* Plan actuel */}
          <Section title="Votre plan" sub="Gérez votre abonnement Signal">
            <div className="flex items-center justify-between p-4 bg-surface2 border border-white/[0.06] mb-4">
              <div className="flex items-center gap-4">
                <div className={`font-mono text-[11px] tracking-[0.15em] uppercase border px-3 py-1.5 font-bold ${plan.color}`}>
                  {plan.label}
                </div>
                <div>
                  <div className="font-mono text-[12px] text-text">{plan.alerts} alertes · Refresh {plan.refresh}</div>
                  <div className="font-mono text-[11px] text-muted mt-0.5">Notifications : {plan.notif}</div>
                </div>
              </div>
              {user.plan === 'free' && (
                <Link href="/pricing"
                  className="font-display font-bold text-[12px] tracking-[0.1em] uppercase text-black bg-amber-500 px-4 py-2 hover:bg-amber-400 transition-all">
                  Passer à Pro →
                </Link>
              )}
              {user.plan !== 'free' && (
                <span className="font-mono text-[11px] text-amber-400">Plan actif ✓</span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-px bg-white/[0.05]">
              {[
                { label: 'Alertes actives', value: activeAlerts.length },
                { label: 'Total alertes',   value: userAlerts.length },
                { label: 'Déclenchements',  value: userAlerts.filter(a => a.status === 'triggered').length },
              ].map(s => (
                <div key={s.label} className="bg-surface px-5 py-4 text-center">
                  <div className="font-display font-extrabold text-2xl text-amber-400">{s.value}</div>
                  <div className="font-mono text-[10px] text-muted tracking-widest uppercase mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* Profil */}
          <Section title="Profil" sub="Informations de votre compte">
            <div className="flex flex-col gap-4">
              <div>
                <label className="pulse-label">Nom affiché</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  className="pulse-input" placeholder="Votre nom" />
              </div>
              <div>
                <label className="pulse-label">Adresse email</label>
                <input type="email" value={email} disabled
                  className="pulse-input opacity-50 cursor-not-allowed"
                  title="L'email ne peut pas être modifié" />
                <p className="font-mono text-[10px] text-muted mt-1.5">L'email est lié à votre compte et ne peut pas être modifié.</p>
              </div>
              <div className="flex justify-end">
                <button onClick={saveProfile}
                  className="font-display font-bold text-[12px] tracking-[0.1em] uppercase text-black bg-amber-500 px-5 py-2.5 hover:bg-amber-400 transition-all">
                  Sauvegarder
                </button>
              </div>
            </div>
          </Section>

          {/* Mot de passe */}
          <Section title="Sécurité" sub="Modifiez votre mot de passe">
            <div className="flex flex-col gap-4">
              <div>
                <label className="pulse-label">Mot de passe actuel</label>
                <div className="relative">
                  <input type={showPwds ? 'text' : 'password'} value={currentPwd}
                    onChange={e => setCurrentPwd(e.target.value)}
                    className="pulse-input pr-12" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPwds(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[11px] text-muted hover:text-text transition-colors">
                    {showPwds ? 'cacher' : 'voir'}
                  </button>
                </div>
              </div>
              <div>
                <label className="pulse-label">Nouveau mot de passe</label>
                <input type={showPwds ? 'text' : 'password'} value={newPwd}
                  onChange={e => setNewPwd(e.target.value)}
                  className="pulse-input" placeholder="8 caractères min." />
              </div>
              <div>
                <label className="pulse-label">Confirmer le nouveau mot de passe</label>
                <input type={showPwds ? 'text' : 'password'} value={confirmPwd}
                  onChange={e => setConfirmPwd(e.target.value)}
                  className="pulse-input" placeholder="Répétez le mot de passe" />
              </div>
              {newPwd && confirmPwd && newPwd !== confirmPwd && (
                <p className="font-mono text-[11px] text-down">Les mots de passe ne correspondent pas</p>
              )}
              <div className="flex justify-end">
                <button onClick={savePassword}
                  className="font-display font-bold text-[12px] tracking-[0.1em] uppercase text-black bg-amber-500 px-5 py-2.5 hover:bg-amber-400 transition-all">
                  Changer le mot de passe
                </button>
              </div>
            </div>
          </Section>

          {/* Notifications */}
          <Section title="Notifications" sub="Contrôlez quand et comment vous êtes alerté">
            <SettingRow label="Notifications email" sub="Recevoir les alertes par email">
              <Toggle value={notifEmail} onChange={setNotifEmail} />
            </SettingRow>
            <SettingRow label="Alerte instantanée" sub="Notification dès le déclenchement">
              <Toggle value={notifInstant} onChange={setNotifInstant} />
            </SettingRow>
            <SettingRow label="Résumé quotidien" sub="Email récapitulatif chaque matin">
              <Toggle value={notifDigest} onChange={setNotifDigest} />
            </SettingRow>
            <SettingRow label="Son de notification" sub="Jouer un son lors d'un déclenchement">
              <Toggle value={notifSound} onChange={setNotifSound} />
            </SettingRow>
            <div className="flex justify-end mt-4">
              <button onClick={saveNotifPrefs}
                className="font-display font-bold text-[12px] tracking-[0.1em] uppercase text-black bg-amber-500 px-5 py-2.5 hover:bg-amber-400 transition-all">
                Sauvegarder les préférences
              </button>
            </div>
          </Section>

          {/* Danger zone */}
          <div className="bg-surface border border-down/20 mb-4">
            <div className="px-6 py-4 border-b border-down/20">
              <div className="font-display font-bold text-base tracking-tight text-down">Zone de danger</div>
              <div className="font-mono text-[11px] text-muted mt-0.5">Actions irréversibles</div>
            </div>
            <div className="p-6">
              <SettingRow label="Supprimer toutes les alertes" sub="Efface définitivement toutes vos alertes">
                <button
                  onClick={() => {
                    if (!confirm('Supprimer toutes vos alertes ?')) return
                    localStorage.removeItem('signal_alerts')
                    showToast('Toutes les alertes supprimées')
                  }}
                  className="font-mono text-[11px] text-down border border-down/30 px-3 py-1.5 hover:bg-down/10 transition-all">
                  Supprimer
                </button>
              </SettingRow>
              <SettingRow label="Supprimer le compte" sub="Supprime définitivement votre compte et vos données">
                <button onClick={deleteAccount}
                  className="font-mono text-[11px] text-down border border-down/30 px-3 py-1.5 hover:bg-down/10 transition-all">
                  Supprimer le compte
                </button>
              </SettingRow>
            </div>
          </div>

        </div>
      </main>

      <style jsx global>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }
        @keyframes slide-up { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .animate-slide-up{animation:slide-up .2s ease-out}
        .pulse-label{display:block;font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#5a6a7a;margin-bottom:8px}
        .pulse-input{width:100%;background:#0e1419;border:1px solid rgba(255,255,255,.07);color:#e8edf2;font-family:'IBM Plex Mono',monospace;font-size:14px;padding:12px 16px;outline:none;transition:border-color .2s}
        .pulse-input:focus{border-color:#f59e0b}
        .clip-btn{clip-path:polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%)}
      `}</style>
    </div>
  )
}
