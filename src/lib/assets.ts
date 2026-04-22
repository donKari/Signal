// lib/assets.ts
// Asset store — CoinGecko (crypto) + simulated prices (stocks)
// Swap stock simulation for a real broker API when ready

import { create } from 'zustand'

export type AssetType = 'crypto' | 'stock'
export type AssetCategory = 'crypto' | 'tech' | 'indices' | 'commodities'

export interface Asset {
  id: string           // unique key (e.g. "bitcoin", "AAPL")
  symbol: string       // display ticker
  name: string
  type: AssetType
  category: AssetCategory
  price: number | null
  change24h: number | null  // percent
  high24h: number | null
  low24h: number | null
  volume24h: number | null
  marketCap: number | null
  lastUpdated: number | null
  isWatched: boolean
  image?: string
}

// ─── Static catalog ─────────────────────────────────────────────
const CRYPTO_CATALOG: Omit<Asset, 'price' | 'change24h' | 'high24h' | 'low24h' | 'volume24h' | 'marketCap' | 'lastUpdated' | 'isWatched'>[] = [
  { id: 'bitcoin',       symbol: 'BTC',  name: 'Bitcoin',     type: 'crypto', category: 'crypto' },
  { id: 'ethereum',      symbol: 'ETH',  name: 'Ethereum',    type: 'crypto', category: 'crypto' },
  { id: 'solana',        symbol: 'SOL',  name: 'Solana',      type: 'crypto', category: 'crypto' },
  { id: 'binancecoin',   symbol: 'BNB',  name: 'BNB',         type: 'crypto', category: 'crypto' },
  { id: 'ripple',        symbol: 'XRP',  name: 'XRP',         type: 'crypto', category: 'crypto' },
  { id: 'cardano',       symbol: 'ADA',  name: 'Cardano',     type: 'crypto', category: 'crypto' },
  { id: 'dogecoin',      symbol: 'DOGE', name: 'Dogecoin',    type: 'crypto', category: 'crypto' },
  { id: 'avalanche-2',   symbol: 'AVAX', name: 'Avalanche',   type: 'crypto', category: 'crypto' },
  { id: 'polkadot',      symbol: 'DOT',  name: 'Polkadot',    type: 'crypto', category: 'crypto' },
  { id: 'chainlink',     symbol: 'LINK', name: 'Chainlink',   type: 'crypto', category: 'crypto' },
]

// Simulated stock prices (realistic base values, fluctuate ±2% on each fetch)
const STOCK_CATALOG: (Omit<Asset, 'price' | 'change24h' | 'high24h' | 'low24h' | 'volume24h' | 'marketCap' | 'lastUpdated' | 'isWatched'> & { basePrice: number; baseMktCap: number })[] = [
  { id: 'AAPL',  symbol: 'AAPL',  name: 'Apple',         type: 'stock', category: 'tech',        basePrice: 189.5,  baseMktCap: 2.94e12 },
  { id: 'NVDA',  symbol: 'NVDA',  name: 'NVIDIA',        type: 'stock', category: 'tech',        basePrice: 875.2,  baseMktCap: 2.15e12 },
  { id: 'MSFT',  symbol: 'MSFT',  name: 'Microsoft',     type: 'stock', category: 'tech',        basePrice: 415.3,  baseMktCap: 3.08e12 },
  { id: 'GOOGL', symbol: 'GOOGL', name: 'Alphabet',      type: 'stock', category: 'tech',        basePrice: 172.8,  baseMktCap: 2.18e12 },
  { id: 'TSLA',  symbol: 'TSLA',  name: 'Tesla',         type: 'stock', category: 'tech',        basePrice: 248.6,  baseMktCap: 0.79e12 },
  { id: 'AMZN',  symbol: 'AMZN',  name: 'Amazon',        type: 'stock', category: 'tech',        basePrice: 191.2,  baseMktCap: 1.98e12 },
  { id: 'META',  symbol: 'META',  name: 'Meta',          type: 'stock', category: 'tech',        basePrice: 512.4,  baseMktCap: 1.31e12 },
  { id: 'SPY',   symbol: 'SPY',   name: 'S&P 500 ETF',   type: 'stock', category: 'indices',     basePrice: 523.4,  baseMktCap: 0.5e12 },
  { id: 'QQQ',   symbol: 'QQQ',   name: 'NASDAQ-100 ETF',type: 'stock', category: 'indices',     basePrice: 447.8,  baseMktCap: 0.25e12 },
  { id: 'GLD',   symbol: 'GLD',   name: 'Or (ETF)',       type: 'stock', category: 'commodities', basePrice: 232.1,  baseMktCap: 0.06e12 },
]

function simulateStock(base: typeof STOCK_CATALOG[number]): Asset {
  const seed = (Date.now() / 60000) | 0  // changes every minute
  const rng = (n: number) => Math.sin(seed * 9301 + n * 49297 + 233) * 0.5 + 0.5
  const change24h = (rng(base.basePrice) - 0.5) * 6  // ±3%
  const price = base.basePrice * (1 + change24h / 100)
  const high = price * (1 + rng(seed) * 0.015)
  const low  = price * (1 - rng(seed + 1) * 0.015)
  return {
    id: base.id, symbol: base.symbol, name: base.name,
    type: base.type, category: base.category, image: undefined,
    price, change24h, high24h: high, low24h: low,
    volume24h: base.baseMktCap * rng(seed + 2) * 0.002,
    marketCap: base.baseMktCap,
    lastUpdated: Date.now(),
    isWatched: false,
  }
}

