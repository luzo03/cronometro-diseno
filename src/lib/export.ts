import type { Job } from '@/stores/jobsStore'
import { compare } from '@/lib/format'

export type ExportRange = 'all' | 'day' | 'week' | 'month'

export const rangeLabels: Record<ExportRange, string> = {
  all: 'Todo',
  day: 'Hoy',
  week: 'Esta semana',
  month: 'Este mes'
}

function csvEscape(value: string | number): string {
  const s = String(value)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function formatDateISO(ms: number): string {
  const d = new Date(ms)
  const pad = (n: number): string => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatDurationHMS(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const pad = (n: number): string => n.toString().padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

export function jobsToCSV(jobs: Job[]): string {
  const headers = [
    'Fecha',
    'Nombre',
    'Tiempo (hh:mm:ss)',
    'Horas',
    'Moneda',
    'Cobrado',
    'Tarifa/h',
    'Costo real',
    'Diferencia',
    'Tarifa efectiva/h',
    'Rentable'
  ]

  const rows = jobs.map((j) => {
    const { hours, realCost, diff, effectiveRate, profitable } = compare(
      j.charged,
      j.elapsedMs,
      j.hourlyRate
    )
    return [
      formatDateISO(j.createdAt),
      j.name || '(sin nombre)',
      formatDurationHMS(j.elapsedMs),
      hours.toFixed(4),
      j.currency,
      j.charged.toFixed(2),
      j.hourlyRate.toFixed(2),
      realCost.toFixed(2),
      diff.toFixed(2),
      effectiveRate.toFixed(2),
      profitable ? 'Sí' : 'No'
    ]
  })

  const lines = [
    headers.map(csvEscape).join(','),
    ...rows.map((row) => row.map(csvEscape).join(','))
  ]
  // BOM para Excel reconozca UTF-8 correctamente
  return '﻿' + lines.join('\r\n')
}

export function suggestedFilename(range: ExportRange): string {
  const d = new Date()
  const pad = (n: number): string => n.toString().padStart(2, '0')
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
  const slug = { all: 'todo', day: 'hoy', week: 'semana', month: 'mes' }[range]
  return `designtimer-${slug}-${stamp}.csv`
}
