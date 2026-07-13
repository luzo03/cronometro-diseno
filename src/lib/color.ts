export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16)
  ]
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number): string =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex)
  return rgbToHex(
    r + (255 - r) * amount,
    g + (255 - g) * amount,
    b + (255 - b) * amount
  )
}

export function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex)
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount))
}

export function rgbTriplet(hex: string): string {
  const [r, g, b] = hexToRgb(hex)
  return `${r} ${g} ${b}`
}

export function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex)
}

export function normalizeHex(input: string): string | null {
  let s = input.trim()
  if (!s.startsWith('#')) s = `#${s}`
  if (s.length === 4) {
    // #abc → #aabbcc
    const [, a, b, c] = s
    s = `#${a}${a}${b}${b}${c}${c}`
  }
  return isValidHex(s) ? s.toUpperCase() : null
}

export type AccentPreset = {
  name: string
  hex: string
}

export const accentPresets: AccentPreset[] = [
  { name: 'Menta', hex: '#5EEAD4' },
  { name: 'Azul', hex: '#60A5FA' },
  { name: 'Púrpura', hex: '#A78BFA' },
  { name: 'Rosa', hex: '#F472B6' },
  { name: 'Rojo', hex: '#F87171' },
  { name: 'Naranja', hex: '#FB923C' },
  { name: 'Ámbar', hex: '#FCD34D' },
  { name: 'Esmeralda', hex: '#34D399' },
  { name: 'Cielo', hex: '#38BDF8' },
  { name: 'Lima', hex: '#A3E635' }
]
