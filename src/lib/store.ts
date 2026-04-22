// lib/store.ts
import { create } from 'zustand'
import { User, getSession, logout as authLogout } from './auth'

interface AuthStore {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
  loadSession: () => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,

  setUser: (user) => set({ user }),

  loadSession: () => {
    const session = getSession()
    set({ user: session, isLoading: false })
  },

  logout: () => {
    authLogout()
    set({ user: null })
  },
}))
