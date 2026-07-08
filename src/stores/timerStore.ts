import { create } from 'zustand'

const STORAGE_KEY = 'designtimer:timer'

type PersistedTimer = {
  running: boolean
  startedAt: number | null
  accumulatedMs: number
}

type TimerState = PersistedTimer & {
  tick: number
  start: () => void
  pause: () => void
  reset: () => void
  getElapsedMs: () => number
  _tick: () => void
}

function loadTimer(): PersistedTimer {
  if (typeof localStorage === 'undefined') {
    return { running: false, startedAt: null, accumulatedMs: 0 }
  }
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return { running: false, startedAt: null, accumulatedMs: 0 }
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedTimer>
    const running = typeof parsed.running === 'boolean' ? parsed.running : false
    const startedAt =
      typeof parsed.startedAt === 'number' ? parsed.startedAt : null
    const accumulatedMs =
      typeof parsed.accumulatedMs === 'number' && parsed.accumulatedMs >= 0
        ? parsed.accumulatedMs
        : 0
    // Si estaba corriendo, absorbe el tiempo transcurrido desde el último tick
    // hacia accumulatedMs y para el timer al restaurar (más seguro que auto-continuar).
    if (running && startedAt !== null) {
      const delta = Math.max(0, Date.now() - startedAt)
      return {
        running: false,
        startedAt: null,
        accumulatedMs: accumulatedMs + delta
      }
    }
    return { running: false, startedAt: null, accumulatedMs }
  } catch {
    return { running: false, startedAt: null, accumulatedMs: 0 }
  }
}

function persist(state: PersistedTimer): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      running: state.running,
      startedAt: state.startedAt,
      accumulatedMs: state.accumulatedMs
    })
  )
}

export const useTimerStore = create<TimerState>((set, get) => {
  const initial = loadTimer()
  return {
    ...initial,
    tick: 0,

    start: () => {
      if (get().running) return
      set({ running: true, startedAt: Date.now() })
      persist(get())
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
      persist(get())
    },

    reset: () => {
      set({ running: false, startedAt: null, accumulatedMs: 0, tick: 0 })
      persist(get())
    },

    getElapsedMs: () => {
      const { running, startedAt, accumulatedMs } = get()
      if (running && startedAt !== null) {
        return accumulatedMs + (Date.now() - startedAt)
      }
      return accumulatedMs
    },

    _tick: () => set((s) => ({ tick: s.tick + 1 }))
  }
})

let intervalId: ReturnType<typeof setInterval> | null = null

export function startTickerOnce(): void {
  if (intervalId !== null) return
  intervalId = setInterval(() => {
    const s = useTimerStore.getState()
    if (s.running) {
      s._tick()
    }
  }, 100)
}

// Guardar el estado periódicamente mientras corre, para no perder progreso
// si la app se cierra abruptamente.
let saverId: ReturnType<typeof setInterval> | null = null
export function startPeriodicSaveOnce(): void {
  if (saverId !== null) return
  saverId = setInterval(() => {
    const s = useTimerStore.getState()
    if (s.running && s.startedAt !== null) {
      // Reescribimos startedAt = ahora y trasladamos el delta a accumulated,
      // así el estado guardado siempre refleja el tiempo real trabajado
      // sin importar cuándo se leyó.
      const now = Date.now()
      const delta = now - s.startedAt
      useTimerStore.setState({
        accumulatedMs: s.accumulatedMs + delta,
        startedAt: now
      })
      persist(useTimerStore.getState())
    }
  }, 5000)
}
