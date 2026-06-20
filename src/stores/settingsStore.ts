import { create } from 'zustand'
import type { Currency } from '@/lib/currencies'
import { presetCurrencies } from '@/lib/currencies'

const STORAGE_KEY = 'designtimer:settings'

type PersistedSettings = {
  hourlyRate: number
  currencyCode: string
  customCurrencies: Currency[]
  alwaysOnTop: boolean
}

type SettingsState = PersistedSettings & {
  setHourlyRate: (rate: number) => void
  setCurrencyCode: (code: string) => void
  addCurrency: (currency: Currency) => void
  removeCurrency: (code: string) => void
  setAlwaysOnTop: (flag: boolean) => void
  allCurrencies: () => Currency[]
}

function loadSettings(): PersistedSettings {
  if (typeof localStorage === 'undefined') {
    return defaultSettings()
  }
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return defaultSettings()
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedSettings>
    return {
      hourlyRate: typeof parsed.hourlyRate === 'number' ? parsed.hourlyRate : 0,
      currencyCode: typeof parsed.currencyCode === 'string' ? parsed.currencyCode : 'MXN',
      customCurrencies: Array.isArray(parsed.customCurrencies) ? parsed.customCurrencies : [],
      alwaysOnTop: typeof parsed.alwaysOnTop === 'boolean' ? parsed.alwaysOnTop : true
    }
  } catch {
    return defaultSettings()
  }
}

function defaultSettings(): PersistedSettings {
  return {
    hourlyRate: 0,
    currencyCode: 'MXN',
    customCurrencies: [],
    alwaysOnTop: true
  }
}

function persist(state: PersistedSettings): void {
  if (typeof localStorage === 'undefined') return
  const toSave: PersistedSettings = {
    hourlyRate: state.hourlyRate,
    currencyCode: state.currencyCode,
    customCurrencies: state.customCurrencies,
    alwaysOnTop: state.alwaysOnTop
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
}

export const useSettingsStore = create<SettingsState>((set, get) => {
  const initial = loadSettings()
  return {
    ...initial,

    setHourlyRate: (rate) => {
      set({ hourlyRate: rate })
      persist(get())
    },

    setCurrencyCode: (code) => {
      set({ currencyCode: code })
      persist(get())
    },

    addCurrency: (currency) => {
      const exists = get().customCurrencies.some((c) => c.code === currency.code)
      const presetExists = presetCurrencies.some((c) => c.code === currency.code)
      if (exists || presetExists) return
      set({ customCurrencies: [...get().customCurrencies, currency] })
      persist(get())
    },

    removeCurrency: (code) => {
      set({
        customCurrencies: get().customCurrencies.filter((c) => c.code !== code)
      })
      if (get().currencyCode === code) {
        set({ currencyCode: 'MXN' })
      }
      persist(get())
    },

    setAlwaysOnTop: (flag) => {
      set({ alwaysOnTop: flag })
      persist(get())
    },

    allCurrencies: () => [...presetCurrencies, ...get().customCurrencies]
  }
})
