// lib/alerts.ts
// Alert store — localStorage for MVP
// Each alert watches one asset and triggers when price crosses a threshold

import { create } from 'zustand'

export type AlertCondition = 'above' | 'below' | 'change_up' | 'change_down'
export type AlertChannel = 'email' | 'sms'
export type AlertStatus = 'active' | 'triggered' | 'paused'

export interface Alert {
  id: string
  userId: string
  assetId: string       // e.g. 'bitcoin', 'AAPL'
  assetSymbol: string
  assetName: string
  assetType: 'crypto' | 'stock'
  condition: AlertCondition
  targetValue: number   // price in USD, or % change
  currentPrice: number | null
  channel: AlertChannel
  contactValue: string  // email or phone
  status: AlertStatus
  note: string          // optional label
  createdAt: string
  triggeredAt: string | null
  lastChecked: string | null
}

export interface CreateAlertInput {
  userId: string
  assetId: string
  assetSymbol: string
  assetName: string
  assetType: 'crypto' | 'stock'
  condition: AlertCondition
  targetValue: number
  channel: AlertChannel
  contactValue: string
  note?: string
}

const ALERTS_KEY = 'signal_alerts'

function loadAlerts(): Alert[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(ALERTS_KEY) || '[]') } catch { return [] }
}

function saveAlerts(alerts: Alert[]) {
  localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts))
}

interface AlertsStore {
  alerts: Alert[]
  init: () => void
  createAlert: (input: CreateAlertInput) => Alert
  deleteAlert: (id: string) => void
  pauseAlert: (id: string) => void
  resumeAlert: (id: string) => void
  updateCurrentPrice: (assetId: string, price: number) => void
  getByUser: (userId: string) => Alert[]
}

export const useAlertsStore = create<AlertsStore>((set, get) => ({
  alerts: [],

  init: () => set({ alerts: loadAlerts() }),

  createAlert: (input) => {
    const alert: Alert = {
      id: crypto.randomUUID(),
      ...input,
      note: input.note || '',
      currentPrice: null,
      status: 'active',
      createdAt: new Date().toISOString(),
      triggeredAt: null,
      lastChecked: null,
    }
    set(state => {
      const alerts = [alert, ...state.alerts]
      saveAlerts(alerts)
      return { alerts }
    })
    return alert
  },

  deleteAlert: (id) => set(state => {
    const alerts = state.alerts.filter(a => a.id !== id)
    saveAlerts(alerts)
    return { alerts }
  }),

  pauseAlert: (id) => set(state => {
    const alerts = state.alerts.map(a => a.id === id ? { ...a, status: 'paused' as AlertStatus } : a)
    saveAlerts(alerts)
    return { alerts }
  }),

  resumeAlert: (id) => set(state => {
    const alerts = state.alerts.map(a => a.id === id ? { ...a, status: 'active' as AlertStatus } : a)
    saveAlerts(alerts)
    return { alerts }
  }),

  updateCurrentPrice: (assetId, price) => set(state => {
    const alerts = state.alerts.map(a =>
      a.assetId === assetId ? { ...a, currentPrice: price, lastChecked: new Date().toISOString() } : a
    )
    saveAlerts(alerts)
    return { alerts }
  }),

  getByUser: (userId) => get().alerts.filter(a => a.userId === userId),
}))

// ─── Condition helpers ───────────────────────────────────────────
export function conditionLabel(condition: AlertCondition): string {
  return {
    above:       'Prix au-dessus de',
    below:       'Prix en dessous de',
    change_up:   'Hausse de',
    change_down: 'Baisse de',
  }[condition]
}

export function conditionIcon(condition: AlertCondition): string {
  return { above: '▲', below: '▼', change_up: '↑', change_down: '↓' }[condition]
}

export function isTriggered(alert: Alert, currentPrice: number): boolean {
  if (alert.status !== 'active') return false
  switch (alert.condition) {
    case 'above':      return currentPrice >= alert.targetValue
    case 'below':      return currentPrice <= alert.targetValue
    case 'change_up':  return (alert.currentPrice !== null)
      ? ((currentPrice - alert.currentPrice) / alert.currentPrice) * 100 >= alert.targetValue
      : false
    case 'change_down': return (alert.currentPrice !== null)
      ? ((alert.currentPrice - currentPrice) / alert.currentPrice) * 100 >= alert.targetValue
      : false
    default: return false
  }
}
