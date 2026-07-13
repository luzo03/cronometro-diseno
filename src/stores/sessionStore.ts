import { create } from 'zustand'

const STORAGE_KEY = 'designtimer:session'

type PersistedSession = {
  active: boolean
  startedAt: number | null
  plannedMs: number
  // Snapshot al terminar la sesión — se muestra en el modal de resumen y se
  // limpia cuando el usuario cierra el resumen.
  lastSummary: {
    startedAt: number
    endedAt: number
    plannedMs: number
    workedMs: number
    jobsCount: number
  } | null
}

type SessionState = PersistedSession & {
  startSession: (plannedHours: number) => void
  endSession: (workedMs: number, jobsCount: number) => void
  dismissSummary: () => void
}

function defaults(): PersistedSession {
  return {
    active: false,
    startedAt: null,
    plannedMs: 0,
    lastSummary: null
  }
}

function load(): PersistedSession {
  if (typeof localStorage === 'undefined') return defaults()
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return defaults()
  try {
    const p = JSON.parse(raw) as Partial<PersistedSession>
    return {
      active: !!p.active,
      startedAt:
        typeof p.startedAt === 'number' && p.startedAt > 0 ? p.startedAt : null,
      plannedMs:
        typeof p.plannedMs === 'number' && p.plannedMs > 0 ? p.plannedMs : 0,
      lastSummary:
        p.lastSummary && typeof p.lastSummary === 'object'
          ? {
              startedAt: (p.lastSummary as { startedAt: number }).startedAt,
              endedAt: (p.lastSummary as { endedAt: number }).endedAt,
              plannedMs: (p.lastSummary as { plannedMs: number }).plannedMs,
              workedMs: (p.lastSummary as { workedMs: number }).workedMs,
              jobsCount: (p.lastSummary as { jobsCount: number }).jobsCount
            }
          : null
    }
  } catch {
    return defaults()
  }
}

function persist(state: PersistedSession): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      active: state.active,
      startedAt: state.startedAt,
      plannedMs: state.plannedMs,
      lastSummary: state.lastSummary
    })
  )
}

export const useSessionStore = create<SessionState>((set, get) => ({
  ...load(),

  startSession: (hours) => {
    const plannedMs = Math.max(0, hours) * 3_600_000
    if (plannedMs <= 0) return
    set({
      active: true,
      startedAt: Date.now(),
      plannedMs,
      lastSummary: null
    })
    persist(get())
  },

  endSession: (workedMs, jobsCount) => {
    const s = get()
    if (!s.active || s.startedAt === null) return
    set({
      active: false,
      startedAt: null,
      plannedMs: 0,
      lastSummary: {
        startedAt: s.startedAt,
        endedAt: Date.now(),
        plannedMs: s.plannedMs,
        workedMs,
        jobsCount
      }
    })
    persist(get())
  },

  dismissSummary: () => {
    set({ lastSummary: null })
    persist(get())
  }
}))
