import { create } from 'zustand'
import type { Currency } from '@/lib/currencies'
import { presetCurrencies } from '@/lib/currencies'

const STORAGE_KEY = 'designtimer:settings'

export type MoneyGoals = { day: number; week: number; month: number }
export type ProductivityMode = 'hours' | 'money'

type PersistedSettings = {
  hourlyRate: number
  currencyCode: string
  customCurrencies: Currency[]
  alwaysOnTop: boolean
  goalDailyHours: number
  goalWeeklyHours: number
  goalMonthlyHours: number
  moneyGoals: Record<string, MoneyGoals>
  productivityMode: ProductivityMode
  zoomFactor: number
  accentColor: string
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
  setMoneyGoal: (
    currency: string,
    period: 'day' | 'week' | 'month',
    value: number
  ) => void
  getMoneyGoals: (currency: string) => MoneyGoals
  setProductivityMode: (mode: ProductivityMode) => void
  setZoomFactor: (factor: number) => void
  setAccentColor: (color: string) => void
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
    goalMonthlyHours: 120,
    moneyGoals: {},
    productivityMode: 'hours',
    zoomFactor: 1,
    accentColor: '#5EEAD4'
  }
}

function normalizeMoneyGoals(raw: unknown): Record<string, MoneyGoals> {
  if (!raw || typeof raw !== 'object') return {}
  const out: Record<string, MoneyGoals> = {}
  for (const [code, v] of Object.entries(raw as Record<string, unknown>)) {
    if (v && typeof v === 'object') {
      const g = v as Partial<MoneyGoals>
      out[code] = {
        day: typeof g.day === 'number' ? g.day : 0,
        week: typeof g.week === 'number' ? g.week : 0,
        month: typeof g.month === 'number' ? g.month : 0
      }
    }
  }
  return out
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
          : d.goalMonthlyHours,
      moneyGoals: normalizeMoneyGoals(parsed.moneyGoals),
      productivityMode:
        parsed.productivityMode === 'money' ? 'money' : 'hours',
      zoomFactor:
        typeof parsed.zoomFactor === 'number' && parsed.zoomFactor > 0
          ? Math.max(0.7, Math.min(1.6, parsed.zoomFactor))
          : d.zoomFactor,
      accentColor:
        typeof parsed.accentColor === 'string' &&
        /^#[0-9A-Fa-f]{6}$/.test(parsed.accentColor)
          ? parsed.accentColor.toUpperCase()
          : d.accentColor
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
    goalMonthlyHours: state.goalMonthlyHours,
    moneyGoals: state.moneyGoals,
    productivityMode: state.productivityMode,
    zoomFactor: state.zoomFactor,
    accentColor: state.accentColor
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

    setMoneyGoal: (currency, period, value) => {
      const existing = get().moneyGoals[currency] ?? { day: 0, week: 0, month: 0 }
      const next = {
        ...get().moneyGoals,
        [currency]: { ...existing, [period]: Math.max(0, value) }
      }
      set({ moneyGoals: next })
      persist(get())
    },

    getMoneyGoals: (currency) =>
      get().moneyGoals[currency] ?? { day: 0, week: 0, month: 0 },

    setProductivityMode: (mode) => {
      set({ productivityMode: mode })
      persist(get())
    },

    setZoomFactor: (factor) => {
      const clamped = Math.max(0.7, Math.min(1.6, factor))
      set({ zoomFactor: clamped })
      persist(get())
    },

    setAccentColor: (color) => {
      if (!/^#[0-9A-Fa-f]{6}$/.test(color)) return
      set({ accentColor: color.toUpperCase() })
      persist(get())
    },

    allCurrencies: () => [...presetCurrencies, ...get().customCurrencies]
  }
})
