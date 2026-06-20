export type Currency = {
  code: string
  symbol: string
  name: string
  locale: string
}

export const presetCurrencies: Currency[] = [
  { code: 'MXN', symbol: '$', name: 'Peso mexicano', locale: 'es-MX' },
  { code: 'USD', symbol: '$', name: 'Dólar EEUU', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'es-ES' },
  { code: 'COP', symbol: '$', name: 'Peso colombiano', locale: 'es-CO' }
]

export function findCurrency(
  code: string,
  customCurrencies: Currency[] = []
): Currency {
  const all = [...presetCurrencies, ...customCurrencies]
  return all.find((c) => c.code === code) ?? presetCurrencies[0]
}
