'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { register, isAuthenticated } from '@/lib/auth'

const PLANS = [
  {
    id: 'free', name: 'Free', price: '0€',
    desc: '3 alertes · Email',
    border: 'border-white/[0.07]', active: 'border-white/20 bg-white/[0.02]',
  },
  {
    id: 'pro', name: 'Pro', price: '9€/mois',
    desc: 'Alertes illimitées · Multi-canaux',
    badge: 'Populaire',
    border: 'border-white/[0.07]', active: 'border-amber-500/60 bg-amber-500/5',
  },
  {
    id: 'expert', name: 'Expert', price: '29€/mois',
    desc: 'IA · News · API',
    border: 'border-white/[0.07]', active: 'border-blue-500/60 bg-blue-500/5',
  },
]

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', plan: 'free', terms: false })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [globalError, setGlobalError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  useEffect(() => { if (isAuthenticated()) router.replace('/dashboard') }, [router])

  function validateStep1() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Nom requis'
    if (!form.email) e.email = 'Email requis'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email invalide'
    if (!form.password) e.password = 'Mot de passe requis'
    else if (form.password.length < 8) e.password = 'Minimum 8 caractères'
    if (form.password !== form.confirm) e.confirm = 'Les mots de passe ne correspondent pas'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (step === 1) {
      const errs = validateStep1()
      if (Object.keys(errs).length) { setErrors(errs); return }
      setErrors({}); setStep(2); return
    }
    if (!form.terms) { setErrors({ terms: 'Vous devez accepter les CGU' }); return }
    setErrors({}); setGlobalError(''); setIsLoading(true)
    const result = await register(form.name, form.email, form.password)
    setIsLoading(false)
    if (result.success) router.push('/dashboard?welcome=1')
    else setGlobalError(result.error || 'Erreur lors de la création du compte.')
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-lg animate-slide-up">
        {/* Header */}
        <div className="mb-8">
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-amber-500 mb-3">
            — Étape {step} sur 2
          </div>
          <h1 className="font-display font-bold text-4xl tracking-tight leading-none mb-2">
            {step === 1 ? 'Créer un compte' : 'Choisir un plan'}
          </h1>
          <p className="font-mono text-sm text-muted">
            {step === 1 ? 'Commencez à surveiller vos marchés en moins d\'une minute.' : 'Commencez gratuitement, upgradez quand vous voulez.'}
          </p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2].map(s => (
            <div key={s} className={`h-0.5 flex-1 rounded-full transition-all ${s <= step ? 'bg-amber-500' : 'bg-white/[0.08]'}`} />
          ))}
        </div>

        {globalError && (
          <div className="mb-5 flex items-center gap-3 bg-down/10 border border-down/30 px-4 py-3 rounded-sm">
            <span className="text-down text-sm">⚠</span>
            <span className="font-mono text-[12px] text-down">{globalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {step === 1 ? (
            <>
              <div>
                <label className="pulse-label">Nom complet</label>
                <input type="text" placeholder="Jean Dupont" className={`pulse-input ${errors.name ? 'border-down/50' : ''}`}
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                {errors.name && <p className="pulse-error">{errors.name}</p>}
              </div>
              <div>
                <label className="pulse-label">Email</label>
                <input type="email" placeholder="vous@example.com" className={`pulse-input ${errors.email ? 'border-down/50' : ''}`}
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                {errors.email && <p className="pulse-error">{errors.email}</p>}
              </div>
              <div>
                <label className="pulse-label">Mot de passe</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} placeholder="Minimum 8 caractères"
                    className={`pulse-input pr-12 ${errors.password ? 'border-down/50' : ''}`}
                    value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] text-muted hover:text-text2">
                    {showPw ? 'CACHER' : 'VOIR'}
                  </button>
                </div>
                {errors.password && <p className="pulse-error">{errors.password}</p>}
              </div>
              <div>
                <label className="pulse-label">Confirmer le mot de passe</label>
                <input type="password" placeholder="••••••••"
                  className={`pulse-input ${errors.confirm ? 'border-down/50' : ''}`}
                  value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} />
                {errors.confirm && <p className="pulse-error">{errors.confirm}</p>}
              </div>
              <button type="submit" className="pulse-btn-primary mt-2">Continuer →</button>
            </>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                {PLANS.map(plan => (
                  <button key={plan.id} type="button" onClick={() => setForm(f => ({ ...f, plan: plan.id }))}
                    className={`relative border p-4 text-left transition-all rounded-sm ${form.plan === plan.id ? plan.active : plan.border + ' hover:border-white/20'}`}>
                    {plan.badge && (
                      <span className="absolute -top-2 left-3 bg-amber-500 text-black font-mono text-[9px] font-bold px-2 py-0.5">
                        {plan.badge}
                      </span>
                    )}
                    <div className="font-display font-bold text-base mb-1">{plan.name}</div>
                    <div className="font-mono text-[11px] text-amber-400 font-bold mb-1.5">{plan.price}</div>
                    <div className="font-mono text-[10px] text-muted leading-relaxed">{plan.desc}</div>
                  </button>
                ))}
              </div>

              <label className={`flex items-start gap-3 cursor-pointer group bg-surface2 p-4 rounded-sm border ${errors.terms ? 'border-down/30' : 'border-white/[0.05]'}`}>
                <input type="checkbox" className="mt-0.5 w-4 h-4 accent-amber-500 flex-shrink-0"
                  checked={form.terms} onChange={e => setForm(f => ({ ...f, terms: e.target.checked }))} />
                <span className="font-mono text-[11px] text-muted group-hover:text-text2 transition-colors leading-relaxed">
                  J'accepte les{' '}
                  <Link href="#" className="text-amber-400 hover:text-amber-300">Conditions Générales d'Utilisation</Link>
                  {' '}et la{' '}
                  <Link href="#" className="text-amber-400 hover:text-amber-300">Politique de Confidentialité</Link>
                </span>
              </label>
              {errors.terms && <p className="pulse-error">{errors.terms}</p>}

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="pulse-btn-ghost flex-none w-auto px-8">
                  ← Retour
                </button>
                <button type="submit" disabled={isLoading} className="pulse-btn-primary flex-1">
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-3">
                      <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin inline-block" />
                      Création…
                    </span>
                  ) : 'Créer mon compte →'}
                </button>
              </div>
            </>
          )}
        </form>

        {step === 1 && (
          <div className="mt-6 pt-5 border-t border-white/[0.06] text-center">
            <p className="font-mono text-[12px] text-muted">
              Déjà un compte ?{' '}
              <Link href="/login" className="text-amber-400 hover:text-amber-300 transition-colors">Se connecter</Link>
            </p>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
