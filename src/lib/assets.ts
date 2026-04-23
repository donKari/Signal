// lib/assets.ts  (v2 — real prices only)
// Cryptos: CoinGecko via /api/prices
// Stocks:  Yahoo Finance via /api/prices
// No simulation. If API fails, last known prices are kept.

import { create } from 'zustand'

export type AssetType     = 'crypto' | 'stock'
export type AssetCategory = 'crypto' | 'tech' | 'indices' | 'commodities'

export interface Asset {
  id: string
  symbol: string
  name: string
  type: AssetType
  category: AssetCategory
  price: number | null
  change24h: number | null
  high24h: number | null
  low24h: number | null
  volume24h: number | null
  marketCap: number | null
  marketState?: string   // 'REGULAR' | 'PRE' | 'POST' | 'CLOSED'
  lastUpdated: number | null
  isWatched: boolean
  image?: string
}

// ─── Static category map ────────────────────────────────────────
const CATEGORY_MAP: Record<string, AssetCategory> = {
  bitcoin: 'crypto', ethereum: 'crypto', solana: 'crypto',
  binancecoin: 'crypto', ripple: 'crypto', cardano: 'crypto',
  dogecoin: 'crypto', 'avalanche-2': 'crypto', polkadot: 'crypto', chainlink: 'crypto',
  AAPL: 'tech', NVDA: 'tech', MSFT: 'tech', GOOGL: 'tech',
  TSLA: 'tech', AMZN: 'tech', META: 'tech',
  SPY: 'indices', QQQ: 'indices',
  GLD: 'commodities',
}

// ─── Watched persistence ────────────────────────────────────────
const WATCHED_KEY = 'pulse_watched_assets'

function loadWatched(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(WATCHED_KEY) || '[]') } catch { return [] }
}
function saveWatched(ids: string[]) {
  localStorage.setItem(WATCHED_KEY, JSON.stringify(ids))
}

// ─── Store ──────────────────────────────────────────────────────
interface AssetsStore {
  assets: Asset[]
  isLoading: boolean
  lastFetch: number | null
  error: string | null
  searchQuery: string
  activeCategory: AssetCategory | 'all' | 'watched'

  fetchPrices: () => Promise<void>
  toggleWatch: (id: string) => void
  setSearch: (q: string) => void
  setCategory: (c: AssetCategory | 'all' | 'watched') => void
  getFiltered: () => Asset[]
  getPriceFor: (assetId: string) => number | null
}

export const useAssetsStore = create<AssetsStore>((set, get) => ({
  assets: [],
  isLoading: false,
  lastFetch: null,
  error: null,
  searchQuery: '',
  activeCategory: 'all',

  fetchPrices: async () => {
    if (get().isLoading) return
    const { lastFetch } = get()
    if (lastFetch && Date.now() - lastFetch < 30_000) return

    set({ isLoading: true, error: null })
    try {
      const res = await fetch('/api/prices', { cache: 'no-store' })
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)

      const watched = loadWatched()
      const existing = get().assets
      const newMap: Record<string, Asset> = {}

      for (const item of json.data) {
        newMap[item.id] = {
          ...item,
          category: CATEGORY_MAP[item.id] ?? (item.type === 'crypto' ? 'crypto' : 'tech'),
          isWatched: watched.includes(item.id),
        }
      }

      const merged = existing.map(a =>
        newMap[a.id] ? { ...newMap[a.id], isWatched: watched.includes(a.id) } : a
      )
      const existingIds = new Set(existing.map(a => a.id))
      for (const [id, asset] of Object.entries(newMap)) {
        if (!existingIds.has(id)) merged.push(asset)
      }

      const errors = []
      if (json.errors?.crypto) errors.push(`Crypto: ${json.errors.crypto}`)
      if (json.errors?.stocks) errors.push(`Actions: ${json.errors.stocks}`)

      set({
        assets: merged,
        isLoading: false,
        lastFetch: Date.now(),
        error: errors.length ? errors.join(' · ') : null,
      })
    } catch (err: any) {
      set({ isLoading: false, error: `Impossible de récupérer les prix : ${err.message}` })
    }
  },

  toggleWatch: (id) => {
    set(state => {
      const assets = state.assets.map(a => a.id === id ? { ...a, isWatched: !a.isWatched } : a)
      saveWatched(assets.filter(a => a.isWatched).map(a => a.id))
      return { assets }
    })
  },

  setSearch:   (q) => set({ searchQuery: q }),
  setCategory: (c) => set({ activeCategory: c }),

  getFiltered: () => {
    const { assets, searchQuery, activeCategory } = get()
    let list = assets
    if (activeCategory === 'watched')  list = list.filter(a => a.isWatched)
    else if (activeCategory !== 'all') list = list.filter(a => a.category === activeCategory)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(a => a.name.toLowerCase().includes(q) || a.symbol.toLowerCase().includes(q))
    }
    return list
  },

  getPriceFor: (assetId) => {
    const asset = get().assets.find(a => a.id === assetId)
    return asset?.price ?? null
  },
}))

// ─── Formatters ─────────────────────────────────────────────────
export function formatPrice(price: number | null, symbol?: string): string {
  if (price === null) return '—'
  if (price < 0.01)  return `$${price.toFixed(6)}`
  if (price < 1)     return `$${price.toFixed(4)}`
  if (price < 100)   return `$${price.toFixed(2)}`
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(price)
}

export function formatChange(change: number | null): string {
  if (change === null) return '—'
  return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`
}

export function formatVolume(v: number | null): string {
  if (v === null) return '—'
  if (v >= 1e12)  return `$${(v / 1e12).toFixed(2)}T`
  if (v >= 1e9)   return `$${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6)   return `$${(v / 1e6).toFixed(1)}M`
  return `$${v.toFixed(0)}`
}
