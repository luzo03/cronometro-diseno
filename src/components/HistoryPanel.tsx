import { useState } from 'react'
import { Trash2, Download, Check, AlertCircle, Folder } from 'lucide-react'
import { useJobsStore } from '@/stores/jobsStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { findCurrency } from '@/lib/currencies'
import { compare, formatMoney, formatTime } from '@/lib/format'
import { jobsInPeriod } from '@/lib/stats'
import { jobsToCSV, rangeLabels, suggestedFilename } from '@/lib/export'
import type { ExportRange } from '@/lib/export'

export default function HistoryPanel(): JSX.Element {
  const jobs = useJobsStore((s) => s.jobs)
  const removeJob = useJobsStore((s) => s.removeJob)
  const customCurrencies = useSettingsStore((s) => s.customCurrencies)

  return (
    <div className="flex flex-col">
      <ExportBar disabled={jobs.length === 0} />
      {jobs.length === 0 ? (
        <div className="px-4 py-10 text-center text-chalk-30 text-[11px]">
          Aún no hay trabajos guardados.
        </div>
      ) : (
        <Content />
      )}
    </div>
  )

  function Content(): JSX.Element {
    const totals = new Map<string, { charged: number; realCost: number; ms: number }>()
    for (const j of jobs) {
      const t = totals.get(j.currency) ?? { charged: 0, realCost: 0, ms: 0 }
      const { realCost } = compare(j.charged, j.elapsedMs, j.hourlyRate)
      t.charged += j.charged
      t.realCost += realCost
      t.ms += j.elapsedMs
      totals.set(j.currency, t)
    }

    return (
      <div className="flex flex-col gap-2.5 px-3 pb-3 pt-1 no-drag">
        <div className="text-[9px] uppercase tracking-[0.18em] text-chalk-30 px-1 pt-1">
          Totales
        </div>

        {[...totals.entries()].map(([code, t]) => {
          const cur = findCurrency(code, customCurrencies)
          const diff = t.charged - t.realCost
          const profitable = diff >= 0
          const diffColor = profitable ? '#5EEAD4' : '#F87171'
          return (
            <div
              key={`total-${code}`}
              className="px-3 py-2.5 rounded-xl bg-mint-dim border border-mint/30 flex flex-col gap-1"
            >
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] uppercase tracking-wider text-mint font-medium">
                  {code}
                </span>
                <span className="font-mono tabular-nums text-[11px] text-chalk-70">
                  {formatTime(t.ms)}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-chalk-50">Cobrado</span>
                <span className="font-mono tabular-nums">
                  {formatMoney(t.charged, cur)}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-chalk-50">Costo real</span>
                <span className="font-mono tabular-nums">
                  {formatMoney(t.realCost, cur)}
                </span>
              </div>
              <div
                className="flex justify-between text-[12px] font-semibold mt-0.5"
                style={{ color: diffColor }}
              >
                <span>Diferencia</span>
                <span className="font-mono tabular-nums">
                  {diff >= 0 ? '+' : ''}
                  {formatMoney(diff, cur)}
                </span>
              </div>
            </div>
          )
        })}

        <div className="text-[9px] uppercase tracking-[0.18em] text-chalk-30 px-1 pt-1">
          Trabajos · {jobs.length}
        </div>

        {jobs.map((j) => {
          const cur = findCurrency(j.currency, customCurrencies)
          const { diff, effectiveRate } = compare(j.charged, j.elapsedMs, j.hourlyRate)
          const profitable = diff >= 0
          const diffColor = profitable ? '#5EEAD4' : '#F87171'
          return (
            <div
              key={j.id}
              className="px-3 py-2 rounded-xl bg-ink-700/70 border border-chalk-08 group hover:border-chalk-15 transition-colors"
            >
              <div className="flex justify-between items-center gap-2 mb-1">
                <span className="font-medium truncate flex-1 text-[12px]">
                  {j.name || <span className="text-chalk-30">Sin nombre</span>}
                </span>
                <span className="font-mono tabular-nums text-[10px] text-chalk-50">
                  {formatTime(j.elapsedMs)}
                </span>
                <button
                  onClick={() => removeJob(j.id)}
                  className="opacity-0 group-hover:opacity-100 text-chalk-50 hover:text-[#F87171] transition"
                  title="Eliminar"
                >
                  <Trash2 size={11} />
                </button>
              </div>
              <div className="flex justify-between items-baseline text-[10px]">
                <span className="font-mono tabular-nums text-chalk-50">
                  {formatMoney(effectiveRate, cur)}/h ef.
                </span>
                <span
                  className="font-mono tabular-nums font-semibold"
                  style={{ color: diffColor }}
                >
                  {diff >= 0 ? '+' : ''}
                  {formatMoney(diff, cur)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    )
  }
}

type ExportStatus =
  | { kind: 'idle' }
  | { kind: 'working' }
  | { kind: 'done'; path: string }
  | { kind: 'error'; msg: string }

function ExportBar({ disabled }: { disabled: boolean }): JSX.Element {
  const jobs = useJobsStore((s) => s.jobs)
  const [range, setRange] = useState<ExportRange>('all')
  const [status, setStatus] = useState<ExportStatus>({ kind: 'idle' })

  async function handleExport(): Promise<void> {
    if (disabled) return
    const filtered = range === 'all' ? jobs : jobsInPeriod(jobs, range)
    if (filtered.length === 0) {
      setStatus({ kind: 'error', msg: 'Sin trabajos en este periodo' })
      setTimeout(() => setStatus({ kind: 'idle' }), 2500)
      return
    }
    setStatus({ kind: 'working' })
    const content = jobsToCSV(filtered)
    const result = await window.api?.file.saveCSV({
      content,
      suggestedName: suggestedFilename(range)
    })
    if (!result || result.canceled) {
      setStatus({ kind: 'idle' })
      return
    }
    if (result.ok && result.path) {
      setStatus({ kind: 'done', path: result.path })
      setTimeout(() => setStatus({ kind: 'idle' }), 4000)
      return
    }
    setStatus({ kind: 'error', msg: result.error ?? 'Error al guardar' })
    setTimeout(() => setStatus({ kind: 'idle' }), 4000)
  }

  return (
    <div className="px-3 pt-3 pb-2 no-drag border-b border-chalk-05">
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <span className="text-[9px] uppercase tracking-[0.18em] text-chalk-30">
          Exportar reporte
        </span>
        {status.kind === 'done' && (
          <button
            onClick={() => window.api?.file.revealInFolder(status.path)}
            className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-mint hover:text-mint-soft"
            title={status.path}
          >
            <Folder size={10} />
            Ver
          </button>
        )}
      </div>
      <div className="flex gap-1.5">
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as ExportRange)}
          className="px-2 py-1.5 rounded-lg bg-ink-700 border border-chalk-08 text-chalk text-[11px] focus-mint transition cursor-pointer"
        >
          {(Object.keys(rangeLabels) as ExportRange[]).map((r) => (
            <option key={r} value={r}>
              {rangeLabels[r]}
            </option>
          ))}
        </select>
        <button
          onClick={handleExport}
          disabled={disabled || status.kind === 'working'}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-mint hover:bg-mint-soft text-ink text-[11px] font-semibold transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {status.kind === 'done' ? (
            <>
              <Check size={11} />
              Guardado
            </>
          ) : status.kind === 'error' ? (
            <>
              <AlertCircle size={11} />
              {status.msg}
            </>
          ) : status.kind === 'working' ? (
            <>Guardando…</>
          ) : (
            <>
              <Download size={11} />
              Exportar CSV
            </>
          )}
        </button>
      </div>
    </div>
  )
}
