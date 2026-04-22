'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { login, isAuthenticated } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [globalError, setGlobalError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (isAuthenticated()) router.replace('/dashboard')
  }, [router])

  function validate() {
    const e: Record<string, string> = {}
    if (!form.email) e.email = 'Email requis'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email invalide'
    if (!form.password) e.password = 'Mot de passe requis'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setGlobalError('')
    setIsLoading(true)

    const result = await login(form.email, form.password)
    setIsLoading(false)

    if (result.success) {
      router.push('/dashboard')
    } else {
      setGlobalError(result.error || 'Erreur de connexion.')
    }
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="mb-10">
          <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-accent mb-4">
            — Connexion
          </div>
          <h1 className="font-display font-extrabold text-4xl tracking-tight uppercase leading-none mb-3">
            Bon retour<br />
            <span className="font-serif italic font-normal normal-case text-accent">sur Signal.</span>
          </h1>
          <p className="font-mono text-sm text-muted leading-relaxed">
            Les marchés n'attendent pas.<br />Connectez-vous pour accéder à vos alertes.
          </p>
        </div>

        {/* Global error */}
        {globalError && (
          <div className="mb-6 flex items-center gap-3 bg-warn/10 border border-warn/30 px-4 py-3">
            <span className="text-warn text-lg">⚠</span>
            <span className="font-mono text-[13px] text-warn">{globalError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Email */}
          <div>
            <label className="signal-label">Email</label>
            <input
              type="email"
              autoComplete="email"
              placeholder="vous@example.com"
              className={`signal-input ${errors.email ? 'border-warn/60 focus:border-warn' : ''}`}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            {errors.email && <p className="signal-error">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="signal-label mb-0">Mot de passe</label>
              <Link
                href="/forgot-password"
                className="font-mono text-[11px] text-muted hover:text-accent transition-colors tracking-wider"
              >
                Mot de passe oublié ?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className={`signal-input pr-12 ${errors.password ? 'border-warn/60 focus:border-warn' : ''}`}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors font-mono text-[11px] tracking-wider"
              >
                {showPassword ? 'CACHER' : 'VOIR'}
              </button>
            </div>
            {errors.password && <p className="signal-error">{errors.password}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="signal-btn-primary mt-2 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border border-bg border-t-transparent rounded-full animate-spin" />
                Connexion en cours...
              </>
            ) : (
              <>Accéder à mon compte →</>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-white/[0.07]" />
          <span className="font-mono text-[11px] text-muted tracking-widest uppercase">ou</span>
          <div className="flex-1 h-px bg-white/[0.07]" />
        </div>

        {/* Register link */}
        <p className="text-center font-mono text-[13px] text-muted">
          Pas encore de compte ?{' '}
          <Link
            href="/register"
            className="text-accent hover:text-[#00ffc2] transition-colors font-medium"
          >
            Créer un compte gratuit →
          </Link>
        </p>

        {/* Demo hint */}
        <div className="mt-8 bg-surface border border-white/[0.07] px-4 py-3">
          <p className="font-mono text-[11px] text-muted leading-relaxed">
            <span className="text-accent">💡 Demo</span> — Créez d'abord un compte via{' '}
            <Link href="/register" className="text-accent hover:underline">l'inscription</Link>,
            puis connectez-vous avec vos identifiants.
          </p>
        </div>
      </div>
    </AuthLayout>
  )
}
