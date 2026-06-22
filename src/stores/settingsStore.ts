import { create } from 'zustand'
import type { Currency } from '@/lib/currencies'
import { presetCurrencies } from '@/lib/currencies'

const STORAGE_KEY = 'designtimer:settings'

type PersistedSettings = {
  hourlyRate: number
  currencyCode: string
  customCurrencies: Currency[]
  alwaysOnTop: boolean
  goalDailyHours: number
  goalWeeklyHours: number
  goalMonthlyHours: number
}

type SettingsState = PersistedSettings & {
  setHourlyRate: (rate: number) => void
  setCurrencyCode: (code: string) => void
  addCurrency: (currency: Currency) => void
  removeCurrency: (code: string) => void
  setAlwaysOnTop: (flag: boolean) => void
  setGoalDailyHours: (h: number) => void
  setGoalWeeklyHours: (h: number) => void
  setGoalMonthlyHours: (h: number) => void
  allCurrencies: () => Currency[]
}

function defaultSettings(): PersistedSettings {
  return {
    hourlyRate: 0,
    currencyCode: 'MXN',
    customCurrencies: [],
    alwaysOnTop: true,
    goalDailyHours: 6,
    goalWeeklyHours: 30,
    goalMonthlyHours: 120
  }
}

function loadSettings(): PersistedSettings {
  if (typeof localStorage === 'undefined') return defaultSettings()
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return defaultSettings()
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedSettings>
    const d = defaultSettings()
    return {
      hourlyRate: typeof parsed.hourlyRate === 'number' ? parsed.hourlyRate : d.hourlyRate,
      currencyCode:
        typeof parsed.currencyCode === 'string' ? parsed.currencyCode : d.currencyCode,
      customCurrencies: Array.isArray(parsed.customCurrencies)
        ? parsed.customCurrencies
        : d.customCurrencies,
      alwaysOnTop:
        typeof parsed.alwaysOnTop === 'boolean' ? parsed.alwaysOnTop : d.alwaysOnTop,
      goalDailyHours:
        typeof parsed.goalDailyHours === 'number' ? parsed.goalDailyHours : d.goalDailyHours,
      goalWeeklyHours:
        typeof parsed.goalWeeklyHours === 'number' ? parsed.goalWeeklyHours : d.goalWeeklyHours,
      goalMonthlyHours:
        typeof parsed.goalMonthlyHours === 'number'
          ? parsed.goalMonthlyHours
          : d.goalMonthlyHours
    }
  } catch {
    return defaultSettings()
  }
}

function persist(state: PersistedSettings): void {
  if (typeof localStorage === 'undefined') return
  const toSave: PersistedSettings = {
    hourlyRate: state.hourlyRate,
    currencyCode: state.currencyCode,
    customCurrencies: state.customCurrencies,
    alwaysOnTop: state.alwaysOnTop,
    goalDailyHours: state.goalDailyHours,
    goalWeeklyHours: state.goalWeeklyHours,
    goalMonthlyHours: state.goalMonthlyHours
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

    setGoalDailyHours: (h) => {
      set({ goalDailyHours: Math.max(0, h) })
      persist(get())
    },

    setGoalWeeklyHours: (h) => {
      set({ goalWeeklyHours: Math.max(0, h) })
      persist(get())
    },

    setGoalMonthlyHours: (h) => {
      set({ goalMonthlyHours: Math.max(0, h) })
      persist(get())
    },

    allCurrencies: () => [...presetCurrencies, ...get().customCurrencies]
  }
})
