import type { Job } from '@/stores/jobsStore'

export type Period = 'day' | 'week' | 'month'

export function startOfDay(d: Date = new Date()): number {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x.getTime()
}

export function startOfWeek(d: Date = new Date()): number {
  // Semana inicia lunes (ISO)
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  const day = x.getDay() // 0=dom, 1=lun, ..., 6=sab
  const diff = day === 0 ? 6 : day - 1
  x.setDate(x.getDate() - diff)
  return x.getTime()
}

export function startOfMonth(d: Date = new Date()): number {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  x.setDate(1)
  return x.getTime()
}

export function jobsInPeriod(jobs: Job[], period: Period): Job[] {
  const since =
    period === 'day' ? startOfDay() : period === 'week' ? startOfWeek() : startOfMonth()
  return jobs.filter((j) => j.createdAt >= since)
}

export function totalMs(jobs: Job[]): number {
  return jobs.reduce((acc, j) => acc + j.elapsedMs, 0)
}

export function totalHours(jobs: Job[]): number {
  return totalMs(jobs) / 3_600_000
}

export type EarningsByCurrency = Record<string, number>

export function totalChargedByCurrency(jobs: Job[]): EarningsByCurrency {
  const out: EarningsByCurrency = {}
  for (const j of jobs) {
    out[j.currency] = (out[j.currency] ?? 0) + j.charged
  }
  return out
}
