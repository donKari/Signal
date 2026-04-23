'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSession, logout } from '@/lib/auth'
import type { User } from '@/lib/auth'
import { useAlertsStore } from '@/lib/alerts'
import Sidebar from '@/components/Sidebar'

// ─── Section wrapper ──────────────────────────────────────────────
function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-white/[0.06] mb-4 rounded-sm">
      <div className="px-6 py-4 border-b border-white/[0.05]">
        <div className="font-display font-bold text-base tracking-tight">{title}</div>
        {sub && <div className="font-mono text-[11px] text-muted mt-0.5">{sub}</div>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

// ─── Setting Row ──────────────────────────────────────────────────
function SettingRow({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-white/[0.04] last:border-0">
      <div>
        <div className="font-mono text-[13px] text-text">{label}</div>
        {sub && <div className="font-mono text-[11px] text-muted mt-0.5">{sub}</div>}
      </div>
      <div className="flex-shrink-0 ml-6">{children}</div>
    </div>
  )
}

// ─── Toggle ───────────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-10 h-5 rounded-full transition-all ${value ? 'bg-amber-500' : 'bg-surface3'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${value ? 'left-5' : 'left-0.5'}`} />
    </button>
  )
}

// ─── Main ─────────────────────────────────────────────────────────
export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const { alerts } = useAlertsStore()

  // Notification preferences (UI only for MVP)
  const [notifEmail, setNotifEmail]       = useState(true)
  const [notifSms, setNotifSms]           = useState(false)
  const [notifPush, setNotifPush]         = useState(false)
  const [notifTelegram, setNotifTelegram] = useState(false)
  const [notifDiscord, setNotifDiscord]   = useState(false)

  // Profile form
  const [displayName, setDisplayName]   = useState('')
  const [currentPw, setCurrentPw]       = useState('')
  const [newPw, setNewPw]               = useState('')
  const [confirmPw, setConfirmPw]       = useState('')
  const [showPw, setShowPw]             = useState(false)

  // Toast
  const [toast, setToast] = useState('')
  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3500) }

  useEffect(() => {
    const session = getSession()
    if (!session) { router.replace('/login'); return }
    setUser(session)
    setDisplayName(session.name)
  }, [router])

  function handleSaveName(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !displayName.trim()) return
    const users = JSON.parse(localStorage.getItem('pulse_users') || '{}')
    if (users[user.email]) { users[user.email].name = displayName.trim(); localStorage.setItem('pulse_users', JSON.stringify(users)) }
    const updated = { ...user, name: displayName.trim() }
    sessionStorage.setItem('pulse_session', JSON.stringify(updated))
    setUser(updated)
    showToast('Nom mis à jour')
  }

  function handleSavePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    if (newPw.length < 8) { showToast('Le mot de passe doit faire au moins 8 caractères'); return }
    if (newPw !== confirmPw) { showToast('Les mots de passe ne correspondent pas'); return }
    showToast('Mot de passe mis à jour')
    setCurrentPw(''); setNewPw(''); setConfirmPw('')
  }

  function handleDeleteAccount() {
    if (!user) return
    if (!confirm('Supprimer votre compte Pulse ? Cette action est irréversible.')) return
    const users = JSON.parse(localStorage.getItem('pulse_users') || '{}')
    delete users[user.email]
    localStorage.setItem('pulse_users', JSON.stringify(users))
    localStorage.removeItem('pulse_alerts')
    logout()
    router.push('/register')
  }

  const activeAlerts = alerts.filter(a => a.userId === user?.id && a.status === 'active')

  if (!user) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar user={user} activeNav="settings" activeAlertsCount={activeAlerts.length}
        onLogout={() => { logout(); router.push('/login') }} />

      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-amber-500 text-black font-bold text-sm tracking-wide uppercase px-5 py-3 flex items-center gap-3 shadow-[0_20px_60px_rgba(245,158,11,0.4)] animate-slide-up rounded-sm">
          <span>✓</span> {toast}
        </div>
      )}

      <main className="ml-[220px] relative z-10">
        {/* Topbar */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-white/[0.05] bg-surface/60 backdrop-blur-sm sticky top-0 z-10">
          <div>
            <div className="font-mono text-[10px] text-muted tracking-widest uppercase mb-0.5">Compte</div>
            <h1 className="font-display font-bold text-xl tracking-tight">Paramètres</h1>
          </div>
          <div className="font-mono text-[11px] text-muted">
            Plan actuel : <span className={user.plan === 'free' ? 'text-muted' : 'text-amber-400 font-bold'}>{user.plan}</span>
          </div>
        </div>

        <div className="p-6 max-w-2xl">

          {/* Profile */}
          <Section title="Profil" sub="Vos informations personnelles">
            <SettingRow label="Email" sub="Non modifiable — utilisé pour la connexion">
              <span className="font-mono text-[12px] text-muted">{user.email}</span>
            </SettingRow>
            <div className="pt-3.5">
              <form onSubmit={handleSaveName} className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="pulse-label">Nom affiché</label>
                  <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                    className="pulse-input rounded-sm" placeholder="Votre nom" />
                </div>
                <button type="submit" className="bg-amber-500 text-black font-bold text-[12px] tracking-widest uppercase px-5 py-3 hover:bg-amber-400 transition-all rounded-sm whitespace-nowrap">
                  Sauvegarder
                </button>
              </form>
            </div>
          </Section>

          {/* Password */}
          <Section title="Sécurité" sub="Changez votre mot de passe">
            <form onSubmit={handleSavePassword} className="flex flex-col gap-4">
              <div>
                <label className="pulse-label">Mot de passe actuel</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                    className="pulse-input pr-12 rounded-sm" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] text-muted hover:text-text2">
                    {showPw ? 'CACHER' : 'VOIR'}
                  </button>
                </div>
              </div>
              <div>
                <label className="pulse-label">Nouveau mot de passe</label>
                <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                  className="pulse-input rounded-sm" placeholder="8 caractères min." />
              </div>
              <div>
                <label className="pulse-label">Confirmer le nouveau mot de passe</label>
                <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                  className="pulse-input rounded-sm" placeholder="Répétez le mot de passe" />
              </div>
              <button type="submit" className="bg-amber-500 text-black font-bold text-[12px] tracking-widest uppercase px-5 py-3 hover:bg-amber-400 transition-all rounded-sm w-fit">
                Changer le mot de passe
              </button>
            </form>
          </Section>

          {/* Notifications */}
          <Section title="Notifications" sub="Canaux de réception de vos alertes">
            <SettingRow label="Email" sub="Toujours actif pour le plan Free">
              <Toggle value={notifEmail} onChange={setNotifEmail} />
            </SettingRow>
            <SettingRow label="SMS" sub={user.plan === 'free' ? 'Disponible sur Pro et Expert' : 'Notifications SMS'}>
              <Toggle value={user.plan !== 'free' && notifSms} onChange={v => user.plan !== 'free' ? setNotifSms(v) : router.push('/pricing')} />
            </SettingRow>
            <SettingRow label="Notifications push" sub="Dans votre navigateur">
              <Toggle value={notifPush} onChange={setNotifPush} />
            </SettingRow>
            <SettingRow label="Telegram" sub={user.plan === 'expert' ? 'Connectez votre compte' : 'Disponible sur Expert'}>
              <Toggle value={user.plan === 'expert' && notifTelegram} onChange={v => user.plan === 'expert' ? setNotifTelegram(v) : router.push('/pricing')} />
            </SettingRow>
            <SettingRow label="Discord" sub={user.plan === 'expert' ? 'Webhook personnalisable' : 'Disponible sur Expert'}>
              <Toggle value={user.plan === 'expert' && notifDiscord} onChange={v => user.plan === 'expert' ? setNotifDiscord(v) : router.push('/pricing')} />
            </SettingRow>
            {user.plan !== 'free' && (
              <button onClick={() => showToast('Préférences de notification sauvegardées')}
                className="mt-4 bg-amber-500 text-black font-bold text-[12px] tracking-widest uppercase px-5 py-3 hover:bg-amber-400 transition-all rounded-sm">
                Sauvegarder les préférences
              </button>
            )}
          </Section>

          {/* Plan */}
          <Section title="Abonnement" sub="Votre plan actuel et vos options">
            <SettingRow label="Plan actuel" sub={user.plan === 'free' ? '3 alertes max · Email uniquement' : user.plan === 'pro' ? 'Alertes illimitées · Multi-canaux' : 'Tout inclus · API · Support 24h'}>
              <span className={`font-mono text-[11px] tracking-widest uppercase font-bold px-2.5 py-1 rounded-full border ${
                user.plan === 'free' ? 'text-muted border-white/[0.08]' : user.plan === 'pro' ? 'text-amber-400 border-amber-500/30 bg-amber-500/8' : 'text-blue-400 border-blue-500/30 bg-blue-500/8'
              }`}>
                {user.plan}
              </span>
            </SettingRow>
            {user.plan !== 'expert' && (
              <div className="mt-4">
                <Link href="/pricing" className="inline-flex items-center gap-2 bg-amber-500 text-black font-bold text-[12px] tracking-widest uppercase px-5 py-3 hover:bg-amber-400 transition-all rounded-sm shadow-[0_8px_24px_rgba(245,158,11,0.2)]">
                  {user.plan === 'free' ? 'Passer à Pro — 9€/mois' : 'Passer à Expert — 29€/mois'} →
                </Link>
              </div>
            )}
          </Section>

          {/* API (Expert only) */}
          {user.plan === 'expert' && (
            <Section title="API Pulse" sub="Accès programmatique à vos alertes">
              <SettingRow label="Clé API" sub="Utilisez cette clé pour les webhooks entrants">
                <div className="flex items-center gap-2">
                  <code className="font-mono text-[11px] text-muted bg-surface2 px-3 py-1.5 rounded-sm border border-white/[0.05]">
                    pk_live_••••••••••••••••
                  </code>
                  <button onClick={() => showToast('Clé copiée !')} className="font-mono text-[10px] text-amber-400 hover:text-amber-300 border border-amber-500/30 px-2.5 py-1.5 rounded-sm transition-colors">
                    Copier
                  </button>
                </div>
              </SettingRow>
              <SettingRow label="Webhook URL" sub="Recevez les alertes en temps réel sur votre endpoint">
                <input type="url" className="pulse-input w-64 rounded-sm text-[11px]" placeholder="https://votre-serveur.com/webhook" />
              </SettingRow>
            </Section>
          )}

          {/* Danger zone */}
          <Section title="Zone de danger" sub="Actions irréversibles">
            <SettingRow label="Supprimer le compte" sub="Toutes vos alertes et données seront définitivement supprimées">
              <button onClick={handleDeleteAccount}
                className="font-mono text-[11px] text-down hover:bg-down/10 border border-down/30 hover:border-down/60 px-4 py-2 transition-all rounded-sm">
                Supprimer mon compte
              </button>
            </SettingRow>
          </Section>

          <p className="font-mono text-[10px] text-muted/40 text-center mt-6 pb-6">
            Pulse Financial Technologies · <a href="mailto:support@pulse.finance" className="hover:text-muted transition-colors">support@pulse.finance</a>
          </p>
        </div>
      </main>

      <style jsx global>{`
        @keyframes slide-up { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .animate-slide-up { animation: slide-up .25s ease-out; }
        .surface3 { background: #1a2130; }
        select option { background: #0b0f14; color: #f1f5f9; }
      `}</style>
    </div>
  )
}
