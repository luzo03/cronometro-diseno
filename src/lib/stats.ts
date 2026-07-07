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

export function totalChargedInCurrency(jobs: Job[], code: string): number {
  return jobs
    .filter((j) => j.currency === code)
    .reduce((acc, j) => acc + j.charged, 0)
}

export type Effectiveness = {
  effectiveMs: number // tiempo dentro del presupuesto (te lo pagaron)
  lostMs: number // tiempo que te pasaste del presupuesto (no cobrado)
  totalMs: number
  ratio: number // 0..1 — 1 = todo efectivo
}

export function jobEffectiveness(job: Job): Effectiveness {
  const budgetMs =
    job.hourlyRate > 0 && job.charged > 0
      ? (job.charged / job.hourlyRate) * 3_600_000
      : job.elapsedMs
  const effectiveMs = Math.min(job.elapsedMs, budgetMs)
  const lostMs = Math.max(0, job.elapsedMs - budgetMs)
  const totalMs = job.elapsedMs
  const ratio = totalMs > 0 ? effectiveMs / totalMs : 1
  return { effectiveMs, lostMs, totalMs, ratio }
}

export function totalEffectiveness(jobs: Job[]): Effectiveness {
  let effectiveMs = 0
  let lostMs = 0
  for (const j of jobs) {
    const e = jobEffectiveness(j)
    effectiveMs += e.effectiveMs
    lostMs += e.lostMs
  }
  const totalMs = effectiveMs + lostMs
  const ratio = totalMs > 0 ? effectiveMs / totalMs : 1
  return { effectiveMs, lostMs, totalMs, ratio }
}
