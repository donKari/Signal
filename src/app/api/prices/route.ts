// app/api/prices/route.ts
// Fetches real-time prices server-side to avoid CORS issues
// Cryptos → CoinGecko (no key needed)
// Stocks  → yahoo-finance2 (unofficial Yahoo Finance, no key needed)

import { NextRequest, NextResponse } from 'next/server'
import * as yahooFinanceModule from 'yahoo-finance2'
const yahooFinance = (yahooFinanceModule as any).default ?? yahooFinanceModule

const CRYPTO_IDS = [
  'bitcoin', 'ethereum', 'solana', 'binancecoin', 'ripple',
  'cardano', 'dogecoin', 'avalanche-2', 'polkadot', 'chainlink',
]

const STOCK_TICKERS = ['AAPL', 'NVDA', 'MSFT', 'GOOGL', 'TSLA', 'AMZN', 'META', 'SPY', 'QQQ', 'GLD']

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
  }))
}

async function fetchStocks() {
  const results = await Promise.allSettled(
    STOCK_TICKERS.map(async (ticker) => {
      const quote = await yahooFinance.quote(ticker)
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
        marketState: quote.marketState, // 'REGULAR' | 'PRE' | 'POST' | 'CLOSED'
      }
    })
  )
  return results
    .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
    .map(r => r.value)
}

// In-memory cache (resets on cold start, good enough for MVP)
let cache: { data: any[]; ts: number } | null = null
const CACHE_TTL = 60_000 // 1 minute

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') // 'crypto' | 'stocks' | 'all'

  // Return cache if fresh
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    const filtered = type === 'crypto'
      ? cache.data.filter(a => a.type === 'crypto')
      : type === 'stocks'
      ? cache.data.filter(a => a.type === 'stock')
      : cache.data
    return NextResponse.json({ data: filtered, cached: true, ts: cache.ts })
  }

  try {
    const [cryptos, stocks] = await Promise.allSettled([fetchCrypto(), fetchStocks()])

    const cryptoData = cryptos.status === 'fulfilled' ? cryptos.value : []
    const stockData  = stocks.status  === 'fulfilled' ? stocks.value  : []
    const all = [...cryptoData, ...stockData]

    if (all.length > 0) {
      cache = { data: all, ts: Date.now() }
    }

    const filtered = type === 'crypto' ? cryptoData : type === 'stocks' ? stockData : all
    return NextResponse.json({
      data: filtered,
      cached: false,
      ts: Date.now(),
      errors: {
        crypto: cryptos.status === 'rejected' ? cryptos.reason?.message : null,
        stocks: stocks.status  === 'rejected' ? stocks.reason?.message  : null,
      },
    })
  } catch (err: any) {
    // Return stale cache if available
    if (cache) {
      return NextResponse.json({ data: cache.data, cached: true, stale: true, ts: cache.ts })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
