const NEUTRAL = 'rgba(250, 250, 250, 0.45)'
const GREEN = '#5EEAD4'
const YELLOW = '#FCD34D'
const RED = '#F87171'

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16)
  ]
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number): string => Math.round(n).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function lerpHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t)
}

export function progressColor(ratio: number): string {
  if (!Number.isFinite(ratio) || ratio <= 0) return NEUTRAL
  if (ratio < 0.6) return GREEN
  if (ratio < 0.85) {
    const t = (ratio - 0.6) / 0.25
    return lerpHex(GREEN, YELLOW, t)
  }
  if (ratio < 1.0) {
    const t = (ratio - 0.85) / 0.15
    return lerpHex(YELLOW, RED, t)
  }
  return RED
}

export function computeRatio(elapsedMs: number, charged: number, hourlyRate: number): number {
  if (charged <= 0 || hourlyRate <= 0) return 0
  const budgetMs = (charged / hourlyRate) * 3_600_000
  if (budgetMs <= 0) return 0
  return elapsedMs / budgetMs
}
