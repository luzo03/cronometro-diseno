import { create } from 'zustand'

type TimerState = {
  running: boolean
  startedAt: number | null
  accumulatedMs: number
  tick: number
  start: () => void
  pause: () => void
  reset: () => void
  getElapsedMs: () => number
  _tick: () => void
}

export const useTimerStore = create<TimerState>((set, get) => ({
  running: false,
  startedAt: null,
  accumulatedMs: 0,
  tick: 0,

  start: () => {
    if (get().running) return
    set({ running: true, startedAt: Date.now() })
  },

  pause: () => {
    const { running, startedAt, accumulatedMs } = get()
    if (!running || startedAt === null) return
    const now = Date.now()
    set({
      running: false,
      startedAt: null,
      accumulatedMs: accumulatedMs + (now - startedAt)
    })
  },

  reset: () => {
    set({ running: false, startedAt: null, accumulatedMs: 0, tick: 0 })
  },

  getElapsedMs: () => {
    const { running, startedAt, accumulatedMs } = get()
    if (running && startedAt !== null) {
      return accumulatedMs + (Date.now() - startedAt)
    }
    return accumulatedMs
  },

  _tick: () => set((s) => ({ tick: s.tick + 1 }))
}))

let intervalId: ReturnType<typeof setInterval> | null = null

export function startTickerOnce(): void {
  if (intervalId !== null) return
  intervalId = setInterval(() => {
    if (useTimerStore.getState().running) {
      useTimerStore.getState()._tick()
    }
  }, 100)
}
