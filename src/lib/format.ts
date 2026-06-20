import type { Currency } from './currencies'

export function formatTime(ms: number): string {
  if (ms < 0) ms = 0
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const pad = (n: number): string => n.toString().padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

export function formatMoney(amount: number, currency: Currency): string {
  try {
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: isStandardCurrencyCode(currency.code) ? currency.code : 'USD',
      maximumFractionDigits: 2
    }).format(amount)
  } catch {
    return `${currency.symbol}${amount.toFixed(2)} ${currency.code}`
  }
}

function isStandardCurrencyCode(code: string): boolean {
  return /^[A-Z]{3}$/.test(code)
}

export type Comparison = {
  hours: number
  realCost: number
  diff: number
  effectiveRate: number
  profitable: boolean
}

export function compare(charged: number, elapsedMs: number, hourlyRate: number): Comparison {
  const hours = elapsedMs / 3_600_000
  const realCost = hours * hourlyRate
  const diff = charged - realCost
  const effectiveRate = hours > 0 ? charged / hours : 0
  return { hours, realCost, diff, effectiveRate, profitable: diff >= 0 }
}
