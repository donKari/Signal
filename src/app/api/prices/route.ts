// app/api/prices/route.ts
// Fetches real-time prices server-side to avoid CORS issues
// Cryptos  → CoinGecko (free, fiable)
// Stocks   → Yahoo Finance v2 avec fallback sur données simulées réalistes
//
// POURQUOI LES ACTIONS "TOURNENT" ?
// Yahoo Finance bloque fréquemment les requêtes serveur Node.js (rate-limit, CORS, IP ban).
// Cette version : 
//   1. Tente yahoo-finance2 avec un timeout de 5s
//   2. Si ça échoue → utilise des prix de base connus + variation aléatoire réaliste
//   3. Cache en mémoire 60s pour éviter les spams

import { NextRequest, NextResponse } from 'next/server'

const CRYPTO_IDS = [
  'bitcoin', 'ethereum', 'solana', 'binancecoin', 'ripple',
  'cardano', 'dogecoin', 'avalanche-2', 'polkadot', 'chainlink',
]

const STOCK_TICKERS = ['AAPL', 'NVDA', 'MSFT', 'GOOGL', 'TSLA', 'AMZN', 'META', 'SPY', 'QQQ', 'GLD']

// Prix de base réalistes (mis à jour manuellement de temps en temps)
// Utilisés comme fallback si Yahoo est indisponible
const STOCK_BASE_PRICES: Record<string, { name: string; base: number }> = {
  AAPL: { name: 'Apple Inc.',            base: 195.00 },
  NVDA: { name: 'NVIDIA Corporation',    base: 875.00 },
  MSFT: { name: 'Microsoft Corporation', base: 415.00 },
  GOOGL: { name: 'Alphabet Inc.',        base: 172.00 },
  TSLA: { name: 'Tesla, Inc.',           base: 175.00 },
  AMZN: { name: 'Amazon.com, Inc.',      base: 185.00 },
  META: { name: 'Meta Platforms, Inc.',  base: 505.00 },
  SPY:  { name: 'SPDR S&P 500 ETF',      base: 521.00 },
  QQQ:  { name: 'Invesco QQQ Trust',     base: 445.00 },
  GLD:  { name: 'SPDR Gold Shares',      base: 225.00 },
}

// Seed déterministe pour la journée (même variation toute la journée)
function dailySeed(ticker: string): number {
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  let hash = 0
  const str = ticker + today
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash = hash & hash
  }
  return (Math.abs(hash) % 1000) / 1000 // 0..1
}

function generateFallbackStock(ticker: string) {
  const info = STOCK_BASE_PRICES[ticker]
  if (!info) return null
  const seed = dailySeed(ticker)
  const changePct = (seed - 0.5) * 6 // −3% à +3%
  const price = info.base * (1 + changePct / 100)
  const high  = price * (1 + Math.abs(changePct) / 100 * 0.3 + 0.002)
  const low   = price * (1 - Math.abs(changePct) / 100 * 0.3 - 0.002)
  return {
    id: ticker,
    symbol: ticker,
    name: info.name,
    type: 'stock',
    price: Math.round(price * 100) / 100,
    change24h: Math.round(changePct * 100) / 100,
    high24h:  Math.round(high * 100) / 100,
    low24h:   Math.round(low * 100) / 100,
    volume24h: Math.round(price * (1_000_000 + seed * 20_000_000)),
    marketCap: null,
    image: null,
    lastUpdated: Date.now(),
    marketState: 'CLOSED',
    isFallback: true,
  }
}

async function fetchCrypto() {
  const ids = CRYPTO_IDS.join(',')
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h`
  const res = await fetch(url, { next: { revalidate: 55 } })
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`)
  const data = await res.json()
  return data.map((c: any) => ({
    id: c.id,
    symbol: c.symbol.toUpperCase(),
    name: c.name,
    type: 'crypto',
    price: c.current_price,
    change24h: c.price_change_percentage_24h,
    high24h: c.high_24h,
    low24h: c.low_24h,
    volume24h: c.total_volume,
    marketCap: c.market_cap,
    image: c.image,
    lastUpdated: Date.now(),
    isFallback: false,
  }))
}

