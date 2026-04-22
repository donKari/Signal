'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { register, isAuthenticated } from '@/lib/auth'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '0€',
    desc: '3 alertes · Email uniquement',
    color: 'border-white/[0.07]',
    activeColor: 'border-muted',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '29€/mois',
    desc: 'Alertes illimitées · Multi-canaux',
    color: 'border-white/[0.07]',
    activeColor: 'border-accent',
    badge: 'Populaire',
  },
  {
    id: 'expert',
    name: 'Expert',
    price: '49€/mois',
    desc: 'Alertes IA · News · API',
    color: 'border-white/[0.07]',
    activeColor: 'border-accent2',
  },
]

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    plan: 'free',
    terms: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [globalError, setGlobalError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  useEffect(() => {
    if (isAuthenticated()) router.replace('/dashboard')
  }, [router])

  function validateStep1() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Nom requis'
    if (!form.email) e.email = 'Email requis'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email invalide'
    if (!form.password) e.password = 'Mot de passe requis'
    else if (form.password.length < 8) e.password = 'Au moins 8 caractères'
    if (form.password !== form.confirm) e.confirm = 'Les mots de passe ne correspondent pas'
    return e
  }

  function handleStep1(e: React.FormEvent) {
    e.preventDefault()
    const errs = validateStep1()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setStep(2)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.terms) {
      setErrors({ terms: 'Vous devez accepter les CGU' })
      return
    }
    setErrors({})
    setGlobalError('')
    setIsLoading(true)

    const result = await register(form.name, form.email, form.password)
    setIsLoading(false)

    if (result.success) {
      router.push('/dashboard?welcome=1')
    } else {
      setGlobalError(result.error || 'Erreur lors de la création du compte.')
      setStep(1)
    }
  }

  // Password strength
  const strength = (() => {
    const p = form.password
    if (!p) return 0
    let s = 0
    if (p.length >= 8) s++
    if (/[A-Z]/.test(p)) s++
    if (/[0-9]/.test(p)) s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  })()
  const strengthLabel = ['', 'Faible', 'Moyen', 'Fort', 'Excellent'][strength]
  const strengthColor = ['', 'text-warn', 'text-yellow-400', 'text-accent2', 'text-accent'][strength]

  return (
    <AuthLayout>
      <div className="w-full max-w-md animate-slide-up">
        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-10">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div
                className={`w-8 h-8 flex items-center justify-center font-mono text-[12px] font-medium border transition-all ${
                  step === s
                    ? 'border-accent text-accent bg-accent/10'
                    : step > s
                    ? 'border-accent/40 text-accent/40 bg-accent/5'
                    : 'border-white/[0.07] text-muted'
                }`}
              >
                {step > s ? '✓' : s}
              </div>
              <span className={`font-mono text-[11px] tracking-wider uppercase ${step >= s ? 'text-muted' : 'text-muted/40'}`}>
                {s === 1 ? 'Informations' : 'Votre plan'}
              </span>
              {s === 1 && <div className="w-8 h-px bg-white/[0.07]" />}
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-accent mb-4">
            — Inscription
          </div>
          <h1 className="font-display font-extrabold text-4xl tracking-tight uppercase leading-none mb-3">
            {step === 1 ? (
              <>Créer votre<br /><span className="font-serif italic font-normal normal-case text-accent">compte.</span></>
            ) : (
              <>Choisissez<br /><span className="font-serif italic font-normal normal-case text-accent">votre plan.</span></>
            )}
          </h1>
        </div>

        {/* Global error */}
        {globalError && (
          <div className="mb-6 flex items-center gap-3 bg-warn/10 border border-warn/30 px-4 py-3">
            <span className="text-warn text-lg">⚠</span>
            <span className="font-mono text-[13px] text-warn">{globalError}</span>
          </div>
        )}

        {/* STEP 1 — Identity */}
        {step === 1 && (
          <form onSubmit={handleStep1} className="flex flex-col gap-5">
            <div>
              <label className="signal-label">Nom complet</label>
              <input
                type="text"
                placeholder="Jean Dupont"
                autoComplete="name"
                className={`signal-input ${errors.name ? 'border-warn/60' : ''}`}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              {errors.name && <p className="signal-error">{errors.name}</p>}
            </div>

            <div>
              <label className="signal-label">Email</label>
              <input
                type="email"
                placeholder="vous@example.com"
                autoComplete="email"
                className={`signal-input ${errors.email ? 'border-warn/60' : ''}`}
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
              {errors.email && <p className="signal-error">{errors.email}</p>}
            </div>

            <div>
              <label className="signal-label">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={`signal-input pr-12 ${errors.password ? 'border-warn/60' : ''}`}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-text font-mono text-[11px] tracking-wider"
                >
                  {showPw ? 'CACHER' : 'VOIR'}
                </button>
              </div>
              {form.password && (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 transition-all ${
                          i <= strength
                            ? strength <= 1 ? 'bg-warn' : strength === 2 ? 'bg-yellow-400' : strength === 3 ? 'bg-accent2' : 'bg-accent'
                            : 'bg-white/[0.07]'
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`font-mono text-[11px] ${strengthColor}`}>{strengthLabel}</span>
                </div>
              )}
              {errors.password && <p className="signal-error">{errors.password}</p>}
            </div>

            <div>
              <label className="signal-label">Confirmer le mot de passe</label>
              <input
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                className={`signal-input ${errors.confirm ? 'border-warn/60' : ''}`}
                value={form.confirm}
                onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
              />
              {errors.confirm && <p className="signal-error">{errors.confirm}</p>}
            </div>

            <button type="submit" className="signal-btn-primary mt-2">
              Continuer →
            </button>
          </form>
        )}

        {/* STEP 2 — Plan selection */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-3">
              {PLANS.map((plan) => (
                <label
                  key={plan.id}
                  className={`flex items-center gap-4 p-4 border cursor-pointer transition-all ${
                    form.plan === plan.id ? plan.activeColor : 'border-white/[0.07]'
                  } ${form.plan === plan.id ? 'bg-surface2' : 'bg-surface hover:bg-surface2'}`}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={plan.id}
                    checked={form.plan === plan.id}
                    onChange={() => setForm((f) => ({ ...f, plan: plan.id }))}
                    className="sr-only"
                  />
                  {/* Radio indicator */}
                  <div
                    className={`w-5 h-5 border flex items-center justify-center flex-shrink-0 transition-all ${
                      form.plan === plan.id
                        ? plan.id === 'pro' ? 'border-accent' : plan.id === 'expert' ? 'border-accent2' : 'border-muted'
                        : 'border-white/[0.1]'
                    }`}
                  >
                    {form.plan === plan.id && (
                      <div
                        className={`w-2.5 h-2.5 ${
                          plan.id === 'pro' ? 'bg-accent' : plan.id === 'expert' ? 'bg-accent2' : 'bg-muted'
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-base uppercase tracking-tight">{plan.name}</span>
                      {plan.badge && (
                        <span className="font-mono text-[10px] tracking-wider bg-accent/10 text-accent px-2 py-0.5">
                          {plan.badge}
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-[12px] text-muted mt-0.5">{plan.desc}</div>
                  </div>
                  <span
                    className={`font-display font-bold text-sm ${
                      plan.id === 'pro' ? 'text-accent' : plan.id === 'expert' ? 'text-accent2' : 'text-muted'
                    }`}
                  >
                    {plan.price}
                  </span>
                </label>
              ))}
            </div>

            {/* Terms */}
            <label className={`flex items-start gap-3 cursor-pointer group`}>
              <div
                onClick={() => setForm((f) => ({ ...f, terms: !f.terms }))}
                className={`mt-0.5 w-5 h-5 border flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${
                  form.terms ? 'border-accent bg-accent/10' : 'border-white/[0.1]'
                }`}
              >
                {form.terms && <span className="text-accent text-[12px]">✓</span>}
              </div>
              <span className="font-mono text-[12px] text-muted leading-relaxed">
                J'accepte les{' '}
                <Link href="#" className="text-accent hover:underline">Conditions d'utilisation</Link>{' '}
                et la{' '}
                <Link href="#" className="text-accent hover:underline">Politique de confidentialité</Link>
              </span>
            </label>
            {errors.terms && <p className="signal-error -mt-2">{errors.terms}</p>}

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="signal-btn-ghost flex-none w-auto px-6"
              >
                ← Retour
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="signal-btn-primary flex-1 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border border-bg border-t-transparent rounded-full animate-spin" />
                    Création...
                  </>
                ) : (
                  'Créer mon compte →'
                )}
              </button>
            </div>
          </form>
        )}

        {/* Login link */}
        {step === 1 && (
          <p className="text-center font-mono text-[13px] text-muted mt-8">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-accent hover:text-[#00ffc2] transition-colors">
              Se connecter →
            </Link>
          </p>
        )}
      </div>
    </AuthLayout>
  )
}
