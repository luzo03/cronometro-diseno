import { create } from 'zustand'

const STORAGE_KEY = 'designtimer:jobs'

export type Job = {
  id: string
  name: string
  charged: number
  currency: string
  elapsedMs: number
  hourlyRate: number
  createdAt: number
}

type JobsState = {
  jobs: Job[]
  addJob: (job: Omit<Job, 'id' | 'createdAt'>) => Job
  removeJob: (id: string) => void
  clearAll: () => void
}

function loadJobs(): Job[] {
  if (typeof localStorage === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as Job[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persist(jobs: Job[]): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs))
}

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export const useJobsStore = create<JobsState>((set, get) => ({
  jobs: loadJobs(),

  addJob: (partial) => {
    const job: Job = {
      ...partial,
      id: makeId(),
      createdAt: Date.now()
    }
    const next = [job, ...get().jobs]
    set({ jobs: next })
    persist(next)
    return job
  },

  removeJob: (id) => {
    const next = get().jobs.filter((j) => j.id !== id)
    set({ jobs: next })
    persist(next)
  },

  clearAll: () => {
    set({ jobs: [] })
    persist([])
  }
}))
