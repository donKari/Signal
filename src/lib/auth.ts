// lib/auth.ts
// Auth layer — localStorage for MVP, swap for DB later

export interface User {
  id: string
  email: string
  name: string
  plan: 'free' | 'pro' | 'expert'
  createdAt: string
  alertsCount: number
}

const USERS_KEY = 'pulse_users'
const SESSION_KEY = 'pulse_session'

// ─── User Storage ────────────────────────────────────────────────
function getUsers(): Record<string, User & { passwordHash: string }> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveUsers(users: Record<string, User & { passwordHash: string }>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

// Simple hash (MVP only — replace with bcrypt server-side)
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36) + str.length.toString(36)
}

// ─── Register ────────────────────────────────────────────────────
export async function register(
  name: string,
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const users = getUsers()
  const normalizedEmail = email.toLowerCase().trim()

  if (users[normalizedEmail]) {
    return { success: false, error: 'Un compte existe déjà avec cet email.' }
  }

  if (password.length < 8) {
    return { success: false, error: 'Le mot de passe doit faire au moins 8 caractères.' }
  }

  const user: User & { passwordHash: string } = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    name: name.trim(),
    plan: 'free',
    createdAt: new Date().toISOString(),
    alertsCount: 0,
    passwordHash: simpleHash(password),
  }

  users[normalizedEmail] = user
  saveUsers(users)

  // Auto-login after register
  const { passwordHash, ...sessionUser } = user
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser))

  return { success: true }
}

// ─── Login ───────────────────────────────────────────────────────
export async function login(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const users = getUsers()
  const normalizedEmail = email.toLowerCase().trim()
  const user = users[normalizedEmail]

  if (!user) {
    // Generic error to avoid user enumeration
    return { success: false, error: 'Email ou mot de passe incorrect.' }
  }

  if (user.passwordHash !== simpleHash(password)) {
    return { success: false, error: 'Email ou mot de passe incorrect.' }
  }

  const { passwordHash, ...sessionUser } = user
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser))

  return { success: true }
}

// ─── Session ─────────────────────────────────────────────────────
export function getSession(): User | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY)
}

export function isAuthenticated(): boolean {
  return getSession() !== null
}