// ─── CoinGecko fetch ────────────────────────────────────────────
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3'
const CRYPTO_IDS = CRYPTO_CATALOG.map(c => c.id).join(',')

async function fetchCryptoPrices(): Promise<Partial<Asset>[]> {
  const url = `${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${CRYPTO_IDS}&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h`
  const res = await fetch(url, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error(`CoinGecko error ${res.status}`)
  const data = await res.json()
  return data.map((c: any): Partial<Asset> => ({
    id: c.id,
    price: c.current_price,
    change24h: c.price_change_percentage_24h,
    high24h: c.high_24h,
    low24h: c.low_24h,
    volume24h: c.total_volume,
    marketCap: c.market_cap,
    image: c.image,
    lastUpdated: Date.now(),
  }))
}

// ─── Zustand store ──────────────────────────────────────────────
const WATCHED_KEY = 'signal_watched_assets'

function loadWatched(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(WATCHED_KEY) || '[]') } catch { return [] }
}

function saveWatched(ids: string[]) {
  localStorage.setItem(WATCHED_KEY, JSON.stringify(ids))
}

interface AssetsStore {
  assets: Asset[]
  isLoading: boolean
  lastFetch: number | null
  error: string | null
  searchQuery: string
  activeCategory: AssetCategory | 'all' | 'watched'

  init: () => void
  fetchPrices: () => Promise<void>
  toggleWatch: (id: string) => void
  setSearch: (q: string) => void
  setCategory: (c: AssetCategory | 'all' | 'watched') => void
  getFiltered: () => Asset[]
}

export const useAssetsStore = create<AssetsStore>((set, get) => ({
  assets: [],
  isLoading: false,
  lastFetch: null,
  error: null,
  searchQuery: '',
  activeCategory: 'all',

  init: () => {
    const watched = loadWatched()
    // Build initial catalog with null prices
    const cryptos: Asset[] = CRYPTO_CATALOG.map(c => ({
      ...c,
      price: null, change24h: null, high24h: null,
      low24h: null, volume24h: null, marketCap: null,
      lastUpdated: null,
      isWatched: watched.includes(c.id),
    }))
    const stocks: Asset[] = STOCK_CATALOG.map(s => ({
      ...simulateStock(s),
      isWatched: watched.includes(s.id),
    }))
    set({ assets: [...cryptos, ...stocks] })
    get().fetchPrices()
  },

  fetchPrices: async () => {
    const { isLoading, lastFetch } = get()
    if (isLoading) return
    // Rate-limit: don't refetch within 30s
    if (lastFetch && Date.now() - lastFetch < 30_000) return

    set({ isLoading: true, error: null })
    try {
      const [cryptoUpdates] = await Promise.all([fetchCryptoPrices()])
      const watched = loadWatched()

      set(state => ({
        assets: state.assets.map(asset => {
          if (asset.type === 'crypto') {
            const update = cryptoUpdates.find(u => u.id === asset.id)
            return update ? { ...asset, ...update, isWatched: watched.includes(asset.id) } : asset
          } else {
            // Refresh simulated stock
            const catalog = STOCK_CATALOG.find(s => s.id === asset.id)
            if (!catalog) return asset
            return { ...simulateStock(catalog), isWatched: watched.includes(asset.id) }
          }
        }),
        isLoading: false,
        lastFetch: Date.now(),
      }))
    } catch (err: any) {
      // On error, still show simulated data for stocks, keep last crypto prices
      set(state => ({
        isLoading: false,
        error: 'Impossible de récupérer les prix crypto. Données simulées affichées.',
        assets: state.assets.map(asset => {
          if (asset.type === 'stock') {
            const catalog = STOCK_CATALOG.find(s => s.id === asset.id)
            return catalog ? { ...simulateStock(catalog), isWatched: asset.isWatched } : asset
          }
          return asset
        }),
      }))
    }
  },

  toggleWatch: (id: string) => {
    set(state => {
      const assets = state.assets.map(a =>
        a.id === id ? { ...a, isWatched: !a.isWatched } : a
      )
      const watched = assets.filter(a => a.isWatched).map(a => a.id)
      saveWatched(watched)
      return { assets }
    })
  },

  setSearch: (q) => set({ searchQuery: q }),
  setCategory: (c) => set({ activeCategory: c }),

  getFiltered: () => {
    const { assets, searchQuery, activeCategory } = get()
    let filtered = assets
    if (activeCategory === 'watched') {
      filtered = filtered.filter(a => a.isWatched)
    } else if (activeCategory !== 'all') {
      filtered = filtered.filter(a => a.category === activeCategory)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.symbol.toLowerCase().includes(q)
      )
    }
    return filtered
  },
}))

// ─── Helpers ─────────────────────────────────────────────────────
export function formatPrice(price: number | null, symbol?: string): string {
  if (price === null) return '—'
  if (symbol === 'BTC' && price > 1000) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price)
  }
  if (price < 0.01) return `$${price.toFixed(6)}`
  if (price < 1) return `$${price.toFixed(4)}`
  if (price < 100) return `$${price.toFixed(2)}`
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(price)
}

export function formatChange(change: number | null): string {
  if (change === null) return '—'
  return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`
}

export function formatVolume(v: number | null): string {
  if (v === null) return '—'
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`
  if (v >= 1e9)  return `$${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6)  return `$${(v / 1e6).toFixed(1)}M`
  return `$${v.toFixed(0)}`
}
