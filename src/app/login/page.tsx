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
    setErrors({}); setGlobalError(''); setIsLoading(true)
    const result = await login(form.email, form.password)
    setIsLoading(false)
    if (result.success) router.push('/dashboard')
    else setGlobalError(result.error || 'Erreur de connexion.')
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="mb-10">
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-amber-500 mb-4">— Connexion</div>
          <h1 className="font-display font-bold text-4xl tracking-tight leading-none mb-3">
            Bon retour
            <br />
            <span className="font-serif italic font-normal text-amber-400">sur Pulse.</span>
          </h1>
          <p className="font-mono text-sm text-muted leading-relaxed">
            Les marchés n'attendent pas.<br />Reconnectez-vous à vos alertes.
          </p>
        </div>

        {globalError && (
          <div className="mb-6 flex items-center gap-3 bg-down/10 border border-down/30 px-4 py-3 rounded-sm">
            <span className="text-down">⚠</span>
            <span className="font-mono text-[12px] text-down">{globalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="pulse-label">Email</label>
            <input type="email" autoComplete="email" placeholder="vous@example.com"
              className={`pulse-input ${errors.email ? 'border-down/50' : ''}`}
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            {errors.email && <p className="pulse-error">{errors.email}</p>}
          </div>

          <div>
            <label className="pulse-label">Mot de passe</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                placeholder="••••••••"
                className={`pulse-input pr-12 ${errors.password ? 'border-down/50' : ''}`}
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[11px] text-muted hover:text-text2 transition-colors">
                {showPassword ? 'CACHER' : 'VOIR'}
              </button>
            </div>
            {errors.password && <p className="pulse-error">{errors.password}</p>}
          </div>

          <div className="flex justify-between items-center">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="w-3.5 h-3.5 accent-amber-500" />
              <span className="font-mono text-[11px] text-muted group-hover:text-text2 transition-colors">Se souvenir de moi</span>
            </label>
            <Link href="#" className="font-mono text-[11px] text-text2 hover:text-amber-400 transition-colors">Mot de passe oublié ?</Link>
          </div>

          <button type="submit" disabled={isLoading} className="pulse-btn-primary mt-2">
            {isLoading ? (
              <span className="flex items-center justify-center gap-3">
                <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin inline-block" />
                Connexion…
              </span>
            ) : 'Se connecter →'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/[0.06] text-center">
          <p className="font-mono text-[12px] text-muted">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-amber-400 hover:text-amber-300 transition-colors">Créer un compte</Link>
          </p>
        </div>

        {/* Demo access */}
        <div className="mt-4 border border-amber-500/20 bg-amber-500/5 px-4 py-3 rounded-sm">
          <div className="font-mono text-[10px] text-amber-500/70 tracking-widest uppercase mb-1">Accès démo</div>
          <p className="font-mono text-[11px] text-muted">
            Créez un compte gratuit pour tester toutes les fonctionnalités — aucune carte bancaire requise.
          </p>
        </div>
      </div>
    </AuthLayout>
  )
}