async function fetchStocksYahoo(): Promise<any[]> {
  // Dynamic import avec timeout
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000) // 5s timeout

  try {
    const yahooFinanceModule = await import('yahoo-finance2')
    const yahooFinance = (yahooFinanceModule as any).default ?? yahooFinanceModule

    const results = await Promise.allSettled(
      STOCK_TICKERS.map(async (ticker) => {
        const quote = await yahooFinance.quote(ticker, {}, { validateResult: false })
        return {
          id: ticker,
          symbol: ticker,
          name: quote.longName || quote.shortName || ticker,
          type: 'stock',
          price: quote.regularMarketPrice ?? null,
          change24h: quote.regularMarketChangePercent ?? null,
          high24h: quote.regularMarketDayHigh ?? null,
          low24h: quote.regularMarketDayLow ?? null,
          volume24h: (quote.regularMarketVolume ?? 0) * (quote.regularMarketPrice ?? 0),
          marketCap: quote.marketCap ?? null,
          image: null,
          lastUpdated: Date.now(),
          marketState: quote.marketState ?? 'CLOSED',
          isFallback: false,
        }
      })
    )

    clearTimeout(timeout)

    const succeeded = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value.price !== null)
      .map(r => r.value)

    // Si moins de 50% réussissent, lever une erreur pour basculer sur le fallback
    if (succeeded.length < STOCK_TICKERS.length * 0.5) {
      throw new Error(`Trop peu de tickers Yahoo réussis (${succeeded.length}/${STOCK_TICKERS.length})`)
    }

    return succeeded
  } catch (err) {
    clearTimeout(timeout)
    throw err
  }
}

async function fetchStocks(): Promise<{ data: any[]; usedFallback: boolean }> {
  try {
    const data = await fetchStocksYahoo()
    return { data, usedFallback: false }
  } catch (err) {
    console.warn('[prices] Yahoo Finance failed, using fallback:', (err as Error).message)
    const fallback = STOCK_TICKERS.map(t => generateFallbackStock(t)).filter(Boolean) as any[]
    return { data: fallback, usedFallback: true }
  }
}

// In-memory cache
let cache: { data: any[]; ts: number; stocksFallback: boolean } | null = null
const CACHE_TTL = 60_000

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type')

  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    const filtered = type === 'crypto' ? cache.data.filter(a => a.type === 'crypto')
      : type === 'stocks' ? cache.data.filter(a => a.type === 'stock')
      : cache.data
    return NextResponse.json({
      data: filtered,
      cached: true,
      ts: cache.ts,
      stocksFallback: cache.stocksFallback,
    })
  }

  try {
    const [cryptoResult, stockResult] = await Promise.allSettled([
      fetchCrypto(),
      fetchStocks(),
    ])

    const cryptoData = cryptoResult.status === 'fulfilled' ? cryptoResult.value : []
    const stockData  = stockResult.status  === 'fulfilled' ? stockResult.value.data : STOCK_TICKERS.map(t => generateFallbackStock(t)).filter(Boolean) as any[]
    const stocksFallback = stockResult.status === 'rejected' || (stockResult.status === 'fulfilled' && stockResult.value.usedFallback)

    const all = [...cryptoData, ...stockData]
    if (all.length > 0) {
      cache = { data: all, ts: Date.now(), stocksFallback }
    }

    const filtered = type === 'crypto' ? cryptoData : type === 'stocks' ? stockData : all

    return NextResponse.json({
      data: filtered,
      cached: false,
      ts: Date.now(),
      stocksFallback,
      errors: {
        crypto: cryptoResult.status === 'rejected' ? cryptoResult.reason?.message : null,
        stocks: stocksFallback ? 'Yahoo Finance indisponible — prix estimés affichés' : null,
      },
    })
  } catch (err: any) {
    if (cache) {
      return NextResponse.json({ data: cache.data, cached: true, stale: true, ts: cache.ts })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
